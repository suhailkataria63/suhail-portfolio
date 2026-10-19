import { useRef } from 'react'
import { useLiquidInk } from './useLiquidInk'
import { useCinematicScroll } from './useCinematicScroll'
import SculptureWindow from './sculpture/SculptureWindow'
import ProjectShowcase from './ProjectShowcase'
import AboutIntro from './AboutIntro'
import BuilderScene from './BuilderScene'
import JourneyScene from './JourneyScene'
import SceneThree from './SceneThree'
import ContactScene from './ContactScene'
import styles from './CinematicPreview.module.css'

export default function CinematicPreview() {
  const heroRef = useRef(null)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const sculptureWindowRef = useRef(null)
  const sceneControlRef = useRef(null)
  const inkControlRef = useRef(null)
  const projectsControlRef = useRef(null)
  const aboutControlRef = useRef(null)
  const builderControlRef = useRef(null)
  const journeyControlRef = useRef(null)
  const scene3ControlRef = useRef(null)
  const contactControlRef = useRef(null)
  useLiquidInk(heroRef, canvasRef, inkControlRef)
  useCinematicScroll(heroRef, sculptureWindowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef)

  return (
    <main className={styles.preview} ref={heroRef} data-cinematic-hero>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Suhail Kataria — current portfolio">
          SUHAIL<span className={styles.brandDot}>®</span>
        </a>
        <span className={styles.edition}>INDEPENDENT MIND.<br />LIMITLESS POSSIBILITIES.</span>
        <a className={styles.back} href="/">PORTFOLIO V1 <span aria-hidden="true">↗</span></a>
      </header>

      <section className={styles.hero} aria-labelledby="cinematic-title">
        <div className={styles.eyebrow}><span aria-hidden="true">✳</span> IDEAS INTO REALITY</div>
        <h1 ref={titleRef} className={styles.title} id="cinematic-title" aria-label="Building what's next.">
          <span className={styles.firstLine}>BUILDING</span>
          <span className={styles.secondLine}>WHAT&apos;S NEXT.</span>
        </h1>
        <div className={styles.caption}>
          <span className={styles.chapter}>(01 — EXPLORATIONS)</span>
          <p>Intelligent products.<br />Unexpected experiences.<br />Made with intent.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>AI & SOFTWARE ENGINEERING</span>
        <span className={styles.interactionHint}>MOVE YOUR CURSOR. MAKE A MARK. <span aria-hidden="true">↗</span></span>
        <span className={styles.motionHint}>IDEAS IN THEIR PUREST FORM.</span>
        <span className={styles.version}>V.02 / 2026</span>
      </footer>

      <canvas ref={canvasRef} className={styles.ink} aria-hidden="true" />
      <SculptureWindow heroRef={heroRef} titleRef={titleRef} windowRef={sculptureWindowRef} sceneControlRef={sceneControlRef} />
      <ProjectShowcase controlRef={projectsControlRef} />
      <AboutIntro controlRef={aboutControlRef} />
      <BuilderScene controlRef={builderControlRef} />
      <JourneyScene controlRef={journeyControlRef} />
      <SceneThree controlRef={scene3ControlRef} />
      <ContactScene controlRef={contactControlRef} />
    </main>
  )
}
