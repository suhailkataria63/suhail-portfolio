import { useEffect, useRef } from 'react'
import styles from './JourneyScene.module.css'

const milestones = [
  { year: '2021', category: 'EDUCATION', title: 'WHERE IT BEGAN', qualification: 'Matriculation (10th Standard)', institution: 'Jawahar Navodaya Vidyalaya · CBSE', period: '', description: 'Completed secondary education and established a foundation in mathematics, science, and computer fundamentals.' },
  { year: '2023', category: 'TRAINING', title: 'FIRST STEPS INTO DEVELOPMENT', qualification: 'Python Trainee', institution: 'O7 Services, Jalandhar', period: 'July 2023 – August 2023', description: 'Practiced Python programming, data handling, logic building, and practical project workflows.' },
  { year: '2024', category: 'EDUCATION', title: 'BUILDING THE FOUNDATION', qualification: 'Completed Diploma in Computer Science & Engineering', institution: 'Mehr Chand Polytechnic College, Jalandhar', period: '2021–2024', additional: 'Started B.Tech in Artificial Intelligence & Data Science · Chandigarh Group of Colleges, Landran (2024–2027)', description: 'Strengthened software development fundamentals and transitioned toward AI and data science.' },
  { year: '2025', category: 'TRAINING', title: 'EXPLORING DATA SCIENCE', qualification: 'Data Science Trainee', institution: 'ThinkNEXT Technologies Pvt. Ltd.', period: 'June 2025 – July 2025', description: 'Worked on data analysis, preprocessing, regression models, and model evaluation.' },
  { year: '2026', category: 'INTERNSHIP', title: 'TURNING DATA INTO DECISIONS', qualification: 'Artificial Intelligence Intern', institution: 'Unified Mentor Pvt. Ltd.', period: 'February 2026 – May 2026', description: 'Built AI/ML projects using real-world datasets, including restaurant growth prediction, demand forecasting, and business dashboards.' },
  { year: '2027', category: 'EDUCATION', title: 'THE NEXT CHAPTER', qualification: 'B.Tech in Artificial Intelligence & Data Science', institution: 'Chandigarh Group of Colleges, Landran · IKGPTU', period: '2024–2027 · Expected completion', description: 'Expected completion of undergraduate studies in AI and Data Science.', upcoming: true },
]

const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)

