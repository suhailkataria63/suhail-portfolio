import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import CodeMetallicPaint from './CodeMetallicPaint'
import styles from './CodeMetallicWord.module.css'

export default function CodeMetallicWord({ mode, settings, gradient, active, onStatus, className = '' }) {
  const anchorRef = useRef(null)
  const baselineRef = useRef(null)
  const measurementKeyRef = useRef('')
  const [mask, setMask] = useState(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const statusRef = useRef(onStatus)
  statusRef.current = onStatus

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    let alive = true
    let frame = 0
    let generation = 0
    const measure = async () => {
      const currentGeneration = ++generation
      const anchor = anchorRef.current
      if (!anchor) return
      const computed = getComputedStyle(anchor)
      const font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
      try { await document.fonts?.load(font, 'CODE') } catch { /* Retain the native font fallback. */ }
      if (!alive || currentGeneration !== generation) return
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        statusRef.current?.('Canvas text measurement is unavailable; displaying native CODE.')
        return
      }
      if (!('letterSpacing' in ctx) && parseFloat(computed.letterSpacing)) {
        statusRef.current?.('Canvas letter spacing is unavailable in this browser; displaying native CODE.')
        return
      }
      ctx.font = font
      ctx.letterSpacing = computed.letterSpacing
      const rect = anchor.getBoundingClientRect()
      const baseline = baselineRef.current.getBoundingClientRect().top - rect.top
      const metrics = ctx.measureText('CODE')
      const aa = 1 / Math.max(1, window.devicePixelRatio || 1)
      const left = Math.min(0, -metrics.actualBoundingBoxLeft - aa)
      const top = Math.min(0, baseline - metrics.actualBoundingBoxAscent - aa)
      const right = Math.max(rect.width, metrics.actualBoundingBoxRight + aa)
      const bottom = Math.max(rect.height, baseline + metrics.actualBoundingBoxDescent + aa)
      const width = right - left
      const height = bottom - top
      const key = [font, computed.letterSpacing, ...[width, height, left, top, baseline].map(value => value.toFixed(2))].join('|')
      if (!rect.width || !rect.height || key === measurementKeyRef.current) return
      const ratio = 2
      canvas.width = Math.ceil(width * ratio)
      canvas.height = Math.ceil(height * ratio)
      ctx.scale(ratio, ratio)
      ctx.font = font
      ctx.letterSpacing = computed.letterSpacing
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('CODE', -left, baseline - top)
      measurementKeyRef.current = key
      setReady(false)
      setMask({ canvas, left, top, width: canvas.width / ratio, height: canvas.height / ratio })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(anchorRef.current)
    window.addEventListener('resize', schedule)
    document.fonts?.addEventListener('loadingdone', schedule)
    measure()
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      document.fonts?.removeEventListener('loadingdone', schedule)
    }
  }, [])

  const handleReady = useCallback(() => {
    setReady(true)
    setFailed(false)
    statusRef.current?.('')
  }, [])
  const handleError = useCallback(error => {
    setFailed(true)
    statusRef.current?.(`${error?.message || 'Metallic rendering unavailable'}. Displaying native CODE.`)
  }, [])

  return (
    <span className={`${styles.word} ${className}`} style={{ pointerEvents: active && !reducedMotion ? 'auto' : 'none' }}>
      <span ref={anchorRef} className={styles.anchor} style={{ visibility: ready && !failed ? 'hidden' : 'visible' }}>CODE<i ref={baselineRef} className={styles.baseline} /></span>
      {mask && <span className={styles.paint} aria-hidden="true" style={{ left: mask.left, top: mask.top, width: mask.width, height: mask.height, visibility: ready && !failed ? 'visible' : 'hidden' }}>
        <CodeMetallicPaint
          shapeSource={mask.canvas}
          {...settings}
          color={settings.color}
          hybrid={mode === 'hybrid'}
          gradient={gradient}
          intro={false}
          backgroundColor="transparent"
          active={active}
          paused={!active || reducedMotion}
          mouseTilt={reducedMotion ? 0 : settings.mouseTilt}
          onReady={handleReady}
          onError={handleError}
          dpr={1.5}
        />
      </span>}
    </span>
  )
}
