import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import {
  addFormationIOrbitClock,
  createLoaderState,
  FORMATION_I_ORBIT_SPEED,
  FORMATION_I_TIMING,
  PERSPECTIVE_ELLIPSE_ORBIT_DURATION,
} from './loaderChoreography'
import styles from './SculptureWindow.module.css'
import { HANDOFF_DEBUG, createHandoffInspection, HandoffInspectionPanel } from './handoffInspection'

// Development controls. PREVIEW changes only the presentation label; the
// production loader still runs when preview is false. HOLD keeps the orbital showcase running.
export const LOADER_PREVIEW = true
export const LOADER_PREVIEW_HOLD = false
export const LOADER_BYPASS = false
const LOADER_DEBUG = false

const loaderLog = (event, details = {}) => {
  if (LOADER_DEBUG) console.info(`[loader] ${event}`, details)
}

const SculptureScene = lazy(() => import('./SculptureScene'))
const fallback = <span className={styles.fallback} data-scene-fallback>FLUX / 3D unavailable</span>

class SceneBoundary extends Component {
  state = { unavailable: false }
  static getDerivedStateFromError() { return { unavailable: true } }
  componentDidCatch(error) { this.props.onUnavailable?.(error) }
  render() {
    return this.state.unavailable ? fallback : this.props.children
  }
}

