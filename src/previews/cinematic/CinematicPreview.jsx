import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLiquidInk } from './useLiquidInk'
import { useCinematicScroll } from './useCinematicScroll'
import SculptureWindow from './sculpture/SculptureWindow'
import ProjectShowcase from './ProjectShowcase'
import AboutIntro from './AboutIntro'
import BuilderScene from './BuilderScene'
import JourneyScene from './JourneyScene'
import SceneThree from './SceneThree'
import ContactScene from './ContactScene'
import CinematicNav from './CinematicNav'
import { measureOrbitIDotLanding } from '../experiments/orbitIDotLanding'
import { PREVIEW_FILL_START_PHASE, PREVIEW_PARTICLE_REVEAL } from './journeyBeyondPreviewTiming'
import styles from './CinematicPreview.module.css'

const MetallicCursor = lazy(() => import('./MetallicCursor'))
const HeroTechTextLayer = lazy(() => import('../experiments/HeroTechTextLayer'))
const AboutThreadsLayer = lazy(() => import('../experiments/AboutThreadsLayer'))
const DitherVeil = lazy(() => import('../experiments/dither-veil/DitherVeil'))

class DitherVeilBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { this.props.onFailure?.(error) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

class HeroTechTextBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { this.props.onFailure?.(error) }
  render() { return this.state.failed ? null : this.props.children }
}