export default function JourneyScene({ controlRef, firstMilestoneEntranceSpan = 0.14, exitEndProgress = 1 }) {
  const sceneRef = useRef(null)
  const headingRef = useRef(null)
  const timelineRef = useRef(null)
  const progressRef = useRef(null)
  const markerRefs = useRef([])
  const detailRefs = useRef([])
  const yearRefs = useRef([])
  const activeLabelRef = useRef(null)

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      getStageInfo: () => milestones,
      setNavigate: navigate => { controlRef.current.navigate = navigate },
      navigate: () => {},
      setProgress: (value, choreography) => {
        const progress = clamp(value)
        const entrance = ease(clamp(progress / 0.18))
        const headingSettle = ease(clamp((progress - 0.12) / 0.22))
        const timelineReveal = clamp((progress - 0.24) / 0.16)
        const milestonesProgress = clamp(choreography?.milestones ?? (progress - 0.36) / 0.52)
        const firstMilestoneEntrance = ease(clamp(choreography?.firstMilestone ?? (progress - 0.36) / firstMilestoneEntranceSpan))
        const milestonesVisible = milestonesProgress > 0 || Boolean(choreography && firstMilestoneEntrance > 0)
        // Keep the final 2027 milestone settled and readable before the
        // handoff begins; the master timeline starts Scene 03 at 98%.
        const exit = ease(clamp((progress - 0.97) / (exitEndProgress - 0.97)))
        if (sceneRef.current) {
          sceneRef.current.style.opacity = progress > 0 ? `${1 - exit}` : '0'
          sceneRef.current.style.setProperty('--journey-exit', `${exit}`)
        }
        if (headingRef.current) {
          headingRef.current.style.opacity = `${entrance * (1 - exit)}`
          headingRef.current.style.transform = `translate3d(0, ${((1 - entrance) * 60) - headingSettle * 3}%, 0) scale(${1 - headingSettle * 0.52})`
        }
        if (timelineRef.current) timelineRef.current.style.opacity = `${timelineReveal * (1 - exit)}`
        if (progressRef.current) progressRef.current.style.width = `${milestonesProgress * 100}%`
        const position = milestonesProgress * (milestones.length - 1)
        const segmentIndex = Math.min(milestones.length - 2, Math.floor(position))
        const segmentProgress = position - segmentIndex
        const transitionStart = segmentIndex === milestones.length - 2 ? 0.35 : 0.72
        const transition = milestonesProgress >= 1 ? 1 : clamp((segmentProgress - transitionStart) / (1 - transitionStart))
        const activeIndex = transition > 0.5 ? segmentIndex + 1 : segmentIndex
        markerRefs.current.forEach((marker, index) => {
          if (!marker) return
          const active = index === activeIndex && milestonesVisible
          marker.classList.toggle(styles.active, active)
          marker.classList.toggle(styles.upcoming, milestones[index].upcoming)
          marker.setAttribute('aria-current', active ? 'step' : 'false')
          const proximity = (milestonesVisible ? clamp(1 - Math.abs(position - index) / 0.72) : 0)
            * (index === 0 ? firstMilestoneEntrance : 1)
          marker.style.backgroundColor = `rgba(83, 100, 126, ${proximity})`
          marker.style.borderColor = proximity > 0.5 ? '#53647e' : '#aeb9c8'
          marker.style.color = proximity > 0.5 ? '#fff' : '#7d8796'
          marker.style.transform = `scale(${1 + proximity * 0.14})`
        })
        detailRefs.current.forEach((detail, index) => {
          if (!detail) return
          let opacity = 0
          let offset = 18
          if (milestonesVisible && index === segmentIndex) {
            opacity = 1 - transition
            offset = -30 * transition
          } else if (milestonesVisible && index === segmentIndex + 1 && segmentIndex < milestones.length - 1) {
            opacity = transition
            offset = 30 * (1 - transition)
          } else if (milestonesProgress >= 1 && index === milestones.length - 1) {
            opacity = 1
            offset = 0
          }
          if (index === 0) opacity *= firstMilestoneEntrance
          const active = index === activeIndex && opacity > 0.5
          detail.style.opacity = `${opacity}`
          detail.style.transform = `translate3d(0, ${offset}px, 0)`
          detail.style.pointerEvents = active ? 'auto' : 'none'
          detail.setAttribute('aria-hidden', String(!active))
          detail.querySelectorAll('[data-detail-part]').forEach((part, partIndex) => {
            const partOpacity = opacity > 0 ? Math.max(0, Math.min(1, opacity * 1.25 - partIndex * 0.1)) : 0
            part.style.opacity = `${partOpacity}`
            part.style.transform = `translate3d(0, ${(1 - partOpacity) * 18}px, 0)`
          })
        })
        yearRefs.current.forEach((year, index) => {
          if (!year) return
          let opacity = 0
          let offset = 44
          if (milestonesVisible && index === segmentIndex) {
            opacity = 1 - transition
            offset = -44 * transition
          } else if (milestonesVisible && index === segmentIndex + 1 && segmentIndex < milestones.length - 1) {
            opacity = transition
            offset = 44 * (1 - transition)
          } else if (milestonesProgress >= 1 && index === milestones.length - 1) {
            opacity = 1
            offset = 0
          }
          if (index === 0) opacity *= firstMilestoneEntrance
          year.style.opacity = `${opacity}`
          year.style.transform = `translate3d(0, ${offset}px, 0)`
        })
        const selected = milestones[activeIndex]
        if (activeLabelRef.current) activeLabelRef.current.textContent = milestonesVisible ? `${selected.category} / ${selected.title}` : ''
      },
    }
    controlRef.current.setProgress(0)
    return () => { controlRef.current = null }
  }, [controlRef, firstMilestoneEntranceSpan, exitEndProgress])

  return (
    <section ref={sceneRef} className={styles.scene} data-journey-scene aria-label="The Journey So Far">
      <div ref={headingRef} className={styles.headingWrap}>
        <span className={styles.eyebrow}>JOURNEY / TIMELINE</span>
        <h2>THE JOURNEY<br />SO FAR.</h2>
      </div>
      <div ref={timelineRef} className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <span ref={activeLabelRef}>2021</span>
          <span>THEN / NOW / NEXT.</span>
        </div>
        <div className={styles.track}>
          <div ref={progressRef} className={styles.progress} />
          {milestones.map((milestone, index) => (
            <button
              key={milestone.year}
              ref={element => { markerRefs.current[index] = element }}
              className={`${styles.marker} ${milestone.upcoming ? styles.upcoming : ''}`}
              type="button"
              aria-label={`Go to ${milestone.year}: ${milestone.title}`}
              onClick={() => controlRef.current?.navigate?.(index / (milestones.length - 1))}
            >
              <span>{milestone.year}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.details}>
        <div className={styles.year} aria-live="polite">
          {milestones.map((milestone, index) => (
            <span key={milestone.year} ref={element => { yearRefs.current[index] = element }}>{milestone.year}</span>
          ))}
        </div>
        <div className={styles.detailColumn}>
          {milestones.map((milestone, index) => (
            <article key={milestone.year} ref={element => { detailRefs.current[index] = element }} className={styles.detail} aria-hidden="true">
              <span data-detail-part className={styles.eyebrow}>{milestone.category}{milestone.upcoming ? ' / UPCOMING' : ''}</span>
              <h3 data-detail-part>{milestone.title}</h3>
              <strong data-detail-part>{milestone.qualification}</strong>
              <span data-detail-part className={styles.meta}>{milestone.institution}</span>
              {milestone.period && <span data-detail-part className={styles.meta}>{milestone.period}</span>}
              {milestone.additional && <span data-detail-part className={styles.additional}>{milestone.additional}</span>}
              <p data-detail-part>{milestone.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
