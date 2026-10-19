import { useEffect, useRef } from 'react'
import styles from './ContactScene.module.css'

const contactLinks = {
  email: 'mailto:suhail.kataria63@gmail.com',
  linkedin: 'https://linkedin.com/in/suhail-kataria63',
  github: 'https://github.com/suhailkataria63',
}

const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)

export default function ContactScene({ controlRef }) {
  const sceneRef = useRef(null)
  const marqueeRef = useRef(null)
  const layoutRef = useRef(null)
  const headingRef = useRef(null)
  const bodyRef = useRef(null)
  const linksRef = useRef(null)

  const setInteractive = active => {
    const links = linksRef.current?.querySelectorAll('a')
    links?.forEach(link => {
      link.tabIndex = active ? 0 : -1
      link.style.pointerEvents = active ? 'auto' : 'none'
    })
    if (linksRef.current) linksRef.current.style.pointerEvents = active ? 'auto' : 'none'
    if (sceneRef.current) sceneRef.current.style.pointerEvents = active ? 'auto' : 'none'
  }

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const progress = clamp(value)
        // Contact owns five explicit subranges: Curious exit (0-.16),
        // helix/environment (.16-.48), black hold (.48-.6), marquee
        // (.6-.86), then the final contact reveal (.86-1).
        const marqueeIn = ease(clamp((progress - 0.6) / 0.08))
        const marqueeOut = ease(clamp((progress - 0.82) / 0.04))
        const marqueeProgress = clamp((progress - 0.6) / 0.24)
        const layoutIn = ease(clamp((progress - 0.86) / 0.12))
        const interactive = progress >= 0.86 && layoutIn > 0.5
        if (sceneRef.current) sceneRef.current.style.opacity = progress > 0 ? '1' : '0'
        setInteractive(interactive)
        if (marqueeRef.current) {
          const width = marqueeRef.current.scrollWidth || window.innerWidth
          const x = window.innerWidth + width - marqueeProgress * (window.innerWidth * 2 + width * 2)
          marqueeRef.current.style.opacity = `${marqueeIn * (1 - marqueeOut)}`
          marqueeRef.current.style.transform = `translate3d(${x}px, -50%, 0)`
        }
        if (layoutRef.current) {
          layoutRef.current.style.opacity = `${layoutIn}`
          layoutRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 34}px, 0)`
        }
        if (headingRef.current) headingRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 22}px, 0)`
        if (bodyRef.current) bodyRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 18}px, 0)`
        if (linksRef.current) linksRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 14}px, 0)`
      },
    }
    controlRef.current.setProgress(0)
    return () => {
      setInteractive(false)
      controlRef.current = null
    }
  }, [controlRef])

  return (
    <section ref={sceneRef} className={styles.scene} data-contact-scene aria-label="Contact">
      <div ref={marqueeRef} className={styles.marquee} aria-hidden="true">LET&apos;S TALK IDEAS.</div>
      <div ref={layoutRef} className={styles.layout}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>04 / 04 — CONTACT</span>
          <h2 ref={headingRef}>HAVE SOMETHING<br />IN MIND?</h2>
          <p ref={bodyRef}>Whether it&apos;s a project, an opportunity, or just an interesting idea, I&apos;d love to hear about it.</p>
          <nav ref={linksRef} className={styles.links} aria-label="Contact links">
            <a href={contactLinks.email} tabIndex={-1}>EMAIL <span aria-hidden="true">↗</span></a>
            <a href={contactLinks.linkedin} tabIndex={-1} target="_blank" rel="noopener noreferrer">LINKEDIN <span aria-hidden="true">↗</span></a>
            <a href={contactLinks.github} tabIndex={-1} target="_blank" rel="noopener noreferrer">GITHUB <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </div>
    </section>
  )
}
