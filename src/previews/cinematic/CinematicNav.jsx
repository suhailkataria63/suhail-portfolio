import { useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import styles from './CinematicNav.module.css'

const clamp = value => Math.max(0, Math.min(1, value))

const mixRgb = (dark, light, amount) => dark.map((channel, index) => Math.round(channel + (light[index] - channel) * amount)).join(', ')

export default function CinematicNav({ controlRef, showCv = false, cursorToneTargetRef = null }) {
  const navRef = useRef(null)
  const linkRefs = useRef({})
  const focusedRef = useRef(false)
  const previousProgress = useRef(0)
  const directionRef = useRef(0)

  useEffect(() => {
    if (!controlRef || !navRef.current) return undefined
    const nav = navRef.current
    const darkInk = [242, 245, 249]
    const lightInk = [12, 20, 32]
    const darkBorder = [255, 255, 255]
    const lightBorder = [24, 36, 52]
    const darkSurface = [8, 12, 19]
    const lightSurface = [255, 255, 255]

    const setFocusState = active => {
      focusedRef.current = active
      if (active) {
        nav.style.opacity = '1'
        nav.style.transform = 'translate3d(-50%, 0, 0)'
        nav.style.filter = 'blur(0)'
      }
    }

    const setProgress = ({ progress = 0, total = 1, tone = 0, activeSection = '' } = {}) => {
      const normalized = clamp(progress / Math.max(total, 1))
        if (cursorToneTargetRef) {
          const lightFinish = clamp(tone)
          const darkFinish = 1 - lightFinish
          nav.style.setProperty('--cursor-light-finish', `${lightFinish}`)
          nav.style.setProperty('--cursor-dark-finish', `${darkFinish}`)
          cursorToneTargetRef.current?.style.setProperty('--cursor-light-finish', `${lightFinish}`)
          cursorToneTargetRef.current?.style.setProperty('--cursor-dark-finish', `${darkFinish}`)
        }
      const delta = normalized - previousProgress.current
      if (Math.abs(delta) > 0.0004) directionRef.current = delta > 0 ? 1 : -1
      previousProgress.current = normalized

      const revealed = normalized > 0.035
      const subdued = directionRef.current > 0 && revealed && !focusedRef.current
      nav.dataset.revealed = revealed ? 'true' : 'false'
      nav.style.pointerEvents = revealed ? 'auto' : 'none'
      nav.style.opacity = revealed ? '1' : '0'
      nav.style.transform = revealed
        ? `translate3d(-50%, ${subdued ? -10 : 0}px, 0)`
        : 'translate3d(-50%, -18px, 0)'
      nav.style.filter = revealed ? 'blur(0)' : 'blur(7px)'

      const surface = mixRgb(darkSurface, lightSurface, tone)
      const ink = mixRgb(darkInk, lightInk, tone)
      const border = mixRgb(darkBorder, lightBorder, tone)
      nav.style.setProperty('--nav-surface', `rgba(${surface}, 0.78)`)
      nav.style.setProperty('--nav-ink', `rgb(${ink})`)
      nav.style.setProperty('--nav-border', `rgba(${border}, ${tone > 0.5 ? 0.2 : 0.24})`)
      if (showCv) {
        // Keep the pill's surface inverting continuously with the established
        // nav tone. Hold the ink to a high-contrast endpoint and switch near
        // the midpoint, rather than blending foreground and background together.
        const cvSurface = mixRgb([255, 255, 255], [8, 12, 19], tone)
        const cvInk = tone > 0.56 ? '255, 255, 255' : '12, 20, 32'
        nav.style.setProperty('--cv-surface', `rgb(${cvSurface})`)
        nav.style.setProperty('--cv-ink', `rgb(${cvInk})`)
      }
      nav.style.setProperty('--nav-progress', `${normalized}`)
      nav.style.setProperty('--nav-sheen', `${(normalized * 1.8) % 1}`)
      nav.dataset.theme = tone > 0.52 ? 'light' : 'dark'

      Object.entries(linkRefs.current).forEach(([section, link]) => {
        if (!link) return
        const active = section === activeSection
        link.dataset.active = active ? 'true' : 'false'
        link.setAttribute('aria-current', active ? 'page' : 'false')
      })
    }

    controlRef.current ??= {}
    controlRef.current.setProgress = setProgress
    setProgress()

    const onPointerEnter = () => setFocusState(true)
    const onPointerLeave = () => setFocusState(false)
    const onFocusIn = () => setFocusState(true)
    const onFocusOut = event => {
      if (!nav.contains(event.relatedTarget)) setFocusState(false)
    }
    nav.addEventListener('pointerenter', onPointerEnter)
    nav.addEventListener('pointerleave', onPointerLeave)
    nav.addEventListener('focusin', onFocusIn)
    nav.addEventListener('focusout', onFocusOut)

    return () => {
      nav.removeEventListener('pointerenter', onPointerEnter)
      nav.removeEventListener('pointerleave', onPointerLeave)
      nav.removeEventListener('focusin', onFocusIn)
      nav.removeEventListener('focusout', onFocusOut)
      if (controlRef.current) delete controlRef.current.setProgress
    }
  }, [controlRef, showCv, cursorToneTargetRef])

  const navigate = (event, section) => {
    event.preventDefault()
    controlRef.current?.navigate?.(section)
  }

  return (
    <nav ref={navRef} className={`${styles.nav} ${showCv ? styles.hasCv : ''}`} data-cinematic-nav aria-label="Primary navigation">
      <a className={styles.brand} href="/" onClick={event => navigate(event, 'home')} aria-label="Suhail Kataria">SUHAIL<span aria-hidden="true">.</span></a>
      <span className={styles.track} aria-hidden="true"><span className={styles.progress} /></span>
      <div className={styles.links}>
        {[
          ['work', 'WORK'],
          ['about', 'ABOUT'],
          ['journey', 'JOURNEY'],
          ['beyond', 'BEYOND'],
          ['contact', 'CONTACT ↗'],
        ].map(([section, label]) => (
          <a
            key={section}
            ref={element => { linkRefs.current[section] = element }}
            className={styles.link}
            href={`#${section}`}
            onClick={event => navigate(event, section)}
          >
            {label}
          </a>
        ))}
        {showCv && (
          <a
            className={styles.cvButton}
            href="/Suhail_Kataria_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View résumé (opens in a new tab)"
          >
            <span>CV</span><Download className={styles.cvArrow} aria-hidden="true" focusable="false" />
          </a>
        )}
      </div>
    </nav>
  )
}
