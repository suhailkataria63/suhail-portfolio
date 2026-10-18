import { useRef } from 'react'
import { useLiquidInk } from './useLiquidInk'
import styles from './CinematicPreview.module.css'

export default function CinematicPreview() {
  const heroRef = useRef(null)
  const canvasRef = useRef(null)
  useLiquidInk(heroRef, canvasRef)

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
        <h1 className={styles.title} id="cinematic-title" aria-label="Building what's next.">
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
    </main>
  )
}
