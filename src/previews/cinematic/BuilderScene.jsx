import { useEffect, useRef } from 'react'
import styles from './BuilderScene.module.css'

const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)

export default function BuilderScene({ controlRef }) {
  const sceneRef = useRef(null)
  const statementRef = useRef(null)
  const lineRefs = useRef([])
  const introRef = useRef(null)

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const progress = clamp(value)
        // Reserve a short white handoff after the previous scene has faded.
        const local = clamp((progress - 0.18) / 0.82)
        const reveal = ease(clamp(local / 0.22))
        const fill = clamp((local - 0.16) / 0.32)
        const reposition = ease(clamp((local - 0.38) / 0.3))
        const exit = ease(clamp((local - 0.78) / 0.22))

        if (sceneRef.current) {
          sceneRef.current.style.opacity = progress > 0 ? `${1 - exit}` : '0'
          sceneRef.current.style.setProperty('--builder-bg', `${Math.min(1, progress / 0.28)}`)
        }
        lineRefs.current.forEach((line, index) => {
          if (!line) return
          const lineReveal = clamp((reveal - index * 0.08) / 0.92)
          line.style.opacity = `${lineReveal * (1 - exit)}`
          line.style.transform = `translate3d(0, ${(1 - lineReveal) * 105 - exit * 70}%, 0)`
        })
        if (statementRef.current) {
          statementRef.current.style.transform = `translate3d(${reposition * -2}vw, ${reposition * -4}vh, 0) scale(${1 - reposition * 0.14})`
          statementRef.current.style.opacity = `${1 - exit}`
        }
        lineRefs.current.slice(1, 3).forEach(line => {
          if (line) line.style.color = `rgba(16, 23, 34, ${fill})`
        })
        if (introRef.current) {
          introRef.current.style.opacity = `${reposition * (1 - exit)}`
          introRef.current.style.transform = `translate3d(${(1 - reposition) * 3}vw, 0, 0)`
        }
      },
    }
    controlRef.current.setProgress(0)
    return () => { controlRef.current = null }
  }, [controlRef])

  return (
    <section ref={sceneRef} className={styles.scene} data-builder-scene aria-label="About — The Builder">
      <div ref={statementRef} className={styles.statement}>
        <span ref={element => { lineRefs.current[0] = element }} className={`${styles.line} ${styles.solid}`}>I LIKE</span>
        <span ref={element => { lineRefs.current[1] = element }} className={`${styles.line} ${styles.outline}`}>DESIGNING</span>
        <span ref={element => { lineRefs.current[2] = element }} className={`${styles.line} ${styles.outline}`}>EXPLORING</span>
        <span ref={element => { lineRefs.current[3] = element }} className={`${styles.line} ${styles.solid} ${styles.building}`}>BUILDING <em>— THINGS THAT MATTER.</em></span>
      </div>
      <div ref={introRef} className={styles.intro}>
        <span className={styles.eyebrow}>01 / 03 — THE BUILDER</span>
        <p>I&apos;m a developer who enjoys turning ideas into useful products. I love building AI-powered web applications, exploring new technologies, and creating software that solves real problems.</p>
      </div>
    </section>
  )
}
