// Disabled after restoring the pre-experiment handoff checkpoint. The main
// loader no longer attaches render timing or honors power/transmission URL
// overrides. Diagnostic utilities remain here as an inactive reference.
// If basic recording is explicitly re-enabled, copy its report after loading:
// copy(window.__orbitHandoffPerformance.toText())
// No per-frame logging, DOM measurements or React state updates. Optional GPU
// timing uses asynchronous queries without waiting for completion.
export const HANDOFF_PERFORMANCE_DEBUG = import.meta.env.DEV && false
// Enable only for the next CPU/GPU isolation recording. GPU timing is optional
// (EXT_disjoint_timer_query_webgl2); results are polled without waiting/finish().
export const HANDOFF_RENDER_TIMING_DEBUG = import.meta.env.DEV && false
// Controlled refresh-to-refresh comparison. Production builds ignore these
// parameters. C changes only the renderer's public transmission target scale;
// its fixed size is prepared before playback, never adapted during travel.
const comparisonParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
// Read once on page load; WebGL power hints are context-creation options.
// Missing/invalid values and production builds preserve the existing default.
export const HANDOFF_POWER_PREFERENCE = comparisonParams?.get('handoffPower') === 'high'
  ? 'high-performance' : 'low-power'
export const HANDOFF_TRANSMISSION_MODE = comparisonParams?.get('handoffTransmission') === 'off'
  ? 'off' : comparisonParams?.get('handoffTransmission') === 'scaled' ? 'scaled' : 'on'
export const HANDOFF_TRANSMISSION_BYPASS = HANDOFF_TRANSMISSION_MODE === 'off'
const requestedScale = Number(comparisonParams?.get('handoffTransmissionScale') ?? 0.5)
export const HANDOFF_TRANSMISSION_TARGET_SCALE = HANDOFF_TRANSMISSION_MODE === 'scaled'
  ? Math.min(1, Math.max(0.25, Number.isFinite(requestedScale) ? requestedScale : 0.5)) : 1

