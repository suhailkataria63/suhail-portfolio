import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cancelFrame, frame, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import './CircularText.css'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// React Bits Circular Text, using the installed Framer Motion 12 exports
// (including Motion's frame scheduler) and a parent-controlled hover signal.
export default function CircularText({
  text,
  spinDuration = 16,
  direction = 'clockwise',
  size = 78,
  fontSize = 7,
  fontWeight = 650,
  letterSpacing = 0,
  color = '#101722',
  startAngle = 0,
  fill = true,
  repeat = 2,
  ring = false,
  ringColor = '',
  ringInset = null,
  tilt = 0,
  hoverTilt = 0,
  draggable = false,
  children,
  className = '',
  mode = 'hover',
  hovered = false,
  hoverAcceleration = 2,
  continuousHoverAcceleration = 4,
  glyphRadius = null,
}) {
  const rootRef = useRef(null)
  const stateRef = useRef({ fling: 0, cruise: 0 })
  const [advances, setAdvances] = useState(null)
  const [settled, setSettled] = useState(false)
  const reduceMotion = useReducedMotion()
  const rotation = useMotionValue(0)
  const speed = useSpring(mode === 'hover' ? 0 : 1, { stiffness: 60, damping: 18 })
  const tiltX = useSpring(0, { stiffness: 150, damping: 18 })
  const tiltY = useSpring(0, { stiffness: 150, damping: 18 })
  const glyphs = useMemo(() => Array.from(text ?? ''), [text])
  const copies = Math.max(1, Math.round(repeat) || 1)
  const letters = useMemo(() => Array.from({ length: copies }, () => glyphs).flat(), [glyphs, copies])
  const glyphTop = glyphRadius == null
    ? undefined
    : typeof glyphRadius === 'number'
      ? size / 2 - glyphRadius
      : `calc(50% - ${glyphRadius})`
  const angles = useMemo(() => {
    const count = glyphs.length
    if (!count) return []
    if (fill) return letters.map((_, index) => startAngle + (360 / letters.length) * index)
    const known = advances && advances.length === count ? advances : null
    const toDegrees = 180 / (Math.PI * Math.max(size / 2 - fontSize * 0.6, 1))
    const arcs = glyphs.map((glyph, index) => {
      const width = known ? known[index] : fontSize * (glyph === ' ' ? 0.3 : 0.6)
      return Math.max(0, width + letterSpacing * fontSize) * toDegrees
    })
    const span = arcs.reduce((sum, arc) => sum + arc, 0)
    const fit = span > 0 ? Math.min(1, 360 / (span * copies)) : 1
    const result = []
    for (let copy = 0; copy < copies; copy += 1) {
      let cursor = startAngle + (360 / copies) * copy - (arcs[0] * fit) / 2
      for (let index = 0; index < count; index += 1) {
        const arc = arcs[index] * fit
        result.push(cursor + arc / 2)
        cursor += arc
      }
    }
    return result
  }, [glyphs, letters, copies, fill, startAngle, size, fontSize, letterSpacing, advances])

  useIsomorphicLayoutEffect(() => {
    if (fill) return undefined
    let alive = true
    const measure = () => {
      if (!alive) return
      const widths = glyphs.map((_, index) => rootRef.current?.querySelectorAll('.circular-text__letter')[index]?.offsetWidth ?? 0)
      setAdvances(previous => previous && previous.length === widths.length && previous.every((width, index) => width === widths[index]) ? previous : widths)
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    return () => { alive = false }
  }, [fill, glyphs, fontSize, fontWeight, className])

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const state = stateRef.current
    const turn = direction === 'counterclockwise' ? -1 : 1
    state.cruise = spinDuration > 0 && !reduceMotion ? (360 / spinDuration) * turn : 0
    if (!root || reduceMotion) return undefined
    const spin = ({ delta }) => {
      const dt = Math.min(delta, 100) / 1000
      state.fling *= Math.exp(-dt / 0.7)
      if (Math.abs(state.fling) < 1) state.fling = 0
      const velocity = state.cruise * speed.get() + state.fling
      if (velocity) rotation.set((rotation.get() + velocity * dt) % 360)
    }
    let running = false
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === running) return
      running = entry.isIntersecting
      if (running) frame.update(spin, true)
      else cancelFrame(spin)
    })
    observer.observe(root)
    return () => {
      observer.disconnect()
      cancelFrame(spin)
    }
  }, [spinDuration, direction, reduceMotion, rotation, speed])

  useEffect(() => {
    tiltX.set(0)
    tiltY.set(0)
  }, [hoverTilt, reduceMotion, tiltX, tiltY])

  useEffect(() => {
    const state = stateRef.current
    state.fling = 0
    speed.set(reduceMotion ? 0 : hovered ? (mode === 'hover' ? hoverAcceleration : continuousHoverAcceleration) : (mode === 'hover' ? 0 : 1))
  }, [hovered, mode, hoverAcceleration, continuousHoverAcceleration, reduceMotion, speed])

  return (
    <div
      ref={rootRef}
      className={`circular-text ${className}`}
      data-settled={settled ? '' : undefined}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        boxSizing: 'border-box',
        fontSize,
        fontWeight,
        letterSpacing,
        color: color || undefined,
        perspective: typeof size === 'number' ? size * 2.5 : undefined,
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: draggable ? 'none' : undefined,
      }}
    >
      <motion.div className="circular-text__tilt" style={{ rotateX: tiltX, rotateY: tiltY, scale: 1 }}>
        <div className="circular-text__plane" style={{ transform: tilt ? `rotateX(${tilt}deg)` : undefined }}>
          <span
            className="circular-text__line"
            style={{ borderWidth: Math.max(1, fontSize / 16), borderColor: ringColor || undefined, opacity: ring ? 1 : 0, inset: ringInset ?? undefined }}
          />
          <motion.div className="circular-text__ring" style={{ rotate: rotation }}>
            {letters.map((letter, index) => (
              <span key={index} className="circular-text__letter" style={{ transform: `rotate(${angles[index] ?? 0}deg)` }}>
                <span style={glyphTop == null ? undefined : { top: glyphTop }}>{letter}</span>
              </span>
            ))}
          </motion.div>
        </div>
        {children != null && children !== false ? <div className="circular-text__center">{children}</div> : null}
      </motion.div>
    </div>
  )
}
