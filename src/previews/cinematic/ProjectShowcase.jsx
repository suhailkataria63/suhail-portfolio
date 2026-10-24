import { lazy, Suspense, useEffect, useRef } from 'react'
import { projects as portfolioProjects } from '@/data/portfolio'
import styles from './ProjectShowcase.module.css'
import ProjectHoverEffect from './ProjectHoverEffect'

const ProjectTiltCard = lazy(() => import('../experiments/ProjectTiltCard'))

const featuredProjects = [
  portfolioProjects.find(project => project.title.startsWith('Cynbit AI')),
  portfolioProjects.find(project => project.title.startsWith('InternAI')),
  portfolioProjects.find(project => project.title.startsWith('Hybrid Phishing Detection')),
].filter(Boolean)

const projectMedia = [
  '/projects/Project 1 - Cynbit AI.png',
  '/projects/Project 2 - InternAI.png',
  '/projects/Project 3 - Phishing.png',
]

const projectUrls = [
  'https://cynbit-ai.vercel.app/',
  'https://intern-ai-seven.vercel.app/',
  'https://phishing-detection-with-hybrid-ai-m.vercel.app/',
]

const INTRO_DURATION = 1
const PROJECT_DURATION = 1
const PROJECT_STEP = 0.82
const PROJECT_SEQUENCE_END = INTRO_DURATION + PROJECT_STEP * (featuredProjects.length - 1) + PROJECT_DURATION

const editorialHeadlines = [
  'From vision to intelligent solutions.',
  'Your career, reimagined.',
  'Intelligence against deception.',
]

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const mix = (from, to, amount) => from + (to - from) * amount
const smoothstep = value => value * value * (3 - 2 * value)

