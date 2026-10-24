import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import styles from './AboutIntro.module.css'

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const ABOUT_HANDOFF_END = 1.16
const ABOUT_CONTENT_REVEAL_START = 0.55
const Highlighter = lazy(() => import('../experiments/reactBits/Highlighter').then(module => ({ default: module.Highlighter })))

export default function AboutIntro({ controlRef, highlighterExperiment = null }) {
  const transitionMode = 'fade'
  const veilRef = useRef(null)
  const contentRef = useRef(null)
  const lineRefs = useRef([])
  const subtitleRef = useRef(null)
  const previousSubtitleActiveRef = useRef(false)
  const [localHighlighterShown, setLocalHighlighterShown] = useState(false)
  const [localHighlighterReplayKey, setLocalHighlighterReplayKey] = useState(0)
  const highlighterExperimentRef = useRef(highlighterExperiment)
  highlighterExperimentRef.current = highlighterExperiment

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const rawProgress = Math.max(0, value)
        const progress = clamp(rawProgress)
        const exit = clamp((rawProgress - 1) / 0.16)
        const transitionProgress = clamp(progress / ABOUT_CONTENT_REVEAL_START)
        const contentReveal = clamp((progress - ABOUT_CONTENT_REVEAL_START) / 0.25)
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
          line.style.opacity = `${reveal}`
          line.style.transform = `translate3d(0, ${(1 - reveal) * 110 - exit * 55}%, 0)`
        })
        const subtitleReveal = clamp((contentReveal - 0.2) / 0.8)
        const subtitleVisibility = subtitleReveal * (1 - exit)
        const subtitleActive = subtitleVisibility > 0
        if (subtitleActive !== previousSubtitleActiveRef.current) {
          const experiment = highlighterExperimentRef.current
          if (subtitleActive) {
            if (experiment?.onSubtextEnter) experiment.onSubtextEnter()
            else if (experiment) {
              setLocalHighlighterShown(true)
              setLocalHighlighterReplayKey(current => current + 1)
            }
          } else {
            if (experiment?.onSubtextExit) experiment.onSubtextExit()
            else if (experiment) setLocalHighlighterShown(false)
          }
        }
        previousSubtitleActiveRef.current = subtitleActive
        if (subtitleRef.current) {
          subtitleRef.current.style.opacity = `${subtitleVisibility}`
          subtitleRef.current.style.transform = `translate3d(0, ${(1 - contentReveal) * 18 - exit * 18}px, 0)`
        }
        if (contentRef.current) {
          const handoffComplete = rawProgress >= ABOUT_HANDOFF_END
          contentRef.current.style.visibility = handoffComplete ? 'hidden' : 'visible'
          contentRef.current.style.opacity = `${contentReveal * (1 - exit)}`
          contentRef.current.style.transform = handoffComplete
            ? 'translate3d(0, 0, 0)'
            : `translate3d(0, ${-exit * 10}vh, 0)`
        }
      },
    }
    controlRef.current.setProgress(0)
    return () => {
      controlRef.current = null
    }
  }, [controlRef, transitionMode])

  return (
    <>
      <div ref={veilRef} className={styles.veil} data-about-veil aria-hidden="true" />
      <section ref={contentRef} className={styles.content} data-about-content aria-labelledby="about-intro-title">
        <span className={styles.eyebrow}>ABOUT / INTRODUCTION</span>
        <h2 id="about-intro-title" className={styles.title}>
          <span className={styles.mask}><span ref={element => { lineRefs.current[0] = element }}>THE PERSON</span></span>
          <span className={styles.mask}><span ref={element => { lineRefs.current[1] = element }}>BEHIND IT.</span></span>
        </h2>
        <p ref={subtitleRef}>
          There&apos;s{' '}
          {highlighterExperiment ? (
              <Suspense fallback={highlighterExperiment.settings.text}>
              <Highlighter
                action={highlighterExperiment.settings.action}
                color={highlighterExperiment.settings.color}
                strokeWidth={highlighterExperiment.settings.strokeWidth}
                animationDuration={highlighterExperiment.settings.animationDuration}
                iterations={highlighterExperiment.settings.iterations}
                padding={highlighterExperiment.settings.padding}
                multiline={highlighterExperiment.settings.multiline}
                show={highlighterExperiment.shown ?? localHighlighterShown}
                replayKey={highlighterExperiment.replayKey ?? localHighlighterReplayKey}
              >
                {highlighterExperiment.settings.text}
              </Highlighter>
            </Suspense>
          ) : 'more to the story'}{' '}
          than what I build.
        </p>
      </section>
    </>
  )
}
