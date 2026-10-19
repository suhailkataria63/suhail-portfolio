import { useEffect, useRef } from 'react'
import styles from './AboutIntro.module.css'

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))

export default function AboutIntro({ controlRef }) {
  const transitionParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('aboutTransition')
    : null
  const transitionMode = transitionParam === 'rise' ? 'rise' : 'fade'
  const veilRef = useRef(null)
  const contentRef = useRef(null)
  const lineRefs = useRef([])
  const subtitleRef = useRef(null)

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const rawProgress = Math.max(0, value)
        const progress = clamp(rawProgress)
        const exit = clamp((rawProgress - 1) / 0.16)
        const transitionProgress = clamp(progress / 0.55)
        const contentReveal = clamp((progress - 0.55) / 0.25)
        if (veilRef.current) {
          veilRef.current.style.opacity = progress > 0 ? '1' : '0'
          if (transitionMode === 'fade') {
            const shade = Math.round(255 * transitionProgress)
            veilRef.current.style.background = `rgb(${shade}, ${shade}, ${shade})`
            veilRef.current.style.transform = 'translate3d(0, 0, 0)'
          } else {
            veilRef.current.style.background = '#fff'
            veilRef.current.style.transform = `translate3d(0, ${(1 - transitionProgress) * 100}%, 0)`
          }
        }
        lineRefs.current.forEach((line, index) => {
          if (!line) return
          const reveal = clamp((contentReveal - index * 0.12) / 0.88)
          line.style.opacity = `${reveal * (1 - exit)}`
          line.style.transform = `translate3d(0, ${(1 - reveal) * 110 - exit * 55}%, 0)`
        })
        if (subtitleRef.current) {
          subtitleRef.current.style.opacity = `${clamp((contentReveal - 0.2) / 0.8) * (1 - exit)}`
          subtitleRef.current.style.transform = `translate3d(0, ${(1 - contentReveal) * 18 - exit * 18}px, 0)`
        }
        if (contentRef.current) {
          contentRef.current.style.opacity = `${contentReveal * (1 - exit)}`
          contentRef.current.style.transform = `translate3d(0, ${-exit * 10}vh, 0)`
        }
      },
    }
    controlRef.current.setProgress(0)
    return () => { controlRef.current = null }
  }, [controlRef, transitionMode])

  return (
    <>
      <div ref={veilRef} className={styles.veil} data-about-veil aria-hidden="true" />
      <section ref={contentRef} className={styles.content} data-about-content aria-labelledby="about-intro-title">
        <span className={styles.eyebrow}>03 / 04 — THE PERSON BEHIND THE WORK</span>
        <h2 id="about-intro-title" className={styles.title}>
          <span className={styles.mask}><span ref={element => { lineRefs.current[0] = element }}>BEYOND</span></span>
          <span className={styles.mask}><span ref={element => { lineRefs.current[1] = element }}>THE CODE.</span></span>
        </h2>
        <p ref={subtitleRef}>There&apos;s more to the story than what I build.</p>
      </section>
    </>
  )
}
