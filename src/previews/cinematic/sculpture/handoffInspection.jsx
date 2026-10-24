import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Quaternion, Vector2, Vector3, Vector4 } from 'three'

// Temporary production-route inspection. Disable to restore uninterrupted playback.
export const HANDOFF_DEBUG = import.meta.env.DEV && false

const rectValue = rect => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
const pose = object => {
  object.updateWorldMatrix(true, true)
  return {
    localPosition: object.position.toArray(), localQuaternion: object.quaternion.toArray(), localScale: object.scale.toArray(),
    worldPosition: object.getWorldPosition(new Vector3()).toArray(),
    worldQuaternion: object.getWorldQuaternion(new Quaternion()).toArray(),
    worldScale: object.getWorldScale(new Vector3()).toArray(), matrixWorld: object.matrixWorld.toArray(),
  }
}

const comparisonPairs = [
  ['SCAN_COMPLETE', 'HANDOFF_FIRST_UPDATE'],
  ['HANDOFF_PRE_COMMIT', 'HANDOFF_POST_COMMIT'],
  ['HANDOFF_POST_COMMIT', 'HERO_NORMAL'],
]
const subtract = (a, b, keys) => Object.fromEntries(keys.map(key => [key, b[key] - a[key]]))
const angle = (a, b) => new Quaternion().fromArray(a).angleTo(new Quaternion().fromArray(b)) * 180 / Math.PI
const round = value => Number.isFinite(value) ? Number(value.toFixed(4)) : value
const format = value => Number.isFinite(value) ? value.toFixed(2) : '—'
function compareRecords(a, b) {
  if (!a || !b) return null
  return {
    from: a.checkpoint, to: b.checkpoint, frames: [a.renderedFrame, b.renderedFrame],
    projectedDeltaPx: subtract(a.projected, b.projected, ['centerX', 'centerY', 'width', 'height']),
    rootQuaternion: { before: a.orbit.worldQuaternion, after: b.orbit.worldQuaternion, deltaDegrees: angle(a.orbit.worldQuaternion, b.orbit.worldQuaternion) },
    rootScaleDelta: b.orbit.worldScale.map((value, i) => value - a.orbit.worldScale[i]),
    rings: b.rings.map(ring => {
      const before = a.rings.find(item => item.name === ring.name)
      return { name: ring.name, before: before?.worldQuaternion, after: ring.worldQuaternion,
        deltaDegrees: before ? angle(before.worldQuaternion, ring.worldQuaternion) : null,
        localDeltaDegrees: before ? angle(before.localQuaternion, ring.localQuaternion) : null }
    }),
    canvasDeltaPx: subtract(a.canvas, b.canvas, ['left', 'top', 'width', 'height']),
    wrapperDeltaPx: a.wrapper && b.wrapper ? subtract(a.wrapper, b.wrapper, ['left', 'top', 'width', 'height']) : null,
    camera: { aspectBefore: a.camera.aspect, aspectAfter: b.camera.aspect,
      projectionDelta: b.camera.projection.map((value, i) => value - a.camera.projection[i]) },
    owners: [a.owner, b.owner],
    layoutViewport: { before: a.layoutViewport, after: b.layoutViewport },
    materials: { before: a.materials, after: b.materials },
    note: 'Measured changes, not a visibility verdict. Compare the paused images and controller writes; intended motion also produces deltas.',
  }
}

