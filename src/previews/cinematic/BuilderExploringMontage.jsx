import { useEffect, useId, useRef } from 'react'
import styles from './BuilderExploringMontage.module.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Preview-only Builder word fill. The SVG glyph clip is defined once and
 * applied once to the shared media viewport; individual video layers never
 * receive their own glyph clip.
 */
export default function BuilderExploringMontage({
  sources = [],
  width,
  height,
  baseline,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  clipDuration = 3,
  crossfadeDuration = 0.5,
  playing = true,
  paused = false,
  fillScale = 1.25,
  brightness = 1,
  saturation = 0.85,
}) {
  const clipId = `builder-exploring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const videosRef = useRef([])
  const frameRef = useRef(0)
  const clockRef = useRef(0)
  const lastFrameRef = useRef(0)
  const activePairRef = useRef('')

  const safeWidth = Math.max(1, Number(width) || 1)
  const safeHeight = Math.max(1, Number(height) || 1)
  const mediaSources = sources.filter(Boolean).slice(0, 4)
  const clipSeconds = Math.max(0.2, Number(clipDuration) || 3)
  const fadeSeconds = clamp(Number(crossfadeDuration) || 0, 0, clipSeconds / 2)
  const scale = Math.max(1, Number(fillScale) || 1)
  const mediaStyle = {
    width: `${scale * 100}%`,
    height: `${scale * 100}%`,
    left: `${(1 - scale) * 50}%`,
    top: `${(1 - scale) * 50}%`,
    filter: `brightness(${Number(brightness) || 1}) saturate(${Number(saturation) || 1})`,
  }

  useEffect(() => {
    const videos = videosRef.current.slice(0, mediaSources.length)
    if (!videos.length) return undefined

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    let alive = true

    const stop = () => {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
      lastFrameRef.current = 0
      videos.forEach(video => video?.pause())
      activePairRef.current = ''
    }

    const render = now => {
      frameRef.current = 0
      if (!alive || paused || !playing || reducedMotion) return

      const dt = lastFrameRef.current ? Math.min(0.05, (now - lastFrameRef.current) / 1000) : 0
      lastFrameRef.current = now
      const count = videos.length
      const cycle = clipSeconds * count
      const beforePosition = clockRef.current % cycle
      const beforeIndex = Math.floor(beforePosition / clipSeconds) % count
      const beforeWithin = beforePosition % clipSeconds
      const beforeNext = (beforeIndex + 1) % count
      const waitingForNextFrame = fadeSeconds > 0
        && beforeWithin >= clipSeconds - fadeSeconds
        && (videos[beforeNext]?.readyState ?? 0) < 2

      if ((videos[beforeIndex]?.readyState ?? 0) >= 2 && !waitingForNextFrame) {
        clockRef.current += dt
      }

      const position = clockRef.current % cycle
      const index = Math.floor(position / clipSeconds) % count
      const within = position % clipSeconds
      const next = (index + 1) % count
      const crossing = fadeSeconds > 0
        && within >= clipSeconds - fadeSeconds
        && (videos[next]?.readyState ?? 0) >= 2
      const pair = crossing ? `${index}:${next}` : `${index}`

      if (pair !== activePairRef.current) {
        videos.forEach((video, videoIndex) => {
          if (!video) return
          if (videoIndex === index || (crossing && videoIndex === next)) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
        activePairRef.current = pair
      }

      videos.forEach((video, videoIndex) => {
        if (!video) return
        let opacity = 0
        if (videoIndex === index) {
          opacity = crossing ? 1 - (within - (clipSeconds - fadeSeconds)) / fadeSeconds : 1
        } else if (crossing && videoIndex === next) {
          opacity = (within - (clipSeconds - fadeSeconds)) / fadeSeconds
        }
        video.style.opacity = String(clamp(opacity, 0, 1))
      })

      frameRef.current = requestAnimationFrame(render)
    }

    if (paused || !playing || reducedMotion) {
      stop()
      const first = videos[0]
      if (first && reducedMotion) {
        first.style.opacity = '1'
        videos.slice(1).forEach(video => { if (video) video.style.opacity = '0' })
        first.pause()
        if (first.readyState >= 2 && first.currentTime === 0) {
          try { first.currentTime = 0.05 } catch { /* Keep the browser-selected poster. */ }
        }
      }
      return () => { alive = false; stop() }
    }

    frameRef.current = requestAnimationFrame(render)
    return () => {
      alive = false
      stop()
    }
  }, [mediaSources.join('\n'), clipSeconds, fadeSeconds, paused, playing])

  if (!mediaSources.length) return null

  return (
    <svg
      className={styles.svg}
      width={safeWidth}
      height={safeHeight}
      viewBox={`0 0 ${safeWidth} ${safeHeight}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <text
            x="0"
            y={Number(baseline) || safeHeight * 0.75}
            fontFamily={fontFamily || 'inherit'}
            fontSize={Number(fontSize) || safeHeight}
            fontWeight={fontWeight || 800}
            letterSpacing={`${Number(letterSpacing) || 0}px`}
            fill="white"
            stroke="none"
            xmlSpace="preserve"
          >
            EXPLORING
          </text>
        </clipPath>
      </defs>
      <foreignObject x="0" y="0" width={safeWidth} height={safeHeight} clipPath={`url(#${clipId})`}>
        <div className={styles.mediaRegion} xmlns="http://www.w3.org/1999/xhtml">
          {mediaSources.map((source, index) => (
            <video
              key={`${index}:${source}`}
              ref={element => { videosRef.current[index] = element }}
              className={styles.video}
              src={source}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              style={{ ...mediaStyle, opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>
      </foreignObject>
    </svg>
  )
}