export function createHandoffPerformanceRecorder() {
  const report = {
    frames: [], events: [], renderTimings: [], domTimings: [], over25ms: 0, over40ms: 0, recordingComplete: false,
    note(type, state, details = {}) {
      report.events.push({ at: performance.now(), type, phase: state?.phase, timelineTime: state?.scanTime, ...details })
      if (report.events.length > 100) report.events.shift()
    },
    sample(delta, state, renderer, camera, scene) {
      if (state.scanProgress < 1 || normalFrames >= 30) return
      if (state.phase === 'complete') normalFrames += 1
      const at = performance.now()
      if (renderer !== rendererInstance) {
        rendererGeneration += 1
        report.note(rendererInstance ? 'renderer instance changed' : 'renderer instance first observed', state, { at, rendererGeneration })
        rendererInstance = renderer
      }
      const milliseconds = delta * 1000
      if (milliseconds > 25) report.over25ms += 1
      if (milliseconds > 40) report.over40ms += 1
      const canvas = renderer.domElement
      const frame = {
        at, intervalStart: previous?.at ?? at - milliseconds,
        milliseconds, phase: state.phase,
        wallIntervalMilliseconds: previous ? at - previous.at : null,
        previousPhase: previous?.phase,
        previousTimelineTime: previous?.timelineTime,
        timelineTime: state.scanTime, handoff: state.handoff,
        committed: state.handoffCommitted,
        rendererGeneration,
        cameraId: camera?.id, sceneId: scene?.id,
        drawingBufferWidth: canvas.width, drawingBufferHeight: canvas.height,
        transmissionResolutionScale: renderer.transmissionResolutionScale,
        // Derived from the installed renderer's documented sizing expression,
        // not a private render-target inspection. No Canvas size/DPR changes.
        estimatedTransmissionTargetWidth: Math.floor(canvas.width * renderer.transmissionResolutionScale),
        estimatedTransmissionTargetHeight: Math.floor(canvas.height * renderer.transmissionResolutionScale),
        programs: renderer.info.programs?.length,
        textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries,
        documentHidden: document.hidden,
      }
      if (previous) {
        const changedTargetInputs = ['rendererGeneration', 'cameraId', 'sceneId', 'transmissionResolutionScale', 'drawingBufferWidth', 'drawingBufferHeight']
          .filter(key => frame[key] !== previous[key])
        if (changedTargetInputs.length) {
          report.note('transmission target inputs changed', state, {
            at, changed: changedTargetInputs,
            from: { cameraId: previous.cameraId, sceneId: previous.sceneId, scale: previous.transmissionResolutionScale,
              width: previous.estimatedTransmissionTargetWidth, height: previous.estimatedTransmissionTargetHeight },
            to: { cameraId: frame.cameraId, sceneId: frame.sceneId, scale: frame.transmissionResolutionScale,
              width: frame.estimatedTransmissionTargetWidth, height: frame.estimatedTransmissionTargetHeight },
          })
        }
        if (frame.drawingBufferWidth !== previous.drawingBufferWidth || frame.drawingBufferHeight !== previous.drawingBufferHeight) {
          report.note('drawing-buffer dimensions changed', state, {
            at,
            from: [previous.drawingBufferWidth, previous.drawingBufferHeight],
            to: [frame.drawingBufferWidth, frame.drawingBufferHeight],
          })
        }
        for (const key of ['programs', 'textures', 'geometries']) {
          if (frame[key] !== previous[key]) {
            report.note(`renderer ${key} count changed`, state, {
              at,
              from: previous[key], to: frame[key], delta: frame[key] - previous[key],
            })
          }
        }
      }
      report.frames.push(frame)
      previous = frame
      if (report.frames.length > 600) report.frames.shift()
      report.recordingComplete = normalFrames >= 30
    },
    getReport() {
      // Correlate only when requested; keep the animation sampling path small.
      const prepared = report.events.filter(event => event.type === 'handoff preparation end').slice(-1)[0]
      const retentionMatchesWarmup = frame => prepared
        && frame.cameraId === prepared.cameraId && frame.sceneId === prepared.sceneId
        && frame.transmissionResolutionScale === prepared.transmissionResolutionScale
        && frame.drawingBufferWidth === prepared.drawingBufferWidth
        && frame.drawingBufferHeight === prepared.drawingBufferHeight
        && frame.rendererGeneration === 1
      const slowFrames = report.frames.filter(frame => frame.milliseconds > 25).map(frame => ({
        ...frame,
        coincidentEvents: report.events.filter(event => (event.intervalStart ?? event.at) <= frame.at && event.at >= frame.intervalStart),
        renderTimings: report.renderTimings.filter(timing => timing.at >= frame.intervalStart && timing.at <= frame.at),
        domTimings: report.domTimings.filter(timing => timing.at >= frame.intervalStart && timing.at <= frame.at),
      }))
      return {
        comparison: {
          requestedPowerPreference: HANDOFF_POWER_PREFERENCE,
          mode: HANDOFF_TRANSMISSION_BYPASS ? 'B: transmission bypassed during handoff'
            : HANDOFF_TRANSMISSION_MODE === 'scaled' ? 'C: scaled transmission target' : 'A: original full quality',
          transmissionBypass: HANDOFF_TRANSMISSION_BYPASS,
          candidateTransmissionScale: HANDOFF_TRANSMISSION_TARGET_SCALE,
          scope: 'A/B use the original full-resolution warmup. C prepares its fixed transmission-target size before playback. Only production loading is affected; original Hero materials and the previous renderer scale return on release.',
          candidateReleaseCaveat: HANDOFF_TRANSMISSION_MODE === 'scaled'
            ? 'Restoring the original renderer scale can reallocate the transmission target on the first normal Hero render. Include completion frames when evaluating C.' : null,
          devicePixelRatio: window.devicePixelRatio,
          viewportCssWidth: window.innerWidth, viewportCssHeight: window.innerHeight,
        },
        browserTimingSupport: report.browserTimingSupport ?? null,
        rendererInformation: report.rendererInformation ?? null,
        transmissionRetention: {
          warmupRecorded: Boolean(prepared),
          handoffMatchesPreparedTargetInputs: prepared && report.frames.some(frame => frame.phase === 'handoff')
            ? report.frames.filter(frame => frame.phase === 'handoff').every(retentionMatchesWarmup) : null,
          normalHeroMatchesPreparedTargetInputs: prepared && report.frames.some(frame => frame.phase === 'complete')
            ? report.frames.filter(frame => frame.phase === 'complete').every(retentionMatchesWarmup) : null,
          inputChanges: report.events.filter(event => event.type === 'transmission target inputs changed'),
          limitation: 'Checks public sizing inputs and scene/camera identity against warmup. It does not inspect private targets or prove driver residency; see context/resource events for other invalidation.',
          rendererPolicy: 'One internal target per scene/render-depth/camera. Size changes dispose its old allocation. The public API does not expose multiple retained sizes or a transmission-update cache switch.',
        },
        recordingComplete: report.recordingComplete,
        frameCount: report.frames.length,
        over25ms: report.over25ms, over40ms: report.over40ms,
        maximumFrameMs: report.frames.reduce((maximum, frame) => Math.max(maximum, frame.milliseconds), 0),
        preparation: report.events.filter(event => event.type.startsWith('handoff preparation') || event.type === 'transmission warmup activation'),
        firstTransmissionActivation: report.events.find(event => event.type === 'transmission shader/pass transition' && event.from === 0 && event.to > 0) ?? null,
        renderTimingEnabled: HANDOFF_RENDER_TIMING_DEBUG,
        gpuTiming: {
          supported: report.events.find(event => event.type === 'render timing diagnostic enabled')?.gpuTimerSupported ?? null,
          measuredFrames: report.renderTimings.filter(timing => timing.gpuStatus === 'available').length,
          inconclusiveFrames: report.renderTimings.filter(timing => timing.gpuStatus !== 'available').length,
          scope: 'Whole WebGL render, including the transmission pass, resolve and mipmap work. Transmission-only duration is not independently measured.',
          separateTransmissionTimingSupported: false,
          separateTransmissionTimingReason: 'The installed Three.js renderer exposes no transmission-pass timing hook. Nested TIME_ELAPSED queries cannot run inside the existing whole-render query. A/B measures the incremental cost, not a separately timed pass.',
        },
        renderTimings: report.renderTimings, domTimings: report.domTimings,
        slowFrames, events: report.events, frames: report.frames,
        interpretation: [
          'Frame intervals are sampled at R3F useFrame entry, before rendering. Events during rendering are reflected in the next sample.',
          'Previous/current phases and timeline times bracket the interval; coincidence does not prove causation.',
          'Program-count changes show observed shader-program cache changes, not measured compilation duration.',
          'firstTransmissionActivation describes the handoff uniform transition. Preparation records earlier transmission warmup; crossing zero again does not itself prove a new shader compilation.',
          'Texture/geometry counts are renderer counters, not GPU allocation timings. Internal render-target allocations are not directly timed.',
          'React commit effect markers record passive effect execution. React particle commit actualDuration measures subtree rendering, not GPU cleanup.',
          'Preparation/cleanup durationMs measures synchronous CPU elapsed time only; resource-count drops do not establish GPU cleanup duration.',
          'wallIntervalMilliseconds measures time between samples independently of the R3F clock. Visibility events identify hidden-tab sampling gaps; an unexplained long interval is not automatically GPU work.',
          'Renderer identity/context events distinguish recreation or context loss from ordinary scan-material/environment disposal.',
          'Optional render cpuMs measures synchronous WebGL submission including driver stalls, not just JavaScript. gpuMs is asynchronous elapsed GPU time for that render, when supported and non-disjoint.',
          'Transmission cost is included in total render timing; these measurements cannot reliably attribute a separate transmission-only cost.',
          'C reduces only transmission-target pixel count; main drawing-buffer resolution, material values and shader source are unchanged. Estimated target dimensions are derived, not observed. C can change refraction sampling/LOD and needs visual approval.',
          'DOM update cpuMs times the existing GSAP wrapper callback, excluding deferred browser layout/paint and the separate Hero reveal tweens.',
          'Fast CPU/GPU submissions with slow intervals leave browser compositing, other main-thread work and scheduling as hypotheses; browser Performance traces are required to distinguish those.',
          'Browser long-task/long-animation-frame events are optional observations. Their event-time range is used for correlation; phaseAtDelivery is not necessarily the phase that caused the event. Absence of these entries does not rule out browser/GPU scheduling delays.',
          'No GPU synchronization or per-frame DOM measurements are performed. Optional GPU timer results are checked asynchronously.',
        ],
      }
    },
    toText() {
      return JSON.stringify(report.getReport(), null, 2)
    },
  }
  let normalFrames = 0
  let previous = null
  let rendererInstance = null
  let rendererGeneration = 0
  return report
}

