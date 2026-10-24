import { useEffect } from 'react'
import { createInkRenderer, INK_POINTS } from './inkRenderer'

// Owns only the ink layer. Future section/scroll timelines can animate the hero
// independently, without competing with React state or pointer-driven transforms.
export function useLiquidInk(heroRef, canvasRef, controlRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    const hero = heroRef.current
    const canvas = canvasRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let renderer = null
    let frame = 0
    let previousTime = 0
    let lastInput = 0
    let phase = 0
    let opacity = 0
    let transition = 0
    let inside = false
    let bounds = canvas.getBoundingClientRect()
    let target = { x: bounds.width * 0.76, y: bounds.height * 0.58 }
    const nodes = Array.from({ length: INK_POINTS }, () => ({ ...target }))
    const points = new Float32Array(INK_POINTS * 3)

    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
    }

    const clearLoaderInk = () => {
      inside = false
      opacity = 0
      stop()
      renderer?.clear()
    }
    const loaderOwnsHero = () => hero.dataset.loaderActive === 'true'

    const tick = now => {
      frame = 0
      if (loaderOwnsHero()) { clearLoaderInk(); return }
      if (!renderer || motion.matches || document.hidden) return
      const dt = Math.min((now - (previousTime || now - 16.67)) / 1000, 0.04)
      previousTime = now
      const idle = now - lastInput
      // Stop turbulence gradually as the ink settles, then stop requesting frames.
      phase += dt * Math.max(0, 1 - idle / 1800)
      const targetOpacity = (inside ? 1 : 0) * (1 - transition)
      opacity += (targetOpacity - opacity) * (1 - Math.exp(-dt * 9))
      const radius = Math.min(150, Math.max(70, bounds.width * 0.105))
      for (let i = 0; i < INK_POINTS; i++) {
        const leader = i === 0 ? target : nodes[i - 1]
        const follow = 1 - Math.exp(-dt / (0.065 + i * 0.012))
        nodes[i].x += (leader.x - nodes[i].x) * follow
        nodes[i].y += (leader.y - nodes[i].y) * follow
        const angle = i * 2.4 + phase * 0.55
        const spread = i === 0 ? 0 : radius * (0.2 + i * 0.035)
        points[i * 3] = nodes[i].x + Math.cos(angle) * spread
        points[i * 3 + 1] = nodes[i].y + Math.sin(angle * 1.12) * spread
        points[i * 3 + 2] = radius * (1 - i * 0.072)
      }
      renderer.draw(points, phase, opacity)
      if (transition >= 1) renderer.clear()
      if (!inside && opacity < 0.005) {
        renderer.clear()
        previousTime = 0
      } else if (idle < 2200) {
        frame = requestAnimationFrame(tick)
      } else {
        previousTime = 0
      }
    }

    const wake = () => {
      if (loaderOwnsHero()) { clearLoaderInk(); return }
      lastInput = performance.now()
      if (!frame && renderer && !motion.matches && !document.hidden) frame = requestAnimationFrame(tick)
    }
    if (controlRef) {
      controlRef.current = {
        setTransition(value) {
          transition = Math.max(0, Math.min(1, value))
          if (transition >= 1) {
            opacity = 0
            renderer?.clear()
          }
          wake()
        },
      }
    }
    const resize = () => {
      bounds = canvas.getBoundingClientRect()
      target.x = Math.min(bounds.width, Math.max(0, target.x))
      target.y = Math.min(bounds.height, Math.max(0, target.y))
      renderer?.resize(bounds.width, bounds.height)
      wake()
    }
    const move = event => {
      if (loaderOwnsHero()) { clearLoaderInk(); return }
      if (motion.matches || event.pointerType === 'touch') return
      // Match the shader's CSS-pixel space, including scrolling/layout changes.
      bounds = canvas.getBoundingClientRect()
      target = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      if (opacity < 0.01) nodes.forEach(node => Object.assign(node, target))
      inside = true
      wake()
    }
    const leave = () => { inside = false; wake() }
    const visibility = () => { if (document.hidden) stop(); else wake() }
    const scroll = () => { bounds = canvas.getBoundingClientRect() }
    const configure = () => {
      stop()
      if (motion.matches) {
        renderer?.dispose()
        renderer = null
        opacity = 0
      } else {
        renderer ??= createInkRenderer(canvas)
        resize()
      }
    }
    const contextLost = event => {
      event.preventDefault()
      stop()
      renderer = null
    }
    // Do not reveal an ink trail accumulated behind the loader. A fresh Hero
    // pointer event starts the unchanged interaction after ownership releases.
    const loaderObserver = new MutationObserver(clearLoaderInk)
    loaderObserver.observe(hero, { attributes: true, attributeFilter: ['data-loader-active'] })
    const observer = new ResizeObserver(resize)
    observer.observe(hero)
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('scroll', scroll, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    motion.addEventListener('change', configure)
    canvas.addEventListener('webglcontextlost', contextLost)
    canvas.addEventListener('webglcontextrestored', configure)
    configure()

    return () => {
      stop()
      observer.disconnect()
      loaderObserver.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', scroll)
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', configure)
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('webglcontextrestored', configure)
      renderer?.dispose()
      if (controlRef) controlRef.current = null
    }
  }, [heroRef, canvasRef, controlRef, enabled])
}
