import { Component, lazy, Suspense, useEffect, useRef } from 'react'
import styles from './SculptureWindow.module.css'

const SculptureScene = lazy(() => import('./SculptureScene'))
const fallback = <span className={styles.fallback}>FLUX / 3D unavailable</span>

class SceneBoundary extends Component {
  state = { unavailable: false }
  static getDerivedStateFromError() { return { unavailable: true } }
  render() {
    return this.state.unavailable ? fallback : this.props.children
  }
}

export default function SculptureWindow({ heroRef, titleRef, windowRef: externalWindowRef, sceneControlRef }) {
  const internalWindowRef = useRef(null)
  const windowRef = externalWindowRef ?? internalWindowRef
  const pointerRef = useRef({ x: 0, y: 0 })

  // Child layout effects can run before the parent's host ref is attached.
  // A passive effect waits until all hero/title DOM refs are ready.
  useEffect(() => {
    const hero = heroRef.current
    const windowElement = windowRef.current
    if (!hero || !windowElement) return
    let disposed = false
    const position = () => {
      if (disposed) return
      const heroBox = hero.getBoundingClientRect()
      const preferredWidth = heroBox.width <= 640 ? 120 : 196
      const width = Math.min(preferredWidth, heroBox.width * 0.24)
      const height = width * 0.78
      // Use the hero's own coordinate space: 80% across, 20% down.
      const left = Math.max(12, Math.min(heroBox.width - width - 12, heroBox.width * 0.8 - width / 2))
      const top = Math.max(16, Math.min(heroBox.height * 0.32 - height, heroBox.height * 0.2 - height / 2))
      windowElement.style.setProperty('--sculpture-x', `${left}px`)
      windowElement.style.setProperty('--sculpture-y', `${top}px`)
      windowElement.style.setProperty('--sculpture-width', `${width}px`)
      windowElement.style.setProperty('--sculpture-height', `${height}px`)
      windowElement.dataset.positioned = width > 0 ? 'true' : 'false'
    }
    // The overlay never participates in document flow or changes headline metrics.
    position()
    const observer = new ResizeObserver(position)
    observer.observe(hero)
    document.fonts.ready.then(position)
    document.fonts.addEventListener('loadingdone', position)
    window.addEventListener('resize', position, { passive: true })
    return () => {
      disposed = true
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', position)
      window.removeEventListener('resize', position)
    }
  }, [heroRef])

  const move = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
    pointerRef.current.y = Math.max(-1, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2))
  }
  const reset = () => { pointerRef.current.x = 0; pointerRef.current.y = 0 }

  return (
    <div ref={windowRef} className={styles.window} data-sculpture-window
      // Inline positioning also isolates the overlay from legacy main > * rules.
      style={{ position: 'absolute', zIndex: 5 }}
      onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}
      role="img" aria-label="Flux: an original twisted dark chrome sculpture. Move your pointer over it to explore.">
      <SceneBoundary>
        <Suspense fallback={<span className={styles.fallback}>FLUX / Loading</span>}>
          <SculptureScene pointerRef={pointerRef} controlRef={sceneControlRef} />
        </Suspense>
      </SceneBoundary>
      <span className={styles.label} aria-hidden="true">FLUX / 001</span>
    </div>
  )
}