// Instrument the existing render call only. R3F retains its render ownership
// and RAF loop; no additional renders, viewport changes or resource tuning.
export function attachHandoffRenderTiming(renderer, lifecycleRef, recorder) {
  if (!HANDOFF_RENDER_TIMING_DEBUG || !recorder) return () => {}
  const context = renderer.getContext()
  // Supported WebGL queries, once at setup, never during animation frames.
  const debugRendererInfo = context.getExtension('WEBGL_debug_renderer_info')
  recorder.rendererInformation = {
    requestedPowerPreference: HANDOFF_POWER_PREFERENCE,
    contextAttributes: context.getContextAttributes(),
    vendor: context.getParameter(context.VENDOR),
    renderer: context.getParameter(context.RENDERER),
    version: context.getParameter(context.VERSION),
    shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
    debugRendererInfoAvailable: Boolean(debugRendererInfo),
    unmaskedVendor: debugRendererInfo ? context.getParameter(debugRendererInfo.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: debugRendererInfo ? context.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL) : null,
    powerHintHonored: null,
    limitation: 'The requested hint and returned context attributes do not prove GPU selection. Renderer labels may be masked or unavailable; WebGL provides no definitive power-hint-honored flag.',
  }
  const extension = context.getExtension('EXT_disjoint_timer_query_webgl2')
  const originalRender = renderer.render
  const pending = []
  let rendering = false
  const supportedTypes = typeof PerformanceObserver !== 'undefined'
    ? PerformanceObserver.supportedEntryTypes || [] : []
  const entryTypes = ['longtask', 'long-animation-frame'].filter(type => supportedTypes.includes(type))
  recorder.browserTimingSupport = {
    longTask: entryTypes.includes('longtask'), longAnimationFrame: entryTypes.includes('long-animation-frame'),
  }
  let observer = null
  if (entryTypes.length) {
    observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        recorder.note(`browser ${entry.entryType}`, lifecycleRef.current, {
          at: entry.startTime + entry.duration, intervalStart: entry.startTime, durationMs: entry.duration,
          phase: null, timelineTime: null, phaseAtDelivery: lifecycleRef.current.phase,
          blockingDuration: entry.blockingDuration,
          renderStart: entry.renderStart, styleAndLayoutStart: entry.styleAndLayoutStart,
          scripts: entry.scripts?.slice(0, 5).map(script => ({
            duration: script.duration, executionStart: script.executionStart,
            invoker: script.invoker, sourceURL: script.sourceURL,
          })),
        })
      }
    })
    observer.observe({ entryTypes })
  }
  recorder.note('render timing diagnostic enabled', lifecycleRef.current, { gpuTimerSupported: Boolean(extension) })
  const poll = () => {
    if (!extension || !pending.length) return
    if (context.getParameter(extension.GPU_DISJOINT_EXT)) {
      for (const item of pending) {
        item.timing.gpuStatus = 'disjoint'
        context.deleteQuery(item.query)
      }
      pending.length = 0
      return
    }
    while (pending.length && context.getQueryParameter(pending[0].query, context.QUERY_RESULT_AVAILABLE)) {
      const item = pending.shift()
      item.timing.gpuMs = context.getQueryParameter(item.query, context.QUERY_RESULT) / 1e6
      item.timing.gpuStatus = 'available'
      context.deleteQuery(item.query)
    }
  }
  const timedRender = function (...args) {
    if (rendering) return originalRender.apply(this, args)
    poll()
    const state = lifecycleRef.current
    const capture = ['handoff', 'settling'].includes(state.phase)
      || (state.phase === 'complete' && !recorder.recordingComplete)
    if (!capture) return originalRender.apply(this, args)
    const timing = {
      at: performance.now(), phase: state.phase, timelineTime: state.scanTime,
      handoff: state.handoff, committed: state.handoffCommitted,
      transmissionResolutionScale: renderer.transmissionResolutionScale,
      gpuStatus: extension ? 'not-sampled' : 'unsupported',
    }
    let query = null
    if (extension && pending.length < 3 && !context.getQuery(extension.TIME_ELAPSED_EXT, context.CURRENT_QUERY)) {
      query = context.createQuery()
      if (query) context.beginQuery(extension.TIME_ELAPSED_EXT, query)
    }
    rendering = true
    const started = performance.now()
    try {
      return originalRender.apply(this, args)
    } finally {
      timing.cpuMs = performance.now() - started
      timing.calls = renderer.info.render.calls
      timing.triangles = renderer.info.render.triangles
      if (query) {
        context.endQuery(extension.TIME_ELAPSED_EXT)
        timing.gpuStatus = 'pending'
        pending.push({ query, timing })
      }
      recorder.renderTimings.push(timing)
      if (recorder.renderTimings.length > 180) recorder.renderTimings.shift()
      rendering = false
    }
  }
  renderer.render = timedRender
  return () => {
    observer?.disconnect()
    if (renderer.render === timedRender) renderer.render = originalRender
    for (const item of pending) {
      item.timing.gpuStatus = 'disposed-before-result'
      context.deleteQuery(item.query)
    }
    pending.length = 0
  }
}
