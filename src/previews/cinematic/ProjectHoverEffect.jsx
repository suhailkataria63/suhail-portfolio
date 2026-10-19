import { useEffect, useRef } from 'react'
import styles from './ProjectShowcase.module.css'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export default function ProjectHoverEffect({ mode = 'subtle', filterId, href, controlRef, linkRef, linkClassName = '', children, label = 'VIEW LIVE ↗', ariaLabel }) {
  const surfaceRef = useRef(null)
  const visualRef = useRef(null)
  const displacementRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const surface = surfaceRef.current
    const visual = visualRef.current
    const image = surface?.querySelector('[data-hover-image]')
    const displacement = displacementRef.current
    const pointerLabel = labelRef.current
    if (!surface || !visual || !pointerLabel) return undefined
    const link = surface.closest('a')
    const interactionTarget = link || surface

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const interactionMotion = !reduced && !touch
    const experimental = mode !== 'stable'
    surface.dataset.mode = mode
    if (image) image.style.filter = interactionMotion && mode === 'cappen' ? `url(#${filterId})` : ''

    let frame = 0
    let inside = false
    let active = null
    let previousTime = performance.now()
    let previousX = 0
    let previousY = 0
    const target = { x: 0, y: 0, labelX: 0, labelY: 0, strength: 0, hover: 0, rotateX: 0, rotateY: 0 }
    const current = { ...target }

    const tick = now => {
      const elapsed = Math.max(now - previousTime, 1)
      previousTime = now
      const ease = 1 - Math.pow(0.001, elapsed / 420)
      Object.keys(current).forEach(key => { current[key] += (target[key] - current[key]) * ease })
      surface.style.setProperty('--hover-x', `${current.x}px`)
      surface.style.setProperty('--hover-y', `${current.y}px`)
      const scale = mode === 'stable'
        ? 1 + current.hover * 0.018
        : mode === 'subtle' ? 1 + current.hover * 0.03 : 1
      visual.style.transform = experimental
        ? `translate3d(${current.x * 0.03}px, ${current.y * 0.035}px, ${mode === 'subtle' ? current.strength * 0.7 : 0}px) scale(${scale}) rotateX(${current.rotateX}deg) rotateY(${current.rotateY}deg)`
        : 'none'
      if (image) {
        image.style.transform = mode === 'cappen'
          ? `translate3d(${current.x * 0.028}px, ${current.y * 0.028}px, 0) skew(${current.x / Math.max(surface.clientWidth, 1) * 3.5}deg, ${current.y / Math.max(surface.clientHeight, 1) * 2.5}deg) scale(1.025)`
          : 'none'
      }
      pointerLabel.style.transform = `translate3d(${current.labelX}px, ${current.labelY}px, 0)`
      if (displacement) displacement.setAttribute('scale', `${mode === 'cappen' ? current.strength : 0}`)
      if (inside || Math.abs(current.strength) > 0.02 || Math.abs(current.hover) > 0.01 || Math.abs(current.rotateX) > 0.01 || Math.abs(current.rotateY) > 0.01) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const start = () => { if (!frame) frame = requestAnimationFrame(tick) }
    const reset = () => {
      inside = false
      delete surface.dataset.hovered
      target.x = 0
      target.y = 0
      target.labelX = 0
      target.labelY = 0
      target.strength = 0
      target.hover = 0
      target.rotateX = 0
      target.rotateY = 0
      start()
    }
    const setActive = nextActive => {
      const next = Boolean(nextActive)
      if (active === next) return
      active = next
      if (link) {
        link.tabIndex = active ? 0 : -1
        link.style.pointerEvents = active ? 'auto' : 'none'
        link.setAttribute('aria-disabled', active ? 'false' : 'true')
      }
      surface.style.pointerEvents = active ? 'auto' : 'none'
      if (!active) reset()
    }
    const enter = () => {
      if (!active) return
      inside = true
      target.hover = mode === 'cappen' ? 0 : 1
      surface.dataset.hovered = 'true'
      start()
    }
    const leave = () => {
      reset()
    }
    const move = event => {
      if (!active) return
      const rect = interactionTarget.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      const speed = Math.hypot(x - previousX, y - previousY) / Math.max(performance.now() - previousTime, 1)
      previousX = x
      previousY = y
      target.x = x
      target.y = y
      target.labelX = clamp(x + rect.width / 2 + 16, 0, Math.max(0, rect.width - pointerLabel.offsetWidth))
      target.labelY = clamp(y + rect.height / 2 + 16, 0, Math.max(0, rect.height - pointerLabel.offsetHeight))
      target.strength = mode === 'cappen' ? clamp(8 + speed * 22, 8, 34) : mode === 'subtle' ? clamp(0.35 + speed * 0.06, 0.35, 1.5) : 0
      target.rotateX = mode === 'subtle' ? clamp(-y / Math.max(rect.height, 1) * 7, -5, 5) : 0
      target.rotateY = mode === 'subtle' ? clamp(x / Math.max(rect.width, 1) * 8, -5, 5) : 0
      start()
    }

    setActive(false)

    if (controlRef) controlRef.current = { setActive }

    if (interactionMotion) {
      interactionTarget.addEventListener('pointerenter', enter)
      interactionTarget.addEventListener('pointermove', move)
      interactionTarget.addEventListener('pointerleave', leave)
    }
    return () => {
      if (interactionMotion) {
        interactionTarget.removeEventListener('pointerenter', enter)
        interactionTarget.removeEventListener('pointermove', move)
        interactionTarget.removeEventListener('pointerleave', leave)
      }
      if (frame) cancelAnimationFrame(frame)
      visual.style.transform = 'none'
      if (image) {
        image.style.filter = ''
        image.style.transform = 'none'
      }
      if (controlRef) controlRef.current = null
    }
  }, [controlRef, filterId, mode])

  const content = (
      <span ref={surfaceRef} className={styles.hoverSurface}>
      <span ref={visualRef} className={styles.hoverVisual}>
        {children}
      </span>
      <span ref={labelRef} className={styles.liveLabel}>{label}</span>
      <svg className={styles.filterDefs} aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="8" result="noise" />
            <feDisplacementMap ref={displacementRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </span>
  )

  if (!href) return content
  return <a ref={linkRef} className={`${styles.projectLink} ${linkClassName}`.trim()} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel || `View ${label.replace(' ↗', '')}`} aria-disabled="true" tabIndex={-1}>{content}</a>
}