function ProjectMedia({ project, index, videoRef }) {
  if (project.video || project.videoUrl) {
    return (
      <video
        ref={videoRef}
        data-hover-image
        src={project.video || project.videoUrl}
        poster={projectMedia[index]}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        aria-label={`${project.title} project video preview`}
      />
    )
  }
  return <img data-hover-image src={projectMedia[index]} alt={`${project.title} project preview`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
}

function projectTransform(project, local) {
  // The project slot is centered in the viewport. Measuring the composed
  // article lets its first and last positions clear the viewport completely
  // at every viewport height instead of relying on a fixed vh guess.
  const compositionHeight = project.offsetHeight || window.innerHeight * 0.5
  const travel = (window.innerHeight + compositionHeight) / 2 + 24
  const heroStart = 0.32
  const heroEnd = 0.62
  if (local <= heroStart) return mix(travel, 0, local / heroStart)
  if (local <= heroEnd) return 0
  return mix(0, -travel, (local - heroEnd) / (1 - heroEnd))
}

export default function ProjectShowcase({ controlRef, tiltExperiment = null, tiltPreview = false, circularTextExperiment = null }) {
  const hoverMode = 'stable'
  const introRef = useRef(null)
  const introLineRefs = useRef([])
  const introSupportRef = useRef(null)
  const projectRefs = useRef([])
  const projectSlotRefs = useRef([])
  const screenshotEntranceRefs = useRef([])
  const depthFrameRefs = useRef([])
  const typographyEntranceRefs = useRef([])
  const imageRefs = useRef([])
  const mediaFrameRefs = useRef([])
  const labelRefs = useRef([])
  const headlineRefs = useRef([])
  const descriptionRefs = useRef([])
  const hoverControlRefs = useRef([])
  const tiltControlRefs = useRef([])
  const tiltExperimentRef = useRef(tiltExperiment)
  const videoRefs = useRef([])
  tiltExperimentRef.current = tiltExperiment

  useEffect(() => {
    const videos = videoRefs.current.filter(Boolean)
    if (!videos.length || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      })
    }, { threshold: 0.15 })
    videos.forEach(video => observer.observe(video))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      getStageInfo: () => ({ items: featuredProjects, intro: INTRO_DURATION, step: PROJECT_STEP, duration: PROJECT_DURATION }),
      setProgress: value => {
        const progress = Math.max(0, Math.min(PROJECT_SEQUENCE_END, value))
        if (tiltExperimentRef.current && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (introRef.current) introRef.current.style.opacity = '0'
          projectRefs.current.forEach((project, index) => {
            if (!project) return
            project.dataset.projectActive = 'true'
            project.inert = false
            project.style.zIndex = '1'
            project.style.opacity = '1'
            project.style.pointerEvents = 'auto'
            project.style.transform = 'none'
            projectSlotRefs.current[index]?.style.setProperty('--project-travel', '0px')
            screenshotEntranceRefs.current[index]?.style.setProperty('transform', 'none')
            typographyEntranceRefs.current[index]?.style.setProperty('transform', 'none')
            typographyEntranceRefs.current[index]?.style.setProperty('opacity', '1')
            depthFrameRefs.current[index]?.style.setProperty('transform', 'none')
            labelRefs.current[index]?.style.setProperty('opacity', '1')
            labelRefs.current[index]?.style.setProperty('transform', 'none')
            headlineRefs.current[index]?.style.setProperty('opacity', '1')
            headlineRefs.current[index]?.style.setProperty('transform', 'none')
            descriptionRefs.current[index]?.style.setProperty('opacity', '1')
            descriptionRefs.current[index]?.style.setProperty('transform', 'none')
            tiltControlRefs.current[index]?.setActive(true)
          })
          return
        }
        const introProgress = clamp(progress)
        const introExit = clamp((progress - 0.84) / 0.16)
        const selectedReveal = clamp((progress - 0.1) / 0.2)
        const workReveal = clamp((progress - 0.18) / 0.2)
        const supportReveal = clamp((progress - 0.3) / 0.16)
        const introReveals = [selectedReveal, workReveal]
        introLineRefs.current.forEach((line, index) => {
          if (!line) return
          const reveal = introReveals[index]
          line.style.opacity = `${reveal * (1 - introExit)}`
          line.style.transform = `translate3d(0, ${(1 - reveal) * 112 - introExit * 112}%, 0)`
          line.style.letterSpacing = `${mix(0.02, -0.075, reveal)}em`
        })
        if (introSupportRef.current) {
          introSupportRef.current.style.opacity = `${supportReveal * (1 - introExit)}`
          introSupportRef.current.style.transform = `translate3d(0, ${(1 - supportReveal) * 18 - introExit * 18}px, 0)`
        }
        if (introRef.current) {
          const introVisibility = clamp((introProgress - 0.12) / 0.08)
          introRef.current.style.opacity = progress < 1 ? `${introVisibility}` : '0'
        }

        projectRefs.current.forEach((project, index) => {
          if (!project) return
          const startsAt = INTRO_DURATION + index * PROJECT_STEP
          const local = clamp((progress - startsAt) / PROJECT_DURATION)
          // Project progress is the sole source of truth for interaction.
          // The intervals are intentionally exclusive at the end so only
          // one project can own the pointer at a boundary between scenes.
          const activeIndex = progress >= INTRO_DURATION && progress < PROJECT_SEQUENCE_END
            ? Math.min(featuredProjects.length - 1, Math.floor((progress - INTRO_DURATION) / PROJECT_STEP))
            : -1
          const active = index === activeIndex
          const visible = progress >= startsAt && progress <= startsAt + PROJECT_DURATION
          project.dataset.projectActive = active ? 'true' : 'false'
          project.style.zIndex = active ? '3' : visible ? '2' : '0'
          if (!visible) {
            project.style.opacity = '0'
            project.style.pointerEvents = 'none'
            project.style.setProperty('--watermark-y', '0px')
            projectSlotRefs.current[index]?.style.setProperty('--project-travel', '0px')
            screenshotEntranceRefs.current[index]?.style.setProperty('transform', 'translate3d(0, 0, 0)')
            typographyEntranceRefs.current[index]?.style.setProperty('transform', 'translate3d(0, 0, 0)')
            typographyEntranceRefs.current[index]?.style.setProperty('opacity', '0')
            depthFrameRefs.current[index]?.style.setProperty('transform', 'none')
            if (tiltExperimentRef.current) {
              project.inert = true
              tiltControlRefs.current[index]?.setActive(false)
            } else {
              hoverControlRefs.current[index]?.current?.setActive(false)
            }
            return
          }

          const y = projectTransform(project, local)
          projectSlotRefs.current[index]?.style.setProperty('--project-travel', `${y}px`)
          project.style.opacity = '1'
          // The slot is the sole owner of composition travel.
          project.style.transform = 'none'
          const entrance = smoothstep(clamp(local / 0.32))
          const hero = smoothstep(clamp((local - 0.22) / 0.4))
          const exit = smoothstep(clamp((local - 0.62) / 0.38))
          const textIn = smoothstep(clamp((local - 0.07) / 0.3))
          const screenshotX = index === 0 ? -10 : index === 1 ? 10 : 0
          const textX = index === 0 ? 8 : index === 1 ? -8 : 0
          const screenshotElement = screenshotEntranceRefs.current[index]
          const typographyElement = typographyEntranceRefs.current[index]
          if (screenshotElement) {
            screenshotElement.style.setProperty('--screenshot-in', `${entrance}`)
            screenshotElement.style.transform = `translate3d(${screenshotX * (1 - entrance)}vw, ${(18 * (1 - entrance)) - (4 * exit)}vh, 0)`
          }
          if (typographyElement) {
            typographyElement.style.transform = `translate3d(${textX * (1 - textIn)}vw, ${(16 * (1 - textIn)) - (3 * exit)}vh, 0) scale(${(1 - exit * 0.08).toFixed(4)})`
            typographyElement.style.opacity = `${textIn * (1 - exit * 0.35)}`
          }
          project.style.setProperty('--watermark-y', `${((local * 2) - 1) * 36}px`)
          // Keep only the project in its progress interval event-enabled.
          project.style.pointerEvents = active ? 'auto' : 'none'
          if (tiltExperimentRef.current) {
            project.inert = !active
            tiltControlRefs.current[index]?.setActive(active)
          }
          const labelReveal = clamp(local / 0.12)
          const headlineReveal = clamp((local - 0.035) / 0.165)
          const descriptionReveal = clamp((local - 0.09) / 0.15)
          const label = labelRefs.current[index]
          const headline = headlineRefs.current[index]
          const description = descriptionRefs.current[index]
          if (label) {
            label.style.opacity = `${labelReveal}`
            label.style.transform = `translate3d(0, ${(1 - labelReveal) * 14}px, 0)`
          }
          if (headline) {
            headline.style.opacity = `${headlineReveal}`
            headline.style.transform = `translate3d(0, ${(1 - headlineReveal) * 108}%, 0)`
          }
          if (description) {
            description.style.opacity = `${descriptionReveal}`
            description.style.transform = `translate3d(0, ${(1 - descriptionReveal) * 18}px, 0)`
          }

          const depthFrame = depthFrameRefs.current[index]
          const yawStart = index === 0 ? -22 : index === 1 ? 22 : 0
          const yawHero = index === 0 ? -3 : index === 1 ? 3 : 0
          const heroPitch = mix(14, 2, hero)
          const pitch = mix(heroPitch, -18, exit)
          const heroYaw = mix(yawStart, yawHero, hero)
          const exitYaw = index === 0 ? 14 : index === 1 ? -14 : 0
          const yaw = mix(heroYaw, exitYaw, exit)
          const heroDepth = mix(-220, 60, hero)
          const depth = mix(heroDepth, -350, exit)
          const heroScale = mix(0.76, 1, hero)
          const scale = mix(heroScale, 0.68, exit)
          if (depthFrame) {
            depthFrame.style.transform = `translateZ(${depth.toFixed(2)}px) rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${scale.toFixed(4)})`
            depthFrame.style.opacity = `${mix(0.08, 1, entrance) * (1 - exit * 0.2)}`
          }

          const image = imageRefs.current[index]
          if (!image) {
            if (!tiltExperimentRef.current) hoverControlRefs.current[index]?.current?.setActive(active)
            return
          }
          if (!tiltExperimentRef.current) hoverControlRefs.current[index]?.current?.setActive(active)
        })
      },
    }
    controlRef.current.setProgress(0)
    return () => {
      depthFrameRefs.current.forEach(frame => { if (frame) frame.style.transform = 'none' })
      controlRef.current = null
    }
  }, [controlRef])

  return (
    <section className={styles.showcase} data-project-showcase data-project-tilt-preview={tiltPreview ? 'true' : undefined} aria-label="Featured projects">
      <div ref={introRef} className={styles.intro}>
        <h2 className={styles.introTitle}>
          <span className={styles.introMask}><span ref={element => { introLineRefs.current[0] = element }}>SELECTED</span></span>
          <span className={styles.introMask}><span ref={element => { introLineRefs.current[1] = element }}>WORK.</span></span>
        </h2>
        <p ref={introSupportRef}>Ideas turned into experiences.</p>
      </div>

      <div className={styles.gallery}>
        {featuredProjects.map((project, index) => (
          <div ref={element => { projectSlotRefs.current[index] = element }} className={`${styles.projectSlot} ${styles[`slot${index}`]}`} key={project.title}>
            <article className={styles.project} data-watermark={`0${index + 1}`} ref={element => { projectRefs.current[index] = element }}>
              <div ref={element => { screenshotEntranceRefs.current[index] = element }} className={styles.screenshotEntrance}>
                <div className={styles.perspectiveScene}>
                  <div ref={element => { depthFrameRefs.current[index] = element }} className={styles.depthFrame}>
                    {tiltExperiment ? (
                      <div ref={element => { mediaFrameRefs.current[index] = element }} className={`${styles.mediaFrame} ${styles[`glow${index}`]}`}>
                        <Suspense fallback={<div className={styles.media}><ProjectMedia project={project} index={index} videoRef={element => { videoRefs.current[index] = element }} /></div>}>
                          <ProjectTiltCard
                            ref={element => { tiltControlRefs.current[index] = element }}
                            project={{ ...project, number: index + 1 }}
                            liveUrl={project.live}
                            media={(
                              <div className={styles.media}>
                                <ProjectMedia project={project} index={index} videoRef={element => { videoRefs.current[index] = element }} />
                                {!circularTextExperiment && <span className={styles.visitProject} aria-hidden="true"><span className={styles.visitArrow}>↗</span></span>}
                              </div>
                            )}
                            tilt={tiltExperiment}
                            circularText={circularTextExperiment}
                          />
                        </Suspense>
                      </div>
                    ) : (
                    <ProjectHoverEffect mode={hoverMode} filterId={`project-distortion-${index}`} href={projectUrls[index]} linkRef={element => { imageRefs.current[index] = element }} linkClassName={styles.projectMediaLink} controlRef={hoverControlRefs.current[index] ?? (hoverControlRefs.current[index] = { current: null })} ariaLabel={`View ${project.title} live project`}>
                      <div ref={element => { mediaFrameRefs.current[index] = element }} className={`${styles.mediaFrame} ${styles[`glow${index}`]}`}>
                    <div className={styles.media}>
                      <ProjectMedia project={project} index={index} videoRef={element => { videoRefs.current[index] = element }} />
                      <span className={styles.visitProject} aria-hidden="true">
                        <svg className={styles.visitOrbit} viewBox="0 0 100 100" focusable="false">
                          <defs>
                            <path id={`visit-path-${index}`} d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                          </defs>
                          <text><textPath href={`#visit-path-${index}`} startOffset="0%">VISIT SITE · VISIT SITE · </textPath></text>
                        </svg>
                        <span className={styles.visitArrow}>↗</span>
                      </span>
                    </div>
                      </div>
                    </ProjectHoverEffect>
                    )}
                  </div>
                </div>
              </div>

              <div ref={element => { typographyEntranceRefs.current[index] = element }} className={styles.typographyEntrance}>
                <div className={styles.projectCopy}>
                <span className={styles.projectLabel} ref={element => { labelRefs.current[index] = element }}>0{index + 1} / 03 — FEATURED PROJECTS</span>
                <span className={styles.projectName}>{project.title}</span>
                <div className={styles.headlineMask}>
                  <div className={styles.headlineTrack} ref={element => { headlineRefs.current[index] = element }}>
                    <h3>{editorialHeadlines[index]}</h3>
                  </div>
                </div>
                <p ref={element => { descriptionRefs.current[index] = element }}>{project.description}</p>
                <span className={styles.projectType}>{project.type}</span>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  )
}