export default function CinematicPreview({ measureOrbitLanding = measureOrbitIDotLanding, particleShape = 'ribbon', scrollMode = 'continuous', shortenHeroTransition = false, shortenFinalProjectToBeyond = false, shortenBeyondToBuilderEntry = false, shortenBuilderRevealAndJourneyEntry = false, firstMilestoneEntranceSpan = 0.14, shortenJourneyToBeyondReveal = false, shortenCuriousToContact = false, showCv = false, enableCustomCursor = false, customCursorVariant = 'original', customCursorFinish = 'approved', cleanHomepageIdentity = false, loaderOrbitVariant = 'original', loaderBeamClusterRatio = null, readyIndicatorMode = 'original', enableLiquidInk = true, projectTiltExperiment = null, projectTiltPreview = false, projectCircularTextExperiment = null, heroTechTextExperiment = null, aboutThreadsExperiment = null, aboutThreadsEnabled = false, aboutHighlighterExperiment = null, aboutCreativeTypeExperiment = null, aboutStrokeTextExperiment = null, ditherVeilExperiment = null, ditherVeilProduction = false, beyondGradientTextExperiment = null, beyondToolkitExperiment = null, beyondCuriosityExperiment = null, contactMetallicTextExperiment = null, orbitDiagnostics = null, heroEntranceDiagnostics = null } = {}) {
  const heroRef = useRef(null)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const firstLineRef = useRef(null)
  const secondLineRef = useRef(null)
  const sculptureWindowRef = useRef(null)
  const sceneControlRef = useRef(null)
  const inkControlRef = useRef(null)
  const projectsControlRef = useRef(null)
  const aboutControlRef = useRef(null)
  const builderControlRef = useRef(null)
  const journeyControlRef = useRef(null)
  const scene3ControlRef = useRef(null)
  const contactControlRef = useRef(null)
  const aboutThreadsControlRef = useRef(null)
  const navControlRef = useRef({})
  const heroTechLifecycleRef = useRef({ progress: 0, opacity: 1, active: true, listeners: new Set() })
  const metallicCursorRef = useRef(null)
  const needsExperimentHandoff = Boolean(heroTechTextExperiment)
  const [loaderHandoffReady, setLoaderHandoffReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => needsExperimentHandoff && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false))
  const [techTextCanvasReady, setTechTextCanvasReady] = useState(false)
  const techTextCanvasReadyRef = useRef({ required: false, ready: false, failed: false, failure: null, presentationListeners: new Set() })
  const techTextConfigurationRef = useRef(null)
  techTextCanvasReadyRef.current.entranceDiagnostics = heroEntranceDiagnostics
  heroTechLifecycleRef.current.entranceDiagnostics = heroEntranceDiagnostics
  useLiquidInk(heroRef, canvasRef, inkControlRef, enableLiquidInk)
  useCinematicScroll(heroRef, sculptureWindowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef, navControlRef, scrollMode, shortenHeroTransition, shortenFinalProjectToBeyond, shortenBeyondToBuilderEntry, shortenBuilderRevealAndJourneyEntry, shortenJourneyToBeyondReveal, shortenJourneyToBeyondReveal, shortenCuriousToContact, heroTechTextExperiment ? heroTechLifecycleRef : null, orbitDiagnostics, aboutThreadsExperiment ? aboutThreadsControlRef : null)

  useEffect(() => orbitDiagnostics?.start({ heroRef, titleRef, firstLineRef, wrapperRef: sculptureWindowRef, lifecycleRef: heroTechLifecycleRef }), [orbitDiagnostics])
  useEffect(() => heroEntranceDiagnostics?.attach({ heroRef, titleRef, firstLineRef, secondLineRef, wrapperRef: sculptureWindowRef, lifecycleRef: heroTechLifecycleRef, readinessRef: techTextCanvasReadyRef }), [heroEntranceDiagnostics])

  useEffect(() => {
    if (!needsExperimentHandoff) return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [needsExperimentHandoff])

  useEffect(() => {
    if (!needsExperimentHandoff) return undefined
    const windowElement = sculptureWindowRef.current
    const root = heroRef.current
    if (!windowElement) return undefined
    const markReady = event => {
      techTextCanvasReadyRef.current.entranceDiagnostics?.write('CinematicPreview handoff event → setLoaderHandoffReady(true)', { event: event?.type || 'initial dataset check' })
      orbitDiagnostics?.note('sculpture-loader-complete', { wrapperRect: windowElement.getBoundingClientRect().toJSON?.() })
      setLoaderHandoffReady(true)
    }
    windowElement.addEventListener('sculpture-loader-handoff-ready', markReady)
    windowElement.addEventListener('sculpture-loader-complete', markReady)
    if (root?.dataset.loaderActive === 'false' || windowElement.dataset.loaderPreview === 'false') markReady()
    return () => {
      windowElement.removeEventListener('sculpture-loader-handoff-ready', markReady)
      windowElement.removeEventListener('sculpture-loader-complete', markReady)
    }
  }, [needsExperimentHandoff, orbitDiagnostics])

  const techTextActive = heroTechTextExperiment && heroTechTextExperiment.variant !== 'solid'
  const techTextRequiresCanvas = Boolean(
    techTextActive
    && !reducedMotion
    && !window.matchMedia('(hover: none), (pointer: coarse)').matches
  )
  techTextCanvasReadyRef.current.required = techTextRequiresCanvas
  // Mount and rasterize during the existing loader presentation. The portal
  // sits below the loader and remains inert until handoff, so the first exposed
  // Hero frame already uses the canvas rather than swapping from native text.
  const showTechTextLayer = techTextActive && !reducedMotion
  const techTextCanvasVisible = showTechTextLayer && techTextCanvasReady
  const ditherVeilEnabled = ditherVeilExperiment?.mode === 'dither'
  const ditherVeilVisual = ditherVeilEnabled ? (
    <DitherVeilBoundary
      onFailure={ditherVeilExperiment.onUnavailable}
      fallback={null}
    >
      <DitherVeil src={ditherVeilExperiment.src} {...ditherVeilExperiment.settings} />
    </DitherVeilBoundary>
  ) : null

  useEffect(() => {
    const configuration = `${Boolean(techTextActive)}:${techTextRequiresCanvas}`
    if (techTextConfigurationRef.current !== null && techTextConfigurationRef.current !== configuration) {
      techTextCanvasReadyRef.current.ready = false
      techTextCanvasReadyRef.current.failed = false
      techTextCanvasReadyRef.current.failure = null
      setTechTextCanvasReady(false)
    }
    techTextConfigurationRef.current = configuration
    sculptureWindowRef.current?.dispatchEvent(new Event('hero-tech-text-ready'))
  }, [techTextActive, techTextRequiresCanvas])

  const onTechTextReady = useCallback(() => {
    techTextCanvasReadyRef.current.entranceDiagnostics?.write('CinematicPreview.onTechTextReady() → ready flag and React state', { ready: true })
    orbitDiagnostics?.note('Tech Text canvases ready')
    techTextCanvasReadyRef.current.ready = true
    techTextCanvasReadyRef.current.failed = false
    setTechTextCanvasReady(true)
    sculptureWindowRef.current?.dispatchEvent(new Event('hero-tech-text-ready'))
  }, [orbitDiagnostics])
  const onTechTextUnavailable = useCallback(error => {
    const failure = error instanceof Error ? error.message : String(error || 'Canvas preparation failed')
    techTextCanvasReadyRef.current.entranceDiagnostics?.write('CinematicPreview.onTechTextUnavailable() → native fallback', { failure })
    orbitDiagnostics?.note('Tech Text canvas unavailable; keeping native heading', { failure })
    techTextCanvasReadyRef.current.ready = false
    techTextCanvasReadyRef.current.failed = true
    techTextCanvasReadyRef.current.failure = failure
    setTechTextCanvasReady(false)
    sculptureWindowRef.current?.dispatchEvent(new Event('hero-tech-text-ready'))
  }, [orbitDiagnostics])

  const techTextVisibilityRef = useRef(false)
  useLayoutEffect(() => {
    heroEntranceDiagnostics?.write('CinematicPreview React layout commit → native span visibility', {
      nativeHidden: techTextCanvasVisible, canvasesReady: techTextCanvasReady, loaderHandoffReady,
      spans: [firstLineRef.current?.style.visibility, secondLineRef.current?.style.visibility],
    })
  }, [heroEntranceDiagnostics, techTextCanvasVisible, techTextCanvasReady, loaderHandoffReady])
  useEffect(() => {
    if (techTextCanvasVisible && !techTextVisibilityRef.current) orbitDiagnostics?.note('Native heading hidden; Tech Text canvas visible')
    techTextVisibilityRef.current = techTextCanvasVisible
  }, [techTextCanvasVisible, orbitDiagnostics])

  return (
    <main className={styles.preview} ref={heroRef} data-cinematic-hero data-about-threads-enabled={aboutThreadsEnabled ? 'true' : undefined} data-dither-veil-preview={ditherVeilExperiment && !ditherVeilProduction ? 'true' : undefined} data-dither-veil-production={ditherVeilExperiment && ditherVeilProduction ? 'true' : undefined} data-metal-cursor-scope={enableCustomCursor ? '' : undefined}>
      <header className={styles.header}>
        {cleanHomepageIdentity ? (
          <div className={styles.identity}>
            <a className={`${styles.brand} ${styles.brandLong}`} href="/" aria-label="Suhail Kataria — current portfolio">SUHAIL KATARIA.</a>
            <span className={styles.identityDescriptor}>AI &amp; SOFTWARE ENGINEERING</span>
          </div>
        ) : (
          <a className={styles.brand} href="/" aria-label="Suhail Kataria — current portfolio">
            SUHAIL<span className={styles.brandDot}>®</span>
          </a>
        )}
        {cleanHomepageIdentity ? (
          <span className={styles.topPhilosophy}><span aria-hidden="true">✳</span> IDEAS INTO REALITY</span>
        ) : (
          <span className={styles.edition}>INDEPENDENT MIND.<br />LIMITLESS POSSIBILITIES.</span>
        )}
        {!cleanHomepageIdentity && <a className={styles.back} href="/">PORTFOLIO V1 <span aria-hidden="true">↗</span></a>}
      </header>
      <CinematicNav controlRef={navControlRef} showCv={showCv} cursorToneTargetRef={enableCustomCursor ? metallicCursorRef : null} />

      <section className={`${styles.hero} ${cleanHomepageIdentity ? styles.heroClean : ''}`} aria-labelledby="cinematic-title">
        {!cleanHomepageIdentity && <div className={styles.eyebrow}><span aria-hidden="true">✳</span> IDEAS INTO REALITY</div>}
        <h1 ref={titleRef} className={styles.title} id="cinematic-title" aria-label="Building what's next." style={techTextActive ? { color: heroTechTextExperiment.baseColor } : undefined}>
          <span
            ref={firstLineRef}
            className={styles.firstLine}
            aria-hidden={techTextActive ? 'true' : undefined}
            style={techTextCanvasVisible ? { visibility: 'hidden' } : undefined}
          >BUILDING</span>
          <span
            ref={secondLineRef}
            className={styles.secondLine}
            aria-hidden={techTextActive ? 'true' : undefined}
            style={techTextCanvasVisible ? { visibility: 'hidden' } : undefined}
          >WHAT&apos;S NEXT.</span>
          {showTechTextLayer && (
            <Suspense fallback={null}>
              <HeroTechTextBoundary onFailure={onTechTextUnavailable}>
                <HeroTechTextLayer firstLineRef={firstLineRef} secondLineRef={secondLineRef} settings={heroTechTextExperiment} onReady={onTechTextReady} onUnavailable={onTechTextUnavailable} presentationReady={loaderHandoffReady} presentationRef={techTextCanvasReadyRef} lifecycleRef={heroTechLifecycleRef} orbitDiagnostics={orbitDiagnostics} />
              </HeroTechTextBoundary>
            </Suspense>
          )}
        </h1>
        <div className={styles.caption}>
          <span className={styles.chapter}>(01 — EXPLORATIONS)</span>
          <p>Intelligent products.<br />Unexpected experiences.<br />Made with intent.</p>
        </div>
      </section>

      <footer className={`${styles.footer} ${cleanHomepageIdentity ? styles.footerClean : ''}`}>
        {!cleanHomepageIdentity && <span>AI & SOFTWARE ENGINEERING</span>}
        {cleanHomepageIdentity
          ? <span className={styles.scrollCue}>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span>
          : <span className={styles.interactionHint}>MOVE YOUR CURSOR. MAKE A MARK. <span aria-hidden="true">↗</span></span>}
        {!cleanHomepageIdentity && <span className={styles.motionHint}>IDEAS IN THEIR PUREST FORM.</span>}
        {!cleanHomepageIdentity && <span className={styles.version}>V.02 / 2026</span>}
      </footer>

      {enableLiquidInk && <canvas ref={canvasRef} className={styles.ink} aria-hidden="true" />}
      <SculptureWindow heroRef={heroRef} titleRef={titleRef} windowRef={sculptureWindowRef} sceneControlRef={sceneControlRef} measureHeroTarget={measureOrbitLanding} particleShape={particleShape} particleRevealRange={shortenJourneyToBeyondReveal ? PREVIEW_PARTICLE_REVEAL : null} scopeSceneFallback={shortenJourneyToBeyondReveal} loaderOrbitVariant={loaderOrbitVariant} loaderBeamClusterRatio={loaderBeamClusterRatio} readyIndicatorMode={readyIndicatorMode} techTextReadyRef={techTextCanvasReadyRef} orbitDiagnostics={orbitDiagnostics} ditherVeilReplaceParticle={ditherVeilEnabled} />
      <ProjectShowcase controlRef={projectsControlRef} tiltExperiment={projectTiltExperiment} tiltPreview={projectTiltPreview} circularTextExperiment={projectCircularTextExperiment} />
      <AboutIntro controlRef={aboutControlRef} highlighterExperiment={aboutHighlighterExperiment} />
      {aboutThreadsExperiment && (
        <Suspense fallback={null}>
          <AboutThreadsLayer controlRef={aboutThreadsControlRef} mode={aboutThreadsExperiment.mode} settings={aboutThreadsExperiment.settings} />
        </Suspense>
      )}
      <BuilderScene controlRef={builderControlRef} separateEntryFromFill={shortenBeyondToBuilderEntry} creativeTypeExperiment={aboutCreativeTypeExperiment} strokeTextExperiment={aboutStrokeTextExperiment} />
      <JourneyScene controlRef={journeyControlRef} firstMilestoneEntranceSpan={firstMilestoneEntranceSpan} exitEndProgress={shortenJourneyToBeyondReveal ? 0.98 : 1} />
      <SceneThree
        controlRef={scene3ControlRef}
        gradientTextExperiment={beyondGradientTextExperiment}
        toolkitExperiment={beyondToolkitExperiment}
        curiosityExperiment={beyondCuriosityExperiment}
        ditherVeilPreview={ditherVeilExperiment?.mode === 'dither' && !ditherVeilProduction}
        fillStartPhase={shortenJourneyToBeyondReveal ? PREVIEW_FILL_START_PHASE : undefined}
        ditherVisual={ditherVeilVisual}
      />
      <ContactScene controlRef={contactControlRef} metallicTextExperiment={contactMetallicTextExperiment} />
      {enableCustomCursor && (
        <Suspense fallback={null}>
          <MetallicCursor cursorRef={metallicCursorRef} scopeRef={heroRef} variant={customCursorVariant} finish={customCursorFinish} />
        </Suspense>
      )}
    </main>
  )
}