export default function SculptureWindow({ heroRef, titleRef, windowRef: externalWindowRef, sceneControlRef, measureHeroTarget, particleShape = 'ribbon', particleRevealRange = null, scopeSceneFallback = false, loaderOrbitVariant = 'original', loaderBeamClusterRatio = null, readyIndicatorMode = 'original', techTextReadyRef = null, orbitDiagnostics = null, ditherVeilReplaceParticle = false }) {
  const internalWindowRef = useRef(null)
  const windowRef = externalWindowRef ?? internalWindowRef
  const pointerRef = useRef({ x: 0, y: 0 })
  const lifecycleRef = useRef(createLoaderState())
  const inspectionRef = useRef(null)
  if (HANDOFF_DEBUG && !inspectionRef.current) inspectionRef.current = createHandoffInspection()
  lifecycleRef.current.handoffDebug = inspectionRef.current
  const initialLayoutRef = useRef(null)
  const measureLandingRef = useRef(null)
  const sequenceRef = useRef(null)
  const backdropRef = useRef(null)
  const indicatorRef = useRef(null)
  const indicatorTrackRef = useRef(null)
  const indicatorSegmentRef = useRef(null)
  const statusLayerRefs = useRef([])
  const statusTextRef = useRef(null)
  const statusAccessibleRef = useRef(null)
  const activeStatusIndexRef = useRef(0)
  const statusTransitionRef = useRef(null)
  const scanBeamRef = useRef(null)
  const readyTickRef = useRef(null)
  const startedRef = useRef(false)
  const readinessRef = useRef({ canvas: false, fonts: false })
  const [loaderActive, setLoaderActive] = useState(!LOADER_BYPASS)

  useEffect(() => {
    const element = windowRef.current
    if (!HANDOFF_DEBUG || !element) return undefined
    element.__handoffInspection = inspectionRef.current
    return () => { delete element.__handoffInspection }
  }, [windowRef])

  const finishLoader = useCallback(() => {
    const state = lifecycleRef.current
    if (state.phase === 'complete') return
    techTextReadyRef?.current?.entranceDiagnostics?.write('SculptureWindow.finishLoader() → setLoaderActive(false)', { phase: state.phase, handoff: state.handoff })
    orbitDiagnostics?.note('loader handoff finish requested', { loaderPhase: state.phase, handoff: state.handoff, committed: state.handoffCommitted })
    loaderLog('complete')
    state.phase = 'complete'
    state.handoffPerformance?.note('loader completion requested', state)
    state.onHandoffRendered = null
    // Keep the fully black committed panel intact until React removes the
    // loader-preview attribute. Clearing handoff here selects the transparent
    // loader rule before the ordinary Hero background can take ownership.
    if (techTextReadyRef?.current?.required && techTextReadyRef.current.ready) {
      windowRef.current?.dispatchEvent(new Event('sculpture-loader-handoff-ready'))
    }
    setLoaderActive(false)
  }, [windowRef, techTextReadyRef, orbitDiagnostics])

  const handleCanvasReady = useCallback(() => {
    // A preview can now measure the mounted Orbit's actual projected size.
    // Resolve its destination before the existing readiness path starts motion.
    orbitDiagnostics?.note('R3F canvas ready; landing measurement requested')
    measureLandingRef.current?.('R3F canvas ready')
    readinessRef.current.canvas = true
    loaderLog('canvas-ready', { readiness: { ...readinessRef.current } })
    readyTickRef.current?.()
  }, [orbitDiagnostics])

  const handleUnavailable = useCallback(() => {
    loaderLog('unavailable')
    sequenceRef.current?.kill()
    finishLoader()
  }, [finishLoader])

  useEffect(() => {
    const root = heroRef.current
    if (root) root.dataset.loaderActive = loaderActive ? 'true' : 'false'
    if (!loaderActive) {
      techTextReadyRef?.current?.entranceDiagnostics?.complete({ loaderActive: false })
      // React has removed loader-preview now; the normal black panel already
      // owns the background, so clearing this marker cannot expose ivory.
      if (windowRef.current) windowRef.current.dataset.loaderHandoff = 'false'
      // Re-apply the unchanged scroll state only after the fullscreen override
      // has been removed by React. No ScrollTrigger refresh or new stage.
      orbitDiagnostics?.note('sculpture-loader-complete dispatch / loader post-commit', {
        wrapperRect: windowRef.current?.getBoundingClientRect().toJSON?.(),
        inline: windowRef.current?.style.cssText,
      })
      windowRef.current?.dispatchEvent(new Event('sculpture-loader-complete'))
    }
    return () => {
      if (root) delete root.dataset.loaderActive
    }
  }, [heroRef, loaderActive, windowRef, orbitDiagnostics, techTextReadyRef])

  useLayoutEffect(() => {
    if (!loaderActive) return undefined
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    // A child's layout effect can precede attachment of the parent ref. The
    // attached window already belongs to the same Hero DOM subtree.
    const hero = heroRef.current ?? windowRef.current?.closest('[data-cinematic-hero]')
    const controls = [...(hero?.querySelectorAll('header, section[aria-labelledby="cinematic-title"], [data-cinematic-nav], footer') ?? [])]
    const previousInert = controls.map(node => node.inert)
    controls.forEach(node => { node.inert = true })
    const scrollY = window.scrollY
    // Gutter reservation belongs to the cinematic page CSS, before any pin
    // measurements, and remains stable after unlocking. This effect owns only
    // input/overflow locks; it must not change the layout viewport width.
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, scrollY)
    const prevent = event => {
      if (HANDOFF_DEBUG && event.target.closest?.('[data-handoff-inspection]')) return
      event.preventDefault()
    }
    const preventKeys = event => {
      if (HANDOFF_DEBUG && event.target.closest?.('[data-handoff-inspection]')) return
      if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.preventDefault()
    }
    window.addEventListener('wheel', prevent, { passive: false })
    window.addEventListener('touchmove', prevent, { passive: false })
    window.addEventListener('keydown', preventKeys, { passive: false })
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousRootOverflow
      controls.forEach((node, index) => { node.inert = previousInert[index] })
      window.removeEventListener('wheel', prevent)
      window.removeEventListener('touchmove', prevent)
      window.removeEventListener('keydown', preventKeys)
    }
  }, [heroRef, loaderActive, windowRef])

  // Child layout effects can run before the parent's host ref is attached.
  // A passive effect waits until all hero/title DOM refs are ready.
  useEffect(() => {
    const hero = heroRef.current
    const windowElement = windowRef.current
    if (!hero || !windowElement) return
    let disposed = false
    const position = (reason = 'unspecified') => {
      if (disposed) return
      const heroBox = hero.getBoundingClientRect()
      const preferredWidth = heroBox.width <= 640 ? 120 : 196
      const defaultWidth = Math.min(preferredWidth, heroBox.width * 0.24)
      const defaultHeight = defaultWidth * 0.78
      // Use the hero's own coordinate space: 80% across, 20% down.
      const defaultLeft = Math.max(12, Math.min(heroBox.width - defaultWidth - 12, heroBox.width * 0.8 - defaultWidth / 2))
      const defaultTop = Math.max(16, Math.min(heroBox.height * 0.32 - defaultHeight, heroBox.height * 0.2 - defaultHeight / 2))
      // An isolated preview may supply a measured destination. Both the loader
      // and ordinary scroll controller consume this same rectangle; neither
      // needs an extra animation owner or a different Orbit instance.
      const { left, top, width, height } = measureHeroTarget?.({ heroBox, title: titleRef.current, sceneControl: sceneControlRef.current }) ?? {
        left: defaultLeft, top: defaultTop, width: defaultWidth, height: defaultHeight,
      }
      windowElement.style.setProperty('--sculpture-x', `${left}px`)
      windowElement.style.setProperty('--sculpture-y', `${top}px`)
      windowElement.style.setProperty('--sculpture-width', `${width}px`)
      windowElement.style.setProperty('--sculpture-height', `${height}px`)
      windowElement.style.setProperty('--sculpture-ui-scale', measureHeroTarget ? String(Math.max(width / 196, 0.2)) : '1')
      const initialLayout = {
        left: heroBox.left + left,
        top: heroBox.top + top,
        width,
        height,
      }
      inspectionRef.current?.record('Hero measurement / ResizeObserver / fonts', initialLayout)
      if (reason.startsWith('document.fonts.')) orbitDiagnostics?.note(reason, { recalculatedLanding: Boolean(measureHeroTarget), initialLayout })
      orbitDiagnostics?.note('SculptureWindow.position()', {
        reason, initialLayout, css: {
          x: windowElement.style.getPropertyValue('--sculpture-x'), y: windowElement.style.getPropertyValue('--sculpture-y'),
          width: windowElement.style.getPropertyValue('--sculpture-width'), height: windowElement.style.getPropertyValue('--sculpture-height'),
        }, heroRect: { left: heroBox.left, top: heroBox.top, width: heroBox.width, height: heroBox.height },
      })
      initialLayoutRef.current = initialLayout
      lifecycleRef.current.heroTarget = initialLayout
      windowElement.dataset.loaderInitial = JSON.stringify(initialLayout)
      windowElement.dataset.positioned = width > 0 ? 'true' : 'false'
      if (measureHeroTarget && lifecycleRef.current.phase === 'complete') {
        // Preview-only font/resize measurements must also update the scroll
        // controller's cached starting rectangle after loader ownership ends.
        orbitDiagnostics?.note('sculpture-landing-change dispatch', { reason, initialLayout })
        windowElement.dispatchEvent(new Event('sculpture-landing-change'))
      }
    }
    // The overlay never participates in document flow or changes headline metrics.
    if (measureHeroTarget) measureLandingRef.current = position
    position('initial effect')
    const observer = new ResizeObserver(() => position('ResizeObserver'))
    observer.observe(hero)
    if (measureHeroTarget && titleRef.current) observer.observe(titleRef.current)
    document.fonts?.ready.then(() => position('document.fonts.ready'), () => position('document.fonts.ready rejected'))
    const fontsLoadingDone = event => position(`document.fonts.loadingdone (${event.fontfaces?.length ?? 'unknown'} faces)`)
    const windowResize = () => position('window resize')
    document.fonts?.addEventListener('loadingdone', fontsLoadingDone)
    window.addEventListener('resize', windowResize, { passive: true })
    return () => {
      disposed = true
      if (measureLandingRef.current === position) measureLandingRef.current = null
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', fontsLoadingDone)
      window.removeEventListener('resize', windowResize)
    }
  }, [heroRef, titleRef, measureHeroTarget, sceneControlRef, orbitDiagnostics])

  useEffect(() => {
    if (!loaderActive) return undefined
    const element = windowRef.current
    const root = heroRef.current
    if (!element || !root) return undefined
    let disposed = false
    let gated = false
    const state = lifecycleRef.current
    if (inspectionRef.current) {
      const debug = inspectionRef.current
      debug.seen.clear(); debug.history = []; debug.writes = []; debug.index = -1
      debug.bandUpdate = null; debug.pending = null; debug.frozen = false; debug.continuous = false
      debug.advanceAfterCapture = false; debug.publish()
    }
    Object.assign(state, createLoaderState(), {
      heroTarget: initialLayoutRef.current,
      clusterPixels: state.clusterPixels,
      scanLineElement: scanBeamRef.current,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
    const reduced = state.reducedMotion
    const duration = {
      cluster: reduced ? 0.15 : 0.5,
      separation: reduced ? 0.15 : 0.6,
      orbit: reduced ? 0.2 : loaderOrbitVariant === 'perspective-ellipse'
        ? PERSPECTIVE_ELLIPSE_ORBIT_DURATION
        : FORMATION_I_TIMING.orbit,
      convergence: reduced ? 0.25 : 0.9,
      showcase: reduced ? 0.12 : 0.35,
      handoff: reduced ? 0.3 : 1,
    }
    const dynamicStatus = loaderOrbitVariant === 'perspective-ellipse'
    const addReadyIndicatorTransition = (timeline, collapseStart, completion) => {
      if (!dynamicStatus || readyIndicatorMode !== 'dot') return
      const track = indicatorTrackRef.current
      const segment = indicatorSegmentRef.current
      if (!track || !segment) return
      // Keep the existing center/contract morph, but schedule its END on the
      // beam's actual collapse endpoint. The master progress tween remains
      // the sole scaleX writer until that same endpoint (no forced 100% set).
      const trackBox = track.getBoundingClientRect()
      if (trackBox.width <= 0) return
      const dotSize = 4.5
      const transitionDuration = reduced ? 0 : Math.min(0.35, completion - collapseStart)
      const start = completion - transitionDuration
      const centerDuration = transitionDuration * (0.08 / 0.35)
      timeline
        .to(segment, { left: 0, width: trackBox.width, duration: centerDuration, ease: 'power2.inOut' }, start)
        .set(track, { overflow: 'visible' }, start + centerDuration)
        .to(segment, {
          left: (trackBox.width - dotSize) / 2, width: dotSize, height: dotSize,
          top: (trackBox.height - dotSize) / 2, borderRadius: dotSize / 2,
          duration: transitionDuration - centerDuration, ease: 'power2.inOut',
        }, start + centerDuration)
        .to(track, { backgroundColor: 'rgba(40, 52, 71, 0)', duration: transitionDuration, ease: 'power2.inOut' }, start)
    }
    activeStatusIndexRef.current = 0
    if (dynamicStatus && statusLayerRefs.current[0] && statusLayerRefs.current[1]) {
      statusLayerRefs.current[0].textContent = 'INITIALIZING'
      statusLayerRefs.current[1].textContent = ''
      if (statusAccessibleRef.current) statusAccessibleRef.current.textContent = 'INITIALIZING'
      gsap.set(statusLayerRefs.current[0], { autoAlpha: 1, y: 0 })
      gsap.set(statusLayerRefs.current[1], { autoAlpha: 0, y: reduced ? 0 : 5 })
    }
    const changeStatus = status => {
      const layers = statusLayerRefs.current
      if (!dynamicStatus || !layers[0] || !layers[1]) return
      const currentIndex = activeStatusIndexRef.current
      const nextIndex = 1 - currentIndex
      const outgoing = layers[currentIndex]
      const incoming = layers[nextIndex]
      if (outgoing.textContent === status) return
      statusTransitionRef.current?.kill()
      gsap.killTweensOf(layers)
      incoming.textContent = status
      if (statusAccessibleRef.current) statusAccessibleRef.current.textContent = status
      gsap.set(incoming, { autoAlpha: 0, y: reduced ? 0 : 5 })
      statusTransitionRef.current = gsap.timeline()
        .to(outgoing, {
          autoAlpha: 0,
          y: reduced ? 0 : -5,
          duration: reduced ? 0.04 : 0.12,
          ease: 'power1.in',
        })
        .to(incoming, {
          autoAlpha: 1,
          y: 0,
          duration: reduced ? 0.06 : 0.18,
          ease: 'power2.out',
        })
      activeStatusIndexRef.current = nextIndex
    }
    const heroNodes = [
      root.querySelector('header'),
      root.querySelector('section[aria-labelledby="cinematic-title"]'),
      root.querySelector('footer'),
    ].filter(Boolean)
    const heroInlineStyles = heroNodes.map(node => node.getAttribute('style'))
    const setPhase = phase => {
      if (HANDOFF_DEBUG) state.previousPhase = state.phase
      state.phase = phase
      orbitDiagnostics?.note(`loader phase: ${phase}`, { scanProgress: state.scanProgress, handoff: state.handoff, timelineTime: timeline?.time() })
      loaderLog(phase, { readiness: { ...readinessRef.current } })
    }
    // Keep the renderer viewport-sized throughout the motion. The wrapper is
    // committed to Hero bounds only after R3F has written the matching local
    // origin in the same frame.
    let fullscreenFrame = null
    const applyFrame = () => {
      if (disposed) return
      // The fullscreen wrapper is stable while the loader owns the handoff.
      // Cache its rect instead of forcing a synchronous layout read on every
      // GSAP tick.  The previous per-frame getBoundingClientRect() call ran
      // after custom-property writes and could flush layout mid-transition,
      // producing a brief frame hitch.
      if (!fullscreenFrame && !state.handoffCommitted) {
        const rect = element.getBoundingClientRect()
        fullscreenFrame = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      }
      state.scanTime = timeline?.time() || 0
      const target = initialLayoutRef.current
      // Keep the renderer's fullscreen projection stable for the entire
      // handoff. FluxSculpture commits the Hero window only after it has
      // written the matching Hero-local pose in the same R3F frame.
      const layoutT = state.handoffCommitted ? 1 : 0
      const travel = state.handoff
      const width = window.innerWidth
      const height = window.innerHeight
      state.heroTarget = target
      orbitDiagnostics?.writer('SculptureWindow.applyFrame() → loader wrapper CSS variables', {
        phase: state.phase, handoff: travel, layoutCommitted: state.handoffCommitted, target,
      })
      element.style.setProperty('--loader-left', `${layoutT ? (target?.left ?? 0) - (fullscreenFrame?.left ?? 0) : 0}px`)
      element.style.setProperty('--loader-top', `${layoutT ? (target?.top ?? 0) - (fullscreenFrame?.top ?? 0) : 0}px`)
      element.style.setProperty('--loader-width', `${width + ((target?.width ?? width) - width) * layoutT}px`)
      element.style.setProperty('--loader-height', `${height + ((target?.height ?? height) - height) * layoutT}px`)
      // The normal Canvas is viewport-sized and centered inside the panel.
      // Move that screen origin toward the same center while the wrapper is
      // fullscreen. Committing the wrapper adds exactly this translation, so
      // removing the temporary offset in the same frame preserves every pixel.
      const centerX = (target?.left ?? 0) + (target?.width ?? width) / 2
      const centerY = (target?.top ?? 0) + (target?.height ?? height) / 2
      element.style.setProperty('--loader-canvas-x', `${layoutT ? 0 : (centerX - fullscreenFrame.left - fullscreenFrame.width / 2) * travel}px`)
      element.style.setProperty('--loader-canvas-y', `${layoutT ? 0 : (centerY - fullscreenFrame.top - fullscreenFrame.height / 2) * travel}px`)
      // Paint the original window background only in its measured destination
      // region. The fullscreen rendering viewport itself stays transparent.
      element.style.setProperty('--loader-panel-left', `${layoutT ? 0 : (target?.left ?? 0) - fullscreenFrame.left}px`)
      element.style.setProperty('--loader-panel-top', `${layoutT ? 0 : (target?.top ?? 0) - fullscreenFrame.top}px`)
      element.style.setProperty('--loader-panel-width', `${target?.width ?? width}px`)
      element.style.setProperty('--loader-panel-height', `${target?.height ?? height}px`)
      element.style.setProperty('--loader-panel-opacity', String(Math.min(1, travel / 0.82)))
      element.style.setProperty('--loader-panel-color', layoutT ? '#000' : 'transparent')
      element.dataset.loaderHandoff = travel > 0.001 ? 'true' : 'false'
      if (backdropRef.current) backdropRef.current.style.opacity = String(state.background)
      techTextReadyRef?.current?.entranceDiagnostics?.loaderFrame({ phase: state.phase, timelineTime: timeline?.time(), handoff: state.handoff, background: state.background, committed: state.handoffCommitted })
    }
    state.commitHandoff = () => {
      if (disposed || state.handoffCommitted) return
      inspectionRef.current?.record('commitHandoff: wrapper geometry', { ...state.heroTarget })
      state.handoffCommitted = true
      applyFrame()
    }
    let timeline
    const readinessChanged = () => {
      if (disposed || document.hidden) return
      const ready = readinessRef.current
      if (!startedRef.current && ready.canvas) {
        startedRef.current = true
        loaderLog('timeline-started', { reducedMotion: reduced })
        timeline.play()
      }
      const textStatus = techTextReadyRef?.current
      const techTextReady = !textStatus?.required || textStatus.ready || textStatus.failed
      if (gated && ready.canvas && ready.fonts && techTextReady && !LOADER_PREVIEW_HOLD) {
        gated = false
        loaderLog('readiness-satisfied', { readiness: { ...ready }, techTextReady, techTextFallback: Boolean(textStatus?.failed) })
        setPhase('converging')
        timeline.play()
      }
    }
    const context = gsap.context(() => {
      gsap.set(heroNodes, { autoAlpha: 0, y: reduced ? 0 : 14, filter: reduced ? 'none' : 'blur(5px)' })
      techTextReadyRef?.current?.entranceDiagnostics?.write('SculptureWindow GSAP initial heroNodes state', { autoAlpha: 0, y: reduced ? 0 : 14, filter: reduced ? 'none' : 'blur(5px)' })
      gsap.set(indicatorRef.current, { autoAlpha: 0, y: reduced ? 0 : Math.max(28, window.innerHeight * 0.05) + 32, xPercent: -50 })
      gsap.set(indicatorSegmentRef.current, { scaleX: 0, transformOrigin: 'left center' })
      timeline = gsap.timeline({
        paused: true,
        onUpdate: applyFrame,
        onComplete: () => {
          // Let R3F draw the exact final pose before React removes loader mode.
          setPhase('settling')
          state.onHandoffRendered = finishLoader
        },
      })
      sequenceRef.current = timeline
      if (inspectionRef.current) inspectionRef.current.timeline = timeline
      timeline.to(state, { showcase: 1, duration: duration.cluster, ease: 'none' })
        .call(() => setPhase('separating'))
        .addLabel('separation')
        .to(state, { separation: 1, orbitSpeed: reduced ? 0 : FORMATION_I_ORBIT_SPEED, duration: duration.separation, ease: 'power2.inOut' })
        .to(indicatorRef.current, { autoAlpha: 1, y: 0, duration: duration.separation, ease: 'power2.out' }, 'separation')
        .call(() => setPhase('orbiting'))
        .to(state, { showcase: 2, duration: duration.orbit, ease: 'none' })
        .addPause('readiness', () => { gated = true; readinessChanged() })
        .addLabel('formation')
        .call(() => setPhase('settling-cluster'))
        .set(state, { scanProgress: 0, scanBeamOpacity: 0, scanBeamExpand: 0, scanSettle: 0 })
        .to(state, {
          orbitSpeed: 0,
          // The approved ellipse preview contracts from the live orbital
          // transform. Production keeps its original return-to-layout settle.
          ...(loaderOrbitVariant.startsWith('perspective-ellipse') ? { convergence: 1 } : { separation: 0 }),
          scanSettle: 1,
          duration: reduced ? 0.15 : FORMATION_I_TIMING.settle,
          ease: 'power2.inOut',
        })
        .call(() => setPhase('anticipation'))
        .to({}, { duration: reduced ? 0.08 : FORMATION_I_TIMING.anticipation })
        .call(() => setPhase('igniting-beam'))
        .to(state, { scanBeamOpacity: 1, duration: reduced ? 0.08 : FORMATION_I_TIMING.ignition, ease: 'power2.out' })
        .to(scanBeamRef.current, { autoAlpha: 1, duration: reduced ? 0.08 : FORMATION_I_TIMING.ignition, ease: 'power2.out' }, '<')
        .to(state, { scanBeamExpand: 1, duration: reduced ? 0.12 : FORMATION_I_TIMING.expansion, ease: 'power3.inOut' })
        .call(() => setPhase('scanning'))
        .to(state, { scanProgress: 1, scanTurn: 0.06, duration: reduced ? 0.25 : FORMATION_I_TIMING.scan, ease: 'power1.inOut' })
        .call(() => { setPhase('beam-shutdown'); inspectionRef.current?.request('SCAN_COMPLETE') })
        .to({}, { duration: reduced ? 0.04 : FORMATION_I_TIMING.pause })
        .addLabel('beamCollapse')
        // Retain these authored time weights and the following 3D showcase.
        // The beam's actual contraction now spans through that showcase;
        // its fade follows the common completion beat below.
        .to({}, { duration: reduced ? 0.12 : FORMATION_I_TIMING.contraction })
        .to({}, { duration: reduced ? 0.08 : FORMATION_I_TIMING.fade })
        .to(indicatorRef.current, dynamicStatus
          ? { autoAlpha: 1, y: 0, duration: 0 }
          : { autoAlpha: 0, y: reduced ? 0 : 8, duration: reduced ? 0.08 : 0.2 }, '<')
        .call(() => setPhase('showcasing'))
        .to(state, { showcase: 3, orbitScale: 1, orbitReveal: 1, duration: reduced ? 0.12 : duration.showcase, ease: 'power2.out' })
        .call(() => {
          setPhase('handoff')
          techTextReadyRef?.current?.entranceDiagnostics?.begin({ timelineTime: timeline?.time(), duration: duration.handoff })
          orbitDiagnostics?.note('loader handoff begin', { progress: timeline?.progress(), time: timeline?.time(), heroTarget: state.heroTarget })
          inspectionRef.current?.request('HANDOFF_START')
        })
        .addLabel('handoff')
        .addLabel('loaderFinale')
      if (dynamicStatus && readyIndicatorMode === 'dot') {
        // The first homepage elements begin revealing at handoff + 15%. Fit
        // both exits entirely before that point, without extending the master
        // timeline or hiding their parent before the child tweens can render.
        const beforeHomepageReveal = duration.handoff * 0.15
        const textExitDuration = reduced ? beforeHomepageReveal * 0.8 : Math.min(0.25, beforeHomepageReveal * 0.8)
        const dotExitDuration = reduced ? beforeHomepageReveal * 0.94 : Math.min(0.3, beforeHomepageReveal * 0.94)
        timeline.to(statusTextRef.current, {
          autoAlpha: 0, y: reduced ? 0 : -5, duration: textExitDuration, ease: 'power2.inOut',
        }, 'handoff')
        timeline.to(indicatorSegmentRef.current, {
          autoAlpha: 0, scale: reduced ? 1 : 0.7, transformOrigin: '50% 50%',
          duration: dotExitDuration, ease: 'power2.inOut',
        }, 'handoff')
        timeline.set(indicatorRef.current, { autoAlpha: 0 }, `handoff+=${dotExitDuration}`)
      } else if (dynamicStatus) {
        timeline.set(indicatorRef.current, { autoAlpha: 0 }, 'handoff')
      }
      timeline.to(state, { handoff: 1, background: 0, duration: duration.handoff, ease: 'power2.inOut' })
      const heroEntranceStart = duration.handoff * 0.15
      const heroEntranceStagger = duration.handoff * 0.045
      const heroSection = root.querySelector('section[aria-labelledby="cinematic-title"]')
      heroNodes.forEach((node, index) => {
        const isHeroSection = node === heroSection
        const nodeStart = isHeroSection
          ? duration.handoff * 0.3
          : heroEntranceStart + heroEntranceStagger * index
        // The Orbit follows the handoff channel through its full 1s ease.
        // Start the section reveal as that landing is underway, and retain the
        // original 700ms text treatment so it ends with the Orbit at handoff.
        const nodeDuration = duration.handoff * 0.7
        timeline.to(node, {
          autoAlpha: 1, y: 0, filter: reduced ? 'none' : 'blur(0px)',
          duration: nodeDuration, ease: 'power2.out',
          ...(isHeroSection ? {
            onUpdate: function () {
              const diagnostics = techTextReadyRef?.current?.entranceDiagnostics
              diagnostics?.write('SculptureWindow GSAP Hero section entrance tween onUpdate()', { time: timeline.time(), progress: this.progress() })
              diagnostics?.entranceFrame({ masterTime: timeline.time(), handoffStart: timeline.labels.handoff,
                tweenProgress: this.progress(), nativeSectionStart: timeline.labels.handoff + nodeStart,
                nativeSectionDuration: nodeDuration, ease: 'power2.out' })
              techTextReadyRef?.current?.presentationListeners?.forEach(update => update())
            },
          } : {}),
        }, `handoff+=${nodeStart}`)
      })
      // Formation I owns the orbital clock. LoadingSculpture consumes this
      // channel in scan mode instead of advancing a competing frame clock.
      addFormationIOrbitClock(timeline, state, reduced, duration.orbit)
      // The compaction, scan and final Orbit showcase keep their original
      // schedules. Finish the beam and bottom indicator with that final pose,
      // before the unchanged Hero reveal offsets after handoff.
      const progressEnd = timeline.labels.loaderFinale
      timeline.to(state, {
        scanBeamExpand: 0,
        duration: progressEnd - timeline.labels.beamCollapse,
        ease: 'power3.inOut',
      }, 'beamCollapse')
      // R3F stops writing the scan beam on handoff. Commit its exact endpoint
      // here so the last contracted frame does not depend on frame ordering.
      timeline.set(scanBeamRef.current, { '--beam-expand': 0, '--beam-dot': 1 }, 'loaderFinale')
      const beamFadeDuration = Math.min(reduced ? 0.08 : FORMATION_I_TIMING.fade, duration.handoff * 0.15 * 0.94)
      timeline.to(state, { scanBeamOpacity: 0, duration: beamFadeDuration, ease: 'power2.in' }, 'loaderFinale')
      timeline.to(scanBeamRef.current, { autoAlpha: 0, duration: beamFadeDuration, ease: 'power2.in' }, 'loaderFinale')
      timeline.to(indicatorSegmentRef.current, {
        scaleX: 1,
        duration: progressEnd - timeline.labels.separation,
        ease: 'none',
      }, 'separation')
      addReadyIndicatorTransition(timeline, timeline.labels.beamCollapse, progressEnd)
      if (dynamicStatus) {
        const presentationStart = timeline.labels.separation
        const presentationEnd = timeline.labels.handoff
        const statusInterval = (presentationEnd - presentationStart) / 4
        timeline.call(() => changeStatus('IN MOTION'), null, presentationStart + statusInterval)
        timeline.call(() => changeStatus('ALIGNING'), null, presentationStart + statusInterval * 2)
        timeline.call(() => {
          if (readinessRef.current.canvas && readinessRef.current.fonts) {
            changeStatus('READY')
          }
        }, null, presentationStart + statusInterval * 3)
      }
      if (HANDOFF_DEBUG) timeline.call(() => inspectionRef.current?.request('HANDOFF_MIDPOINT'), null, `handoff+=${duration.handoff * 0.5}`)
    })
    applyFrame()
    readyTickRef.current = readinessChanged
    readinessRef.current.fonts = !document.fonts
    if (document.fonts) {
      const fontsSettled = () => {
        if (disposed) return
        readinessRef.current.fonts = true
        loaderLog('fonts-ready', { readiness: { ...readinessRef.current } })
        readinessChanged()
      }
      document.fonts.ready.then(fontsSettled, fontsSettled)
    }
    // Retain the existing failure timeout; it is not a loading percentage or
    // an extra presentation delay. The minimum orbit is owned by the timeline.
    const readinessFallback = window.setTimeout(() => {
      if (readinessRef.current.canvas && readinessRef.current.fonts) {
        return
      }
      if (!readinessRef.current.canvas) {
        // If no usable Canvas arrived, there is no R3F frame to acknowledge
        // completion. Release the DOM portfolio through the existing fallback.
        loaderLog('canvas-unavailable-fallback')
        timeline.kill()
        finishLoader()
        return
      }
      readinessRef.current.fonts = true
      loaderLog('readiness-timeout-fallback', { readiness: { ...readinessRef.current } })
      readinessChanged()
    }, 1400)
    const resize = () => {
      // A pre-handoff viewport resize invalidates the cached fullscreen frame;
      // after commit the Hero layout owns the wrapper and the cache must stay
      // untouched to avoid reintroducing a coordinate discontinuity.
      if (!state.handoffCommitted) fullscreenFrame = null
      applyFrame()
    }
    const visibility = () => {
      if (inspectionRef.current?.frozen) return
      if (document.hidden) timeline.pause()
      else if (startedRef.current && !gated) timeline.play()
      else readinessChanged()
    }
    const techTextReady = () => readinessChanged()
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    element.addEventListener('hero-tech-text-ready', techTextReady)
    readinessChanged()
    return () => {
      const cleanupStart = state.handoffPerformance ? performance.now() : 0
      state.handoffPerformance?.note('loader DOM/timeline cleanup start', state)
      disposed = true
      statusTransitionRef.current?.kill()
      statusTransitionRef.current = null
      window.clearTimeout(readinessFallback)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      element.removeEventListener('hero-tech-text-ready', techTextReady)
      readyTickRef.current = null
      state.onHandoffRendered = null
      state.commitHandoff = null
      state.scanLineElement = null
      if (state.phase === 'complete') {
        // Completion is a transfer of ownership, not a rewind. Reverting the
        // context also rewinds state.handoff/scanProgress and can invoke old
        // loader writes. Kill the finished timeline and restore only the DOM
        // properties it temporarily owned; keep the completed frame channels.
        context.kill(false)
        techTextReadyRef?.current?.entranceDiagnostics?.write('SculptureWindow completed-loader cleanup → restore Hero inline styles', {})
        heroNodes.forEach((node, index) => {
          if (heroInlineStyles[index] === null) node.removeAttribute('style')
          else node.setAttribute('style', heroInlineStyles[index])
        })
        // Normal scroll owns only --sculpture-*; loader channels must not
        // survive to affect later section backgrounds or renderer placement.
        for (const property of Array.from(element.style)) {
          if (property.startsWith('--loader-')) element.style.removeProperty(property)
        }
      } else context.revert()
      sequenceRef.current = null
      if (inspectionRef.current) inspectionRef.current.timeline = null
      if (state.phase !== 'complete') {
        startedRef.current = false
        Object.assign(state, createLoaderState(), { heroTarget: initialLayoutRef.current })
      }
      state.handoffPerformance?.note('loader DOM/timeline cleanup end', state, { durationMs: performance.now() - cleanupStart })
    }
  }, [finishLoader, heroRef, loaderActive, loaderOrbitVariant, readyIndicatorMode, techTextReadyRef, windowRef])

  const move = event => {
    if (loaderActive) return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
    pointerRef.current.y = Math.max(-1, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2))
  }
  const reset = () => { pointerRef.current.x = 0; pointerRef.current.y = 0 }

  return (
    <>
      {HANDOFF_DEBUG && inspectionRef.current && <HandoffInspectionPanel debug={inspectionRef.current} />}
      {loaderActive && <>
        <div ref={backdropRef} className={styles.backdrop} data-loader-backdrop aria-hidden="true" style={{ position: 'fixed', zIndex: 39 }} />
        <div ref={indicatorRef} className={styles.indicator} data-loader-indicator role="status" aria-live="polite" aria-atomic={loaderOrbitVariant === 'perspective-ellipse' ? 'true' : undefined} style={{ position: 'fixed', zIndex: 41 }}>
          {loaderOrbitVariant === 'perspective-ellipse' ? (
            <>
              <span ref={statusTextRef} className={styles.loaderStatus} aria-hidden="true">
                <span ref={element => { statusLayerRefs.current[0] = element }}>INITIALIZING</span>
                <span ref={element => { statusLayerRefs.current[1] = element }} />
              </span>
              <span ref={statusAccessibleRef} className={styles.screenReaderOnly}>INITIALIZING</span>
            </>
          ) : <span>LOADING...</span>}
          <span ref={indicatorTrackRef} className={styles.loadingTrack} aria-hidden="true"><span ref={indicatorSegmentRef} /></span>
        </div>
      </>}
    <div ref={windowRef} className={styles.window} data-sculpture-window
      // Inline positioning also isolates the overlay from legacy main > * rules.
      data-loader-preview={loaderActive ? 'true' : 'false'}
      data-loader-handoff="false"
      data-loader-preview-mode={LOADER_PREVIEW ? 'true' : 'false'}
      data-scope-scene-fallback={scopeSceneFallback ? 'true' : 'false'}
      data-scene-fallback-visible="true"
      style={{ position: loaderActive ? 'fixed' : 'absolute', zIndex: loaderActive ? 40 : 5 }}
      onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}
      role="img" aria-label={loaderActive
        ? 'Portfolio loading sculpture'
        : 'Flux: an original twisted dark chrome sculpture. Move your pointer over it to explore.'}>
      <SceneBoundary onUnavailable={handleUnavailable}>
        <Suspense fallback={<span className={styles.fallback}>FLUX / Loading</span>}>
          <SculptureScene
            productionLoader
            particleShape={particleShape}
            particleRevealRange={particleRevealRange}
            loaderOrbitVariant={loaderOrbitVariant}
            pointerRef={pointerRef}
            controlRef={sceneControlRef}
            loaderPreview={loaderActive}
            lifecycleRef={lifecycleRef}
            loaderFormation={loaderActive ? 'scan' : null}
            onCanvasReady={handleCanvasReady}
            orbitDiagnostics={orbitDiagnostics}
            ditherVeilReplaceParticle={ditherVeilReplaceParticle}
          />
        </Suspense>
      </SceneBoundary>
      <span className={styles.label} aria-hidden="true">FLUX / 001</span>
    </div>
    {loaderActive && createPortal(
      <div
        ref={scanBeamRef}
        data-cluster-width-ratio={loaderBeamClusterRatio ?? undefined}
        className={`${styles.scanBeam} ${loaderOrbitVariant === 'perspective-ellipse' ? styles.scanBeamRefinement : ''}`}
        aria-hidden="true"
      >
        <span className={styles.scanBeamGlow} />
        <span className={styles.scanBeamCore} />
        <span className={styles.scanBeamDot} />
      </div>,
      document.body,
    )}
    </>
  )
}
