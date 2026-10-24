import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styles from './ToolkitRotatingHeading.module.css'
import { readableToolkitColor } from './toolkitRotatingSettings'

const RotatingText = lazy(() => import('./reactBits/components/typography/RotatingText/RotatingText'))
const TOOLS_ONLY = ['TOOLS']
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null
const characters = text => segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text)

export default function ToolkitRotatingHeading({ settings, active, replayKey = 0, onWordChange }) {
  const slotRef = useRef(null)
  const measureRefs = useRef([])
  const [index, setIndex] = useState(0)
  const [fit, setFit] = useState(1)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const rotating = settings.rotating
  const words = useMemo(() => {
    const list = rotating.words.map(word => word.trim()).filter(Boolean)
    return list.length ? list : ['TOOLS']
  }, [rotating.words])
  const displayedWord = rotating.enabled ? words[Math.min(index, words.length - 1)] : 'TOOLS'
  const measuredWords = useMemo(() => [...new Set([...words, 'TOOLS'])], [words])
  const foreground = rotating.highlight ? readableToolkitColor(rotating.highlightColor) : '#101722'

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // This index comes only from React Bits, including when words are edited or
  // reordered. No separate clock drives the constellation.
  useLayoutEffect(() => {
    onWordChange(displayedWord)
  }, [displayedWord, onWordChange])

  useLayoutEffect(() => {
    let alive = true
    const measure = () => {
      const slot = slotRef.current
      if (!alive || !slot) return
      const widest = Math.max(1, ...measureRefs.current.filter(Boolean).map(element => element.offsetWidth + 1))
      const next = Math.min(1, slot.clientWidth / widest)
      setFit(current => Math.abs(current - next) < 0.001 ? current : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(slotRef.current)
    measureRefs.current.filter(Boolean).forEach(element => observer.observe(element))
    document.fonts?.ready.then(measure).catch(() => {})
    document.fonts?.addEventListener('loadingdone', measure)
    return () => {
      alive = false
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', measure)
    }
  }, [measuredWords, rotating.splitBy])

  return (
    <>
      {settings.headline.map((line, lineIndex) => <span key={lineIndex} className={styles.fixedLine}>{line}</span>)}
      <span ref={slotRef} className={styles.slot}>
        <span className={styles.reserve} aria-hidden="true">
          {measuredWords.map((word, wordIndex) => <span key={wordIndex} ref={element => { measureRefs.current[wordIndex] = element }} className={styles.measure}>
            <span className={styles.measureContent}>{word.split(' ').map((part, partIndex, parts) => <span key={partIndex} className={styles.measureWord}>
              {(rotating.splitBy === 'characters' ? characters(part) : [part]).map((text, characterIndex) => <span key={characterIndex} className={styles.measureElement}>{text}</span>)}
              {partIndex < parts.length - 1 && <span className={styles.measureSpace}> </span>}
            </span>)}</span>
          </span>)}
        </span>
        <span className={styles.visual} style={{ transform: `scale(${fit})`, pointerEvents: active ? 'auto' : 'none' }}>
          <Suspense fallback={<span className={styles.staticWord} style={{ backgroundColor: rotating.highlight ? rotating.highlightColor : 'transparent', color: foreground }}>{displayedWord}</span>}>
            <RotatingText
              texts={rotating.enabled ? words : TOOLS_ONLY}
              effect={rotating.effect}
              direction={rotating.direction}
              highlight={rotating.highlight}
              highlightColor={rotating.highlightColor}
              foregroundColor={foreground}
              staggerFrom={rotating.staggerFrom}
              staggerDuration={rotating.staggerDuration}
              rotationInterval={rotating.rotationInterval}
              splitBy={rotating.splitBy}
              blur={rotating.blur}
              auto={active && rotating.enabled && rotating.auto && !reducedMotion}
              loop={rotating.loop}
              pauseOnHover={rotating.pauseOnHover}
              mainClassName={styles.rotator}
              replayKey={replayKey}
              onNext={setIndex}
              transition={reducedMotion || !rotating.enabled || !active ? { duration: 0 } : undefined}
            />
          </Suspense>
        </span>
      </span>
    </>
  )
}