export function createHandoffInspection() {
  const listeners = new Set()
  const debug = {
    enabled: true, advanceAfterCapture: false, wake: null, bandUpdate: null, frozen: false, pending: null, seen: new Set(), history: [], index: -1, continuous: false, timeline: null,
    writes: [],
    record(controller, value) { if (!debug.enabled) return; debug.writes.push({ controller, value, at: performance.now() }); if (debug.writes.length > 40) debug.writes.shift() },
    snapshot: { checkpoint: 'Waiting for scan completion', history: [] },
    subscribe: callback => { listeners.add(callback); return () => listeners.delete(callback) },
    captureBandWrite(before, after, elapsed) {
      if (!debug.enabled || debug.bandUpdate) return
      debug.bandUpdate = {
        controller: 'FluxSculpture.updateOrbitBands', elapsed, timelineTime: debug.timeline?.time(),
        rings: after.map(ring => {
          const start = before.find(item => item.name === ring.name)
          return { name: ring.name, before: start.quaternion, after: ring.quaternion,
            eulerBefore: start.euler, eulerAfter: ring.euler,
            deltaDegrees: angle(start.quaternion, ring.quaternion) }
        }),
      }
      debug.record('First updateOrbitBands: before/after', debug.bandUpdate)
    },
    comparisons() {
      return comparisonPairs.map(([from, to]) => ({ from, to, result: compareRecords(debug.history.find(item => item.checkpoint === from), debug.history.find(item => item.checkpoint === to)) }))
    },
    publish() {
      const record = debug.history[debug.index] || { checkpoint: 'Waiting for scan completion' }
      debug.snapshot = { ...record, history: [...debug.history], index: debug.index, enabled: debug.enabled,
        status: debug.pending ? 'Capturing rendered frame…' : debug.frozen ? 'Paused at checkpoint' : debug.continuous ? 'Running continuously' : 'Running to next checkpoint',
        comparisons: debug.comparisons(), bandUpdate: debug.bandUpdate }
      listeners.forEach(fn => fn())
    },
    request(name) {
      if (!debug.enabled || debug.seen.has(name) || debug.pending) return false
      debug.seen.add(name)
      debug.pending = name
      debug.frozen = !debug.continuous
      if (debug.frozen) debug.timeline?.pause()
      debug.wake?.()
      debug.publish()
      return true
    },
    next() {
      debug.continuous = false
      if (debug.pending) { debug.advanceAfterCapture = true; debug.publish(); return }
      debug.advanceAfterCapture = false
      debug.frozen = false
      debug.timeline?.play()
      debug.wake?.()
      debug.publish()
    },
    resume() {
      debug.continuous = true
      // Finish a pending rendered-frame capture before restarting GSAP.
      if (debug.pending) { debug.advanceAfterCapture = true; debug.publish(); return }
      debug.frozen = false; debug.timeline?.play(); debug.wake?.(); debug.publish()
    },
    disable() {
      debug.enabled = false; debug.frozen = false; debug.pending = null
      debug.timeline?.play(); debug.wake?.(); debug.publish()
    },
    replay() { window.location.reload() },
    previous() { debug.index = Math.max(0, debug.index - 1); debug.publish() },
    report() {
      const lines = ['Orbit handoff diagnostic report',
        'Projected geometry bounds in viewport CSS pixels; not a GPU pixel readback.',
        'Deltas are observations, not proof that a change is an unintended snap.', '']
      for (const { from, to, result } of debug.comparisons()) {
        lines.push(`${from} → ${to}`)
        lines.push(result ? JSON.stringify(result, (_, value) => typeof value === 'number' ? round(value) : value) : 'Not captured yet')
      }
      lines.push('', 'First updateOrbitBands invocation (before/after):', JSON.stringify(debug.bandUpdate, (_, value) => typeof value === 'number' ? round(value) : value))
      lines.push('', 'Checkpoints:')
      for (const item of debug.history) lines.push(JSON.stringify({ checkpoint: item.checkpoint, frame: item.renderedFrame,
        phase: item.phase, owner: item.owner, handoff: item.handoff, projected: item.projected,
        canvas: item.canvas, wrapper: item.wrapper, cameraAspect: item.camera.aspect,
        timeline: item.timeline, materials: item.materials, wrapperStyle: item.wrapperStyle }, (_, value) => typeof value === 'number' ? round(value) : value))
      // Deduplicate writes repeated in multiple checkpoint snapshots.
      const writes = new Map()
      for (const item of debug.history) for (const write of item.writes) writes.set(`${write.at}:${write.controller}`, write)
      lines.push('', 'Controller writes:', JSON.stringify([...writes.values()], (_, value) => typeof value === 'number' ? round(value) : value))
      return lines.join('\n')
    },
    capture(object, camera, gl, state, owner, elapsed, controls) {
      if (!debug.enabled || !debug.pending) return
      const checkpoint = debug.pending
      debug.pending = null
      const canvas = gl.domElement.getBoundingClientRect()
      const wrapper = gl.domElement.closest('[data-sculpture-window]')
      const viewport = gl.getViewport(new Vector4())
      const buffer = gl.getDrawingBufferSize(new Vector2())
      const dpr = gl.getPixelRatio()
      camera.updateWorldMatrix(true, false)
      // Project through the live render viewport, then map drawing coordinates
      // to the Canvas DOM rectangle. CSS origin is top-left, GL is bottom-left.
      // Vertex projection avoids the loose bounding-box corners used by the
      // ordinary fitting helper. These are projected geometry bounds, not a
      // pixel readback: shader refraction/occlusion may alter visible pixels.
      object.updateWorldMatrix(true, true)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      const point = new Vector3()
      object.traverse(mesh => {
        const positions = mesh.geometry?.attributes?.position
        if (!positions) return
        for (let i = 0; i < positions.count; i += 1) {
          point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera)
          const x = (point.x + 1) * viewport.z / 2
          const y = (1 - point.y) * viewport.w / 2
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
        }
      })
      const bounds = { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
      const drawingWidth = Math.max(buffer.x, 1), drawingHeight = Math.max(buffer.y, 1)
      const left = canvas.left + ((viewport.x + bounds.left) * dpr / drawingWidth) * canvas.width
      const top = canvas.top + ((drawingHeight - (viewport.y + viewport.w) * dpr + bounds.top * dpr) / drawingHeight) * canvas.height
      const width = bounds.width * dpr / drawingWidth * canvas.width
      const height = bounds.height * dpr / drawingHeight * canvas.height
      const materials = []
      object.traverse(mesh => {
        if (!mesh.isMesh || !mesh.material) return
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          materials.push({ band: mesh.parent?.name, opacity: material.opacity, transmission: material.transmission,
            transparent: material.transparent, depthWrite: material.depthWrite })
        }
      })
      const current = {
        checkpoint, renderedFrame: gl.info.render.frame, objectId: object.uuid, writes: [...debug.writes], previousCheckpoint: debug.history.at(-1)?.checkpoint || null,
        phase: state.phase, previousPhase: state.previousPhase ?? debug.lastPhase, owner, handoff: state.handoff,
        committed: state.handoffCommitted, animationClock: elapsed,
        projected: { centerX: left + width / 2, centerY: top + height / 2, width, height },
        canvas: rectValue(canvas), wrapper: wrapper ? rectValue(wrapper.getBoundingClientRect()) : null,
        clippedProjected: wrapper ? {
          left: Math.max(left, wrapper.getBoundingClientRect().left),
          top: Math.max(top, wrapper.getBoundingClientRect().top),
          right: Math.min(left + width, wrapper.getBoundingClientRect().right),
          bottom: Math.min(top + height, wrapper.getBoundingClientRect().bottom),
        } : null,
        layoutViewport: {
          innerWidth: window.innerWidth, clientWidth: document.documentElement.clientWidth,
          scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
          rootOverflow: getComputedStyle(document.documentElement).overflow,
          bodyOverflow: getComputedStyle(document.body).overflow,
          gutter: getComputedStyle(document.documentElement).scrollbarGutter,
        },
        viewport: viewport.toArray(), drawingBuffer: { width: buffer.x, height: buffer.y, dpr },
        camera: { aspect: camera.aspect, fov: camera.fov, ...pose(camera), projection: camera.projectionMatrix.toArray() },
        materials,
        orbit: { ...pose(object), visible: object.visible }, parent: object.parent ? pose(object.parent) : null,
        rings: object.children.flatMap(group => group.children.flatMap(inner => inner.children.filter(child => child.name.startsWith('orbit')).map(child => ({ name: child.name, ...pose(child) })))),
        wrapperStyle: wrapper ? { inline: wrapper.style.cssText, transform: getComputedStyle(wrapper).transform, background: getComputedStyle(wrapper).backgroundColor } : null,
        timeline: { time: debug.timeline?.time(), progress: debug.timeline?.progress(), paused: debug.timeline?.paused() },
        scroll: { y: window.scrollY, ...controls },
      }
      const previous = debug.history.at(-1)
      if (previous) {
        const a = new Quaternion().fromArray(previous.orbit.worldQuaternion)
        const b = new Quaternion().fromArray(current.orbit.worldQuaternion)
        current.delta = {
          centerX: current.projected.centerX - previous.projected.centerX,
          centerY: current.projected.centerY - previous.projected.centerY,
          width: current.projected.width - previous.projected.width,
          height: current.projected.height - previous.projected.height,
          worldRotationDegrees: a.angleTo(b) * 180 / Math.PI,
          worldScale: current.orbit.worldScale.map((value, i) => value - previous.orbit.worldScale[i]),
        }
        current.ringRotationDeltaDegrees = current.rings.map(ring => {
          const before = previous.rings.find(value => value.name === ring.name)
          return { name: ring.name, degrees: before ? new Quaternion().fromArray(before.worldQuaternion).angleTo(new Quaternion().fromArray(ring.worldQuaternion)) * 180 / Math.PI : null }
        })
      }
      debug.lastPhase = state.phase
      debug.history.push(current); debug.index = debug.history.length - 1
      console.info('[Orbit handoff checkpoint]', current)
      debug.publish()
      if (debug.continuous || debug.advanceAfterCapture) {
        debug.advanceAfterCapture = false
        debug.frozen = false
        debug.timeline?.play()
        debug.wake?.()
        debug.publish()
      }
    },
  }
  return debug
}

