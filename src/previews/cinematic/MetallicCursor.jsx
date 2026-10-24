import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import styles from './MetallicCursor.module.css'

const silhouettePath = 'M.9 .9 23 17 14.15 18.15 17.3 25.9 13.65 27.4 10.5 19.65 4.55 25.35 .9 .9Z'

// Diagnostic only: construct a rectangular shaft from one axis and its normal.
// Preserve the original neck midpoint, perpendicular thickness, and bottom bound.
const correctedAxisGeometry = (() => {
  const angle = 59 * Math.PI / 180
  const axis = [Math.cos(angle), Math.sin(angle)]
  const normal = [axis[1], -axis[0]]
  const thickness = Math.abs(3.15 * 1.5 - 7.75 * -3.65) / Math.hypot(3.15, 7.75)
  const halfWidth = thickness / 2
  const midpoint = [12.325, 18.9]
  const leftRootY = midpoint[1] - normal[1] * halfWidth
  const length = (27.4 - leftRootY) / axis[1]
  const point = (along, across) => [
    midpoint[0] + axis[0] * length * along + normal[0] * across,
    midpoint[1] + axis[1] * length * along + normal[1] * across,
  ].join(' ')

  return {
    silhouette: `M.9 .9 23 17 ${point(0, halfWidth)} ${point(1, halfWidth)} ${point(1, -halfWidth)} ${point(0, -halfWidth)} 4.55 25.35 .9 .9Z`,
    // Keep the existing facet's approximate quarter-to-88% longitudinal extent.
    facet: `M${point(.25, -halfWidth)} ${point(.25, halfWidth)} ${point(.88, halfWidth)} ${point(.88, -halfWidth)}Z`,
    // Reuse the existing reflection, inset beyond the final outline's inner half.
    reflection: `m1.7 1.8 12 8.7M${point(.08, -halfWidth + .69)} ${point(.9, -halfWidth + .69)}`,
  }
})()

const isTextSelectionTarget = target => {
  if (!(target instanceof Element)) return false
  if (target.closest('a, button, [role="button"], [tabindex]:not([tabindex="-1"])')) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"], p, h1, h2, h3, h4, h5, h6, blockquote, li, dt, dd, pre, code'))
}

export default function MetallicCursor({ cursorRef, scopeRef, variant = 'original', finish = 'approved' }) {
  useEffect(() => {
    const scope = scopeRef.current
    const cursor = cursorRef.current
    if (!scope || !cursor || typeof window === 'undefined') return undefined

    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
    let active = finePointer.matches

    const nav = scope.querySelector('[data-cinematic-nav]')
    if (nav) {
      const lightFinish = nav.style.getPropertyValue('--cursor-light-finish')
      const darkFinish = nav.style.getPropertyValue('--cursor-dark-finish')
      if (lightFinish) cursor.style.setProperty('--cursor-light-finish', lightFinish)
      if (darkFinish) cursor.style.setProperty('--cursor-dark-finish', darkFinish)
    }

    const hideCursor = () => {
      cursor.removeAttribute('data-visible')
      cursor.removeAttribute('data-hover')
      cursor.removeAttribute('data-pressed')
      scope.removeAttribute('data-metal-cursor-ready')
    }

    const onPointerMove = event => {
      if (!active || (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen')) {
        hideCursor()
        return
      }

      const target = event.target instanceof Element ? event.target : null
      if (target && isTextSelectionTarget(target)) {
        hideCursor()
        return
      }

      // The SVG hotspot is at (0.9, 0.9) in a 24 × 30 viewBox, rendered
      // at 18 × 22.5 px. Keep that point pinned to the pointer.
      cursor.style.transform = `translate3d(${event.clientX - 0.675}px, ${event.clientY - 0.675}px, 0)`
      cursor.setAttribute('data-visible', 'true')
      scope.setAttribute('data-metal-cursor-ready', 'true')
      cursor.setAttribute('data-hover', target?.closest('a, button, [role="button"], input, select, textarea') ? 'true' : 'false')
    }

    const onPointerDown = event => {
      if (active && cursor.hasAttribute('data-visible') && (event.pointerType === 'mouse' || event.pointerType === 'pen')) cursor.setAttribute('data-pressed', 'true')
    }
    const onPointerUp = () => cursor.removeAttribute('data-pressed')
    const onViewportLeave = () => hideCursor()
    const onCapabilityChange = event => {
      active = event.matches
      if (!active) hideCursor()
    }
    cursor.removeAttribute('data-visible')
    finePointer.addEventListener('change', onCapabilityChange)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('blur', onViewportLeave)
    document.documentElement.addEventListener('pointerleave', onViewportLeave)

    return () => {
      finePointer.removeEventListener('change', onCapabilityChange)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('blur', onViewportLeave)
      document.documentElement.removeEventListener('pointerleave', onViewportLeave)
      hideCursor()
    }
  }, [cursorRef, scopeRef])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div ref={cursorRef} className={`${styles.cursor} ${finish === 'navy-chrome' ? styles.signatureCursor : ''}`} aria-hidden="true">
      <MetallicCursorArtwork variant={variant} finish={finish} />
    </div>,
    document.body,
  )
}

