import { useEffect, useRef } from 'react'
import styles from './TiltedCard.module.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Adapted from the official React Bits Tilted Card spring and pointer model:
// https://reactbits.dev/components/tilted-card
const springStep = (state, key, velocityKey, target, omega, dampingRatio, dt) => {
  const count = Math.max(1, Math.ceil(dt / (1 / 240)))
  const step = dt / count
  for (let index = 0; index < count; index += 1) {
    state[velocityKey] += (omega * omega * (target - state[key]) - 2 * dampingRatio * omega * state[velocityKey]) * step
    state[key] += state[velocityKey] * step
  }
  const settled = Math.abs(target - state[key]) < 0.001 && Math.abs(state[velocityKey]) < 0.01
  if (settled) {
    state[key] = target
    state[velocityKey] = 0
  }
  return !settled
}

export default function TiltedCard({
  enabled = true,
  active = false,
  rotateAmplitude = 9,
  scaleOnHover = 1.03,
  springResponsiveness = 0.58,
  spotlightTargetRef = null,
  spotlightEnabled = true,
  spotlightIntensity = 0.16,
  spotlightSize = 220,
  spotlightColor = '#e6efff',
  children,
  className = '',
}) {
  const figureRef = useRef(null)
  const bodyRef = useRef(null)
  const wakeRef = useRef(null)
  const settingsRef = useRef(null)
  const settings = {
    enabled,
    active,
    amplitude: clamp(rotateAmplitude, 0, 10),
    scale: clamp(scaleOnHover, 1, 1.035),
    // React Bits calls this `smoothness`; higher values settle more slowly.
    smoothness: 1 - clamp(springResponsiveness, 0, 1),
    spotlightEnabled,
    spotlightIntensity: clamp(spotlightIntensity, 0, 0.35),
    spotlightSize: clamp(spotlightSize, 100, 500),
    spotlightColor,
  }
  settingsRef.current = settings

  useEffect(() => { wakeRef.current?.() })

  useEffect(() => {
    const figure = figureRef.current
    const body = bodyRef.current
    if (!figure || !body) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const state = { x: 0, vx: 0, y: 0, vy: 0, lift: 0, vlift: 0, spotlightX: 0, spotlightY: 0 }
    const pointer = { nx: 0, ny: 0, sx: 0, sy: 0, inside: false, mouse: false }
    let raf = 0
    let last = 0

    const frame = now => {
      raf = 0
      const s = settingsRef.current
      const dt = clamp((now - (last || now)) / 1000 || 0, 0, 0.05)
      last = now
      const hovering = s.enabled && s.active && !reduced && !coarse && pointer.inside && pointer.mouse
      const spotlighting = s.spotlightEnabled && s.active && !reduced && !coarse && pointer.inside && pointer.mouse
      const smoothness = s.smoothness
      const omega = 20 * Math.pow(0.2, smoothness)
      const dampingRatio = 1 - 0.3 * smoothness
      const movingX = springStep(state, 'x', 'vx', hovering ? -pointer.ny * s.amplitude : 0, omega, dampingRatio, dt)
      const movingY = springStep(state, 'y', 'vy', hovering ? pointer.nx * s.amplitude : 0, omega, dampingRatio, dt)
      const movingLift = springStep(state, 'lift', 'vlift', hovering ? 1 : 0, omega, Math.max(dampingRatio, 0.85), dt)
      const spotlightTarget = spotlightTargetRef?.current
      let movingSpotlight = false
      if (spotlightTarget) {
        const follow = 1 - Math.exp(-dt / 0.055)
        if (spotlighting) {
          state.spotlightX += (pointer.sx - state.spotlightX) * follow
          state.spotlightY += (pointer.sy - state.spotlightY) * follow
        }
        spotlightTarget.style.setProperty('--spotlight-x', `${state.spotlightX.toFixed(1)}px`)
        spotlightTarget.style.setProperty('--spotlight-y', `${state.spotlightY.toFixed(1)}px`)
        const isVisible = spotlighting ? 'true' : 'false'
        if (spotlightTarget.dataset.spotlightActive !== isVisible) spotlightTarget.dataset.spotlightActive = isVisible
        movingSpotlight = spotlighting && (Math.abs(state.spotlightX - pointer.sx) > 0.15 || Math.abs(state.spotlightY - pointer.sy) > 0.15)
      }

      const moving = movingX || movingY || movingLift || movingSpotlight

      const scale = 1 + (s.scale - 1) * state.lift
      body.style.transform = `rotateX(${state.x.toFixed(3)}deg) rotateY(${state.y.toFixed(3)}deg) scale(${scale.toFixed(4)})`
      if (moving) raf = requestAnimationFrame(frame)
      else last = 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const locate = event => {
      const rect = figure.getBoundingClientRect()
      pointer.nx = clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1, -1, 1)
      pointer.ny = clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1, -1, 1)
      const spotlightRect = spotlightTargetRef?.current?.getBoundingClientRect()
      if (spotlightRect) {
        pointer.sx = clamp(event.clientX - spotlightRect.left, 0, spotlightRect.width)
        pointer.sy = clamp(event.clientY - spotlightRect.top, 0, spotlightRect.height)
      }
    }
    const onEnter = event => {
      pointer.inside = true
      pointer.mouse = event.pointerType === 'mouse' || event.pointerType === 'pen'
      locate(event)
      state.spotlightX = pointer.sx
      state.spotlightY = pointer.sy
      wake()
    }
    const onMove = event => {
      pointer.mouse = event.pointerType === 'mouse' || event.pointerType === 'pen'
      if (!pointer.mouse || coarse || !settingsRef.current.active || (!settingsRef.current.enabled && !settingsRef.current.spotlightEnabled)) return
      locate(event)
      wake()
    }
    const onLeave = () => {
      pointer.inside = false
      wake()
    }

    wakeRef.current = wake
    figure.addEventListener('pointerenter', onEnter)
    figure.addEventListener('pointermove', onMove)
    figure.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      wakeRef.current = null
      figure.removeEventListener('pointerenter', onEnter)
      figure.removeEventListener('pointermove', onMove)
      figure.removeEventListener('pointerleave', onLeave)
      body.style.transform = 'none'
    }
  }, [])

  return (
    <div ref={figureRef} className={`${styles.stage} ${className}`.trim()}>
      <div ref={bodyRef} className={styles.body}>{children}</div>
    </div>
  )
}
