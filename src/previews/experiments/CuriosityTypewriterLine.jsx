import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import styles from './CuriosityTypewriterLine.module.css'

// Faithful type / hold / delete adaptation of Fancy Components Typewriter:
// https://www.fancycomponents.dev/docs/components/text/typewriter
// Scene exit cancels the timer synchronously; each scene entry starts a fresh
// sequence. Hover pauses retain their delay, independently of scene resets.
function useTypewriter(words, settings, activity, lifecycleRef, paused, reducedMotion, replayKey) {
  const [frame, setFrame] = useState({ word: 0, count: 0, phase: 'typing' })
  const remainingRef = useRef(null)
  const timerRef = useRef(null)
  const generationRef = useRef(0)
  const running = activity.active && !reducedMotion && !paused

  useLayoutEffect(() => {
    const invalidate = () => {
      generationRef.current += 1
      window.clearTimeout(timerRef.current)
      timerRef.current = null
      remainingRef.current = null
    }
    const lifecycle = lifecycleRef.current
    lifecycle.listeners.add(invalidate)
    return () => {
      lifecycle.listeners.delete(invalidate)
      invalidate()
    }
  }, [lifecycleRef])

  useLayoutEffect(() => {
    generationRef.current += 1
    window.clearTimeout(timerRef.current)
    timerRef.current = null
    remainingRef.current = null
    setFrame(current => current.word === 0 && current.count === 0 && current.phase === 'typing'
      ? current : { word: 0, count: 0, phase: 'typing' })
  }, [activity.active, activity.entry, reducedMotion, replayKey])

  const wordIndex = Math.min(frame.word, words.length - 1)
  const word = words[wordIndex]
  const glyphs = useMemo(() => Array.from(word), [word])
  useEffect(() => {
    if (!running || (frame.phase === 'done' && !settings.loop)) return undefined
    const hold = word.toUpperCase() === 'CURIOUS.' ? settings.curiousWaitTime : settings.waitTime
    const delay = frame.phase === 'holding' || frame.phase === 'done' ? hold : frame.phase === 'deleting' ? settings.deleteSpeed : settings.speed
    const token = `${frame.word}:${frame.count}:${frame.phase}:${delay}:${replayKey}`
    const remaining = remainingRef.current?.token === token ? remainingRef.current.delay : delay
    const started = performance.now()
    const generation = generationRef.current
    let fired = false
    let cancelled = false
    const timeout = window.setTimeout(() => {
      const currentActivity = lifecycleRef.current.snapshot
      if (cancelled || generation !== generationRef.current || !currentActivity.active || currentActivity.entry !== activity.entry) return
      fired = true
      timerRef.current = null
      remainingRef.current = null
      setFrame(current => {
        if (cancelled || generation !== generationRef.current) return current
        if (current.phase === 'typing') {
          const count = Math.min(current.count + 1, glyphs.length)
          return { ...current, word: wordIndex, count, phase: count === glyphs.length ? 'holding' : 'typing' }
        }
        if (current.phase === 'holding' || current.phase === 'done') {
          return { ...current, word: wordIndex, phase: !settings.loop && wordIndex === words.length - 1 ? 'done' : 'deleting' }
        }
        const count = Math.max(0, current.count - 1)
        return count ? { ...current, word: wordIndex, count } : { word: (wordIndex + 1) % words.length, count: 0, phase: 'typing' }
      })
    }, remaining)
    timerRef.current = timeout
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      if (timerRef.current === timeout) timerRef.current = null
      if (!fired && generation === generationRef.current) remainingRef.current = { token, delay: Math.max(0, remaining - (performance.now() - started)) }
    }
  }, [running, activity.entry, frame, glyphs.length, wordIndex, word, words.length, settings.speed, settings.deleteSpeed, settings.waitTime, settings.curiousWaitTime, settings.loop, replayKey, lifecycleRef])
  return activity.active ? glyphs.slice(0, frame.count).join('') : ''
}

export default function CuriosityTypewriterLine({ settings, lifecycleRef, replayKey = 0 }) {
  const subscribe = useCallback(update => {
    const lifecycle = lifecycleRef.current
    lifecycle.listeners.add(update)
    return () => lifecycle.listeners.delete(update)
  }, [lifecycleRef])
  const getSnapshot = useCallback(() => lifecycleRef.current.snapshot, [lifecycleRef])
  const activity = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const active = activity.active
  const slotRef = useRef(null)
  const measureRefs = useRef([])
  const [fit, setFit] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const words = useMemo(() => settings.words.map(word => word.trim()).filter(Boolean), [settings.words])
  const safeWords = useMemo(() => words.length ? words : ['CURIOUS.'], [words])
  const running = active && !reducedMotion && !(settings.pauseOnHover && hovered)
  const text = useTypewriter(safeWords, settings, activity, lifecycleRef, settings.pauseOnHover && hovered, reducedMotion, replayKey)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => { setHovered(false) }, [active, activity.entry])

  useLayoutEffect(() => {
    if (reducedMotion || !slotRef.current) return undefined
    let alive = true
    const measure = () => {
      if (!alive || !slotRef.current) return
      const widest = Math.max(1, ...measureRefs.current.filter(Boolean).map(node => node.offsetWidth))
      const next = Math.min(1, slotRef.current.clientWidth / widest)
      setFit(current => Math.abs(current - next) < 0.001 ? current : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(slotRef.current)
    measureRefs.current.filter(Boolean).forEach(node => observer.observe(node))
    document.fonts?.ready.then(measure).catch(() => {})
    document.fonts?.addEventListener('loadingdone', measure)
    return () => {
      alive = false
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', measure)
    }
  }, [safeWords, reducedMotion])

  // Original line boxes remain the layout anchors. Only the painted text is
  // reduced; a single sequence-wide fit is independent of the typed characters.
  const visualScale = (settings.headlineScale ?? 1) * (reducedMotion ? 1 : fit)
  return (
    <span ref={slotRef} className={styles.slot} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} style={{ pointerEvents: active ? 'auto' : 'none' }}>
      <span className={styles.anchor} aria-hidden="true">CURIOUS.</span>
      <span className={styles.accessible}>CURIOUS.</span>
      <span className={styles.measurements} aria-hidden="true">
        {safeWords.map((word, index) => <span key={index} className={styles.measure} ref={node => { measureRefs.current[index] = node }}>{word}</span>)}
      </span>
      <span className={styles.visual} aria-hidden="true" style={{ fontSize: `${visualScale}em` }}>
        <span className={styles.typed}>{reducedMotion ? 'CURIOUS.' : text}{!reducedMotion && settings.cursorEnabled && <span className={`${styles.cursor} ${styles[settings.cursorStyle] ?? ''} ${settings.cursorBlink ? styles.blink : ''}`} style={{ color: settings.cursorColor, animationPlayState: running ? 'running' : 'paused' }} />}</span>
      </span>
    </span>
  )
}