// Static artwork shared by the live cursor and its isolated comparison page.
// The live cursor keeps the original variant; diagnostic changes are opt-in.
export function MetallicCursorArtwork({ variant = 'original', finish = 'approved', width = 18 }) {
  const id = useId()
  const clipId = `${id}-silhouette`
  const lightId = `${id}-body-light`
  const darkId = `${id}-body-dark`
  const silhouetteOnly = variant === 'silhouette'
  const correctedAxis = variant === 'corrected-axis'
  const navyChrome = finish === 'navy-chrome'
  const activeSilhouette = correctedAxis ? correctedAxisGeometry.silhouette : silhouettePath
  const shaftFacet = correctedAxis
    ? correctedAxisGeometry.facet
    : variant === 'corrected-facet'
      ? 'M11.29 21.59 14.94 20.09 16.92 24.97 13.27 26.47Z'
      : 'M11.29 21.59 14.94 20.09 16.92 24.97 13.67 26.47Z'
  const reflection = correctedAxis ? correctedAxisGeometry.reflection : 'm1.7 1.8 12 8.7m-2.95 9.77 2.58 6.36'
  const height = width * 30 / 24

  return (
      <svg className={`${styles.arrow} ${navyChrome ? styles.signatureArtwork : ''}`} width={width} height={height} style={{ width, height }} viewBox="0 0 24 30" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId}>
            <path d={activeSilhouette} />
          </clipPath>
          <linearGradient id={lightId} x1="1" y1="1" x2="18" y2="27" gradientUnits="userSpaceOnUse">
            {navyChrome ? <>
              <stop stopColor="#f9fcff" />
              <stop offset=".16" stopColor="#b9c9da" />
              <stop offset=".31" stopColor="#f7fbff" />
              <stop offset=".48" stopColor="#6d85a2" />
              <stop offset=".62" stopColor="#e5edf5" />
              <stop offset=".8" stopColor="#49698e" />
              <stop offset="1" stopColor="#536b89" />
            </> : <>
              <stop stopColor="#ffffff" />
              <stop offset=".16" stopColor="#c5ced8" />
              <stop offset=".31" stopColor="#f8fafc" />
              <stop offset=".48" stopColor="#788697" />
              <stop offset=".62" stopColor="#e7ebef" />
              <stop offset=".8" stopColor="#8996a5" />
              <stop offset="1" stopColor="#3f4c5c" />
            </>}
          </linearGradient>
          <linearGradient id={darkId} x1="1" y1="1" x2="18" y2="27" gradientUnits="userSpaceOnUse">
            {navyChrome ? <>
              <stop stopColor="#aebbd0" />
              <stop offset=".14" stopColor="#1b2e4b" />
              <stop offset=".3" stopColor="#536b89" />
              <stop offset=".46" stopColor="#101d37" />
              <stop offset=".62" stopColor="#c0cfdf" />
              <stop offset=".78" stopColor="#263c59" />
              <stop offset="1" stopColor="#101827" />
            </> : <>
              <stop stopColor="#d9e1ea" />
              <stop offset=".14" stopColor="#35465b" />
              <stop offset=".3" stopColor="#7d8da1" />
              <stop offset=".46" stopColor="#172437" />
              <stop offset=".62" stopColor="#aebbc9" />
              <stop offset=".78" stopColor="#29394e" />
              <stop offset="1" stopColor="#0c1420" />
            </>}
          </linearGradient>
        </defs>
        <g className={styles.lightFinish}>
          <path className={correctedAxis ? undefined : styles.silhouetteLight} d={activeSilhouette} fill={silhouetteOnly ? '#c5ced8' : `url(#${lightId})`} />
          {!silhouetteOnly && <g clipPath={`url(#${clipId})`}>
            <path d="M1.8 2 11.2 18.7 5.1 23.5Z" fill={navyChrome ? '#f8fbff' : '#f8fafc'} />
            <path d="M2 1.7 21.3 15.9 14.1 17Z" fill={navyChrome ? '#526b89' : '#9aa7b6'} />
            <path d={shaftFacet} fill={navyChrome ? '#354b68' : '#465465'} />
            <path d="m2.1 2.1 1-.45 11.2 9.5-.85.62Z" fill="#fff" opacity=".96" />
            <path className={`${styles.edgeLight} ${navyChrome ? styles.signatureReflection : ''}`} data-metallic-reflection={navyChrome ? '' : undefined} d={reflection} />
          </g>}
          {correctedAxis && <path className={styles.silhouetteLight} d={activeSilhouette} fill="none" />}
        </g>
        <g className={styles.darkFinish}>
          <path className={correctedAxis ? undefined : styles.silhouetteDark} d={activeSilhouette} fill={silhouetteOnly ? '#35465b' : `url(#${darkId})`} />
          {!silhouetteOnly && <g clipPath={`url(#${clipId})`}>
            <path d="M1.8 2 11.2 18.7 5.1 23.5Z" fill={navyChrome ? '#dce7f2' : '#c5d0dc'} />
            <path d="M2 1.7 21.3 15.9 14.1 17Z" fill={navyChrome ? '#263c59' : '#34465c'} />
            <path d={shaftFacet} fill={navyChrome ? '#18283e' : '#101a29'} />
            <path d="m2.1 2.1 1-.45 11.2 9.5-.85.62Z" fill="#f8fbff" opacity=".97" />
            <path className={`${styles.edgeDark} ${navyChrome ? styles.signatureReflection : ''}`} data-metallic-reflection={navyChrome ? '' : undefined} d={reflection} />
          </g>}
          {correctedAxis && <path className={styles.silhouetteDark} d={activeSilhouette} fill="none" />}
        </g>
      </svg>
  )
}
