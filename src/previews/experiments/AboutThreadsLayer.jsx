import { useLayoutEffect, useRef, useState } from 'react'
import Threads from './reactBits/components/backgrounds/Threads/Threads'
import styles from './AboutThreadsLayer.module.css'

const clamp = value => Math.max(0, Math.min(1, value))
const smoothstep = value => value * value * (3 - 2 * value)

export default function AboutThreadsLayer({ controlRef, mode, settings }) {
  const layerRef = useRef(null)
  const progressRef = useRef(0)
  const modeRef = useRef(mode)
  const activeRef = useRef(false)
  const [active, setActive] = useState(false)
  modeRef.current = mode

  const applyOpacity = () => {
    if (!layerRef.current) return
    const progress = progressRef.current
    const entrance = smoothstep(clamp(progress / 0.16))
    const exit = 1 - smoothstep(clamp((progress - 0.9) / 0.1))
    layerRef.current.style.opacity = modeRef.current === 'original' ? '0' : `${entrance * exit}`
  }

  useLayoutEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const progress = clamp(value)
        progressRef.current = progress
        const nextActive = progress > 0 && progress < 1
        if (activeRef.current !== nextActive) {
          activeRef.current = nextActive
          setActive(nextActive)
        }
        applyOpacity()
      },
    }
    applyOpacity()
    return () => { controlRef.current = null }
  }, [controlRef])

  useLayoutEffect(() => { applyOpacity() }, [mode])

  return (
    <div ref={layerRef} className={styles.layer} data-about-threads aria-hidden="true">
      <Threads
        {...settings}
        className={styles.threads}
        paused={!active || mode === 'original'}
        enableMouseInteraction={active && mode === 'reactive'}
        parting={mode === 'reactive' ? settings.parting : 0}
      />
    </div>
  )
}
