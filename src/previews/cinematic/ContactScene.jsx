import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './ContactScene.module.css'
import { rigidStandUp, waveStandUp } from './ContactHeadlinePresets'
import MetallicPaint from '../experiments/reactBits/components/visual/ContactMetallicPaint/MetallicPaint'

const headlineLines = ['HAVE', 'SOMETHING', 'IN MIND?']

const contactLinks = {
  email: 'mailto:suhail.kataria63@gmail.com',
  linkedin: 'https://linkedin.com/in/suhail-kataria63',
  github: 'https://github.com/suhailkataria63',
}

const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)

export default function ContactScene({ controlRef, metallicTextExperiment = null }) {
  const sceneRef = useRef(null)
  const marqueeRef = useRef(null)
  const layoutRef = useRef(null)
  const headlinePerspectiveRef = useRef(null)
  const headlineHeadingRef = useRef(null)
  const headlineLineRefs = useRef([])
  const headlineCharRefs = useRef([])
  const metallicLayerRef = useRef(null)
  const metallicControlRef = useRef(null)
  const metallicReadyRef = useRef(false)
  const metallicFailedRef = useRef(false)
  const metallicExperimentRef = useRef(metallicTextExperiment)
  const progressRef = useRef(0)
  const revealRef = useRef(0)
  const applyMetallicRef = useRef(null)
  const bodyRef = useRef(null)
  const linksRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(() => Boolean(metallicTextExperiment) && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  metallicExperimentRef.current = metallicTextExperiment
  const reducedMotionRef = useRef(reducedMotion)
  reducedMotionRef.current = reducedMotion

  useEffect(() => {
    if (!metallicExperimentRef.current) return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const applyMetallicPresentation = () => applyMetallicRef.current?.()

  const handleMetallicReady = () => {
    metallicReadyRef.current = true
    metallicFailedRef.current = false
    applyMetallicPresentation()
  }

  const handleMetallicError = error => {
    metallicReadyRef.current = false
    metallicFailedRef.current = true
    applyMetallicPresentation()
    metallicExperimentRef.current?.onStatus?.(`Metallic Paint unavailable; using the original heading. ${error?.message || ''}`.trim())
  }

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
    const applyMetallic = () => {
      const experiment = metallicExperimentRef.current
      if (!experiment) return
      const metallicMode = Boolean(experiment && experiment.variant !== 'original')
      const visible = metallicMode && progressRef.current > 0.86 && metallicReadyRef.current && !metallicFailedRef.current
      headlineCharRefs.current.forEach(line => line?.forEach(character => {
        if (character) character.style.color = visible ? 'transparent' : ''
      }))
      if (metallicLayerRef.current) {
        metallicLayerRef.current.style.opacity = visible ? '1' : '0'
        metallicLayerRef.current.style.visibility = visible ? 'visible' : 'hidden'
        metallicLayerRef.current.style.pointerEvents = visible && !reducedMotionRef.current ? 'auto' : 'none'
      }
      metallicControlRef.current?.setActive(visible)
      metallicControlRef.current?.setPaused(!visible || reducedMotionRef.current)
      const intro = experiment?.settings?.intro !== false
      metallicControlRef.current?.setReveal(intro && !reducedMotionRef.current ? revealRef.current : 1)
    }
    applyMetallicRef.current = applyMetallic
    controlRef.current = {
      setProgress: value => {
        const progress = clamp(value)
        progressRef.current = progress
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
          const width = marqueeRef.current.getBoundingClientRect().width || window.innerWidth
          const x = window.innerWidth + width - marqueeProgress * (window.innerWidth + width * 2)
          marqueeRef.current.style.opacity = `${marqueeIn * (1 - marqueeOut)}`
          marqueeRef.current.style.transform = `translate3d(${x}px, -50%, 0)`
        }
        if (layoutRef.current) {
          layoutRef.current.style.opacity = `${layoutIn}`
          layoutRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 34}px, 0)`
        }
        if (headlinePerspectiveRef.current) headlinePerspectiveRef.current.style.opacity = '1'
        let revealTotal = 0
        let revealCount = 0
        headlineLineRefs.current.forEach((line, index) => {
          if (!line) return
          const rigid = rigidStandUp(progress, index)
          line.style.opacity = `${rigid.opacity}`
          line.style.transform = 'none'
          const characters = headlineCharRefs.current[index] || []
          characters.forEach((character, characterIndex) => {
            if (!character) return
            const wave = waveStandUp(progress, index, characterIndex, characters.length)
            character.style.opacity = `${wave.opacity}`
            character.style.transform = wave.transform
            revealTotal += wave.opacity
            revealCount += 1
          })
        })
        revealRef.current = revealCount ? revealTotal / revealCount : 1
        if (bodyRef.current) bodyRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 18}px, 0)`
        if (linksRef.current) linksRef.current.style.transform = `translate3d(0, ${(1 - layoutIn) * 14}px, 0)`
        applyMetallic()
      },
    }
    controlRef.current.setProgress(0)
    return () => {
      setInteractive(false)
      applyMetallicRef.current = null
      controlRef.current = null
    }
  }, [controlRef])

  useLayoutEffect(() => {
    applyMetallicRef.current?.()
  }, [metallicTextExperiment?.variant, metallicTextExperiment?.settings?.intro, reducedMotion])

  return (
    <section
      ref={sceneRef}
      className={styles.scene}
      data-contact-scene
      data-contact-metallic-enabled={metallicTextExperiment ? 'true' : undefined}
      aria-label="Contact"
    >
      <div ref={marqueeRef} className={styles.marquee} aria-hidden="true">MAKE IDEAS REAL.</div>
      <div ref={layoutRef} className={styles.layout}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>CONTACT / CONNECT</span>
          <div ref={headlinePerspectiveRef} className={styles.headlinePerspective}>
            <h2 ref={headlineHeadingRef} aria-label="HAVE SOMETHING IN MIND?">
              {headlineLines.map((lineText, lineIndex) => (
                <span
                  key={lineText}
                  ref={element => { headlineLineRefs.current[lineIndex] = element }}
                >
                  {Array.from(lineText).map((character, characterIndex) => (
                    <span
                      key={`${lineText}-${characterIndex}`}
                      ref={element => {
                        if (!headlineCharRefs.current[lineIndex]) headlineCharRefs.current[lineIndex] = []
                        headlineCharRefs.current[lineIndex][characterIndex] = element
                      }}
                      className={styles.headlineChar}
                      aria-hidden="true"
                    >
                      {character === ' ' ? '\u00a0' : character}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
            {metallicTextExperiment && (
              <div ref={metallicLayerRef} className={styles.metallicLayer} aria-hidden="true">
                <MetallicPaint
                  text={headlineLines.join('\n')}
                  fontFamily={'"Inter Variable", Arial, sans-serif'}
                  fontWeight={800}
                  lineHeight={0.84}
                  letterSpacing={-0.085}
                  color={metallicTextExperiment.settings.color}
                  density={metallicTextExperiment.settings.density}
                  softness={metallicTextExperiment.settings.softness}
                  dispersion={metallicTextExperiment.settings.dispersion}
                  distortion={metallicTextExperiment.settings.distortion}
                  edgeBend={metallicTextExperiment.settings.edgeBend}
                  angle={metallicTextExperiment.settings.angle}
                  scale={metallicTextExperiment.settings.scale}
                  speed={metallicTextExperiment.settings.speed}
                  rotation={metallicTextExperiment.settings.rotation}
                  mouseTilt={reducedMotion ? 0 : metallicTextExperiment.settings.mouseTilt}
                  backgroundColor="transparent"
                  intro={false}
                  active={false}
                  paused
                  controlRef={metallicControlRef}
                  layoutRef={headlineHeadingRef}
                  lineRefs={headlineLineRefs}
                  characterRefs={headlineCharRefs}
                  onReady={handleMetallicReady}
                  onError={handleMetallicError}
                  dpr={1.5}
                />
              </div>
            )}
          </div>
          <p ref={bodyRef}>Whether it&apos;s a project, an opportunity, or just an interesting idea, I&apos;d love to hear about it.</p>
          <nav ref={linksRef} className={styles.links} aria-label="Contact links">
            <a href={contactLinks.email} tabIndex={-1}>
              <span className={styles.linkIdentity}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <span>EMAIL</span>
              </span>
              <span className={styles.externalArrow} aria-hidden="true">↗</span>
            </a>
            <a href={contactLinks.linkedin} tabIndex={-1} target="_blank" rel="noopener noreferrer">
              <span className={styles.linkIdentity}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" /></svg>
                <span>LINKEDIN</span>
              </span>
              <span className={styles.externalArrow} aria-hidden="true">↗</span>
            </a>
            <a href={contactLinks.github} tabIndex={-1} target="_blank" rel="noopener noreferrer">
              <span className={styles.linkIdentity}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.3 9.4 7.88 10.93.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.68 5.4-5.24 5.69.41.35.78 1.04.78 2.1v3.12c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
                <span>GITHUB</span>
              </span>
              <span className={styles.externalArrow} aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </div>
    </section>
  )
}