const buttonStyle = {
  appearance: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 32, border: '1px solid #8095b2', borderRadius: 5, padding: '6px 9px',
  background: '#263c59', color: '#fff', font: '600 11px/1.3 Arial, sans-serif', cursor: 'pointer',
  pointerEvents: 'auto', textTransform: 'none', letterSpacing: 0,
}
export function HandoffInspectionPanel({ debug }) {
  const snapshot = useSyncExternalStore(debug.subscribe, () => debug.snapshot)
  const [copyStatus, setCopyStatus] = useState('')
  const [manualReport, setManualReport] = useState('')
  if (snapshot.enabled === false) return null
  const copyReport = async () => {
    const report = debug.report()
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(report)
      setCopyStatus('Diagnostic report copied.'); setManualReport('')
    } catch {
      setManualReport(report); setCopyStatus('Clipboard unavailable. Select and copy the report below.')
    }
  }
  const projected = snapshot.projected
  return createPortal(<aside data-handoff-inspection aria-label="Orbit handoff diagnostics" style={{ position: 'fixed', right: 12, top: 12, zIndex: 2147483647, width: 360, maxWidth: 'calc(100vw - 24px)', maxHeight: '82vh', overflow: 'auto', boxSizing: 'border-box', padding: 12, borderRadius: 8, border: '1px solid #68809f', background: '#101827', color: '#f4f7fb', font: '11px/1.5 Arial, sans-serif', pointerEvents: 'auto', textAlign: 'left' }}>
    <strong style={{ display: 'block', fontSize: 13 }}>Orbit handoff inspection</strong>
    <div style={{ margin: '8px 0' }}>
      <b>{snapshot.checkpoint}</b> · {snapshot.status || 'Waiting'}<br />
      Timeline: {format((snapshot.timeline?.progress ?? 0) * 100)}% · Handoff: {format((snapshot.handoff ?? 0) * 100)}%<br />
      Center: {format(projected?.centerX)}, {format(projected?.centerY)} px<br />
      Size: {format(projected?.width)} × {format(projected?.height)} px<br />
      Owner: {snapshot.owner || 'FORMATION_I'}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      <button type="button" style={buttonStyle} onClick={() => debug.next()}>Next checkpoint</button>
      <button type="button" style={buttonStyle} onClick={() => debug.resume()}>Resume animation</button>
      <button type="button" style={buttonStyle} onClick={() => debug.previous()}>Previous record</button>
      <button type="button" style={buttonStyle} onClick={() => debug.replay()}>Replay from beginning</button>
      <button type="button" style={buttonStyle} onClick={copyReport}>Copy diagnostic report</button>
      <button type="button" style={buttonStyle} onClick={() => debug.disable()}>Disable diagnostics</button>
    </div>
    <p style={{ margin: '8px 0', color: '#b6c7dd' }}>Previous record reviews data without rewinding. Replay refreshes the page. Disable resumes without further pauses until refresh.</p>
    <div role="status">{copyStatus}</div>
    {manualReport && <textarea aria-label="Diagnostic report to copy" readOnly value={manualReport} onFocus={event => event.target.select()} style={{ width: '100%', height: 120, color: '#101827', background: '#fff' }} />}
    <strong>Boundary comparisons</strong>
    {(snapshot.comparisons || []).map(({ from, to, result }) => {
      const changes = result && Object.values(result.projectedDeltaPx).some(value => Math.abs(value) > 0.000001)
      return <div key={from} style={{ borderTop: '1px solid #40526a', padding: '7px 0' }}>
        <b>{from} → {to}</b><br />
        {!result ? 'Awaiting both frames.' : <>
          <span style={{ color: changes ? '#ffd28d' : '#a9d8c0' }}>{changes ? 'Measured screen-space change — inspect for discontinuity.' : 'No measurable screen-space change.'}</span><br />
          Δ center: {format(result.projectedDeltaPx.centerX)}, {format(result.projectedDeltaPx.centerY)} px<br />
          Δ size: {format(result.projectedDeltaPx.width)}, {format(result.projectedDeltaPx.height)} px<br />
          Root Δ: {format(result.rootQuaternion.deltaDegrees)}°<br />
          {result.rings.map(ring => <div key={ring.name}>{ring.name}: {format(ring.deltaDegrees)}° world / {format(ring.localDeltaDegrees)}° local</div>)}
          Canvas Δ x/y/w/h: {Object.values(result.canvasDeltaPx).map(format).join(' / ')}<br />
          Wrapper Δ x/y/w/h: {result.wrapperDeltaPx ? Object.values(result.wrapperDeltaPx).map(format).join(' / ') : '—'}<br />
          Camera aspect: {format(result.camera.aspectBefore)} → {format(result.camera.aspectAfter)}<br />
          Projection max |Δ|: {format(Math.max(...result.camera.projectionDelta.map(Math.abs)))}<br />
          Owner: {result.owners.join(' → ')}
        </>}
      </div>
    })}
    {snapshot.bandUpdate && <div style={{ borderTop: '1px solid #40526a', paddingTop: 8 }}><b>First updateOrbitBands(): direct local rotation change</b>
      {snapshot.bandUpdate.rings.map(ring => <div key={ring.name}>{ring.name}: {format(ring.deltaDegrees)}°</div>)}
    </div>}
    <details style={{ marginTop: 8 }}><summary style={{ cursor: 'pointer', color: '#c2d6ef' }}>Full checkpoint JSON</summary>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: '10px/1.4 monospace' }}>{JSON.stringify(snapshot, (key, value) => key === 'history' ? undefined : typeof value === 'number' ? round(value) : value, 2)}</pre>
    </details>
  </aside>, document.body)
}
