import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useCinematicScroll(heroRef, windowRef, titleRef, sceneControlRef, inkControlRef) {
  useEffect(() => {
    const hero = heroRef.current
    const windowElement = windowRef.current
    const title = titleRef.current
    if (!hero || !windowElement || !title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let initial = null
    const readInitial = () => {
      const box = windowElement.getBoundingClientRect()
      return { left: box.left, top: box.top, width: box.width, height: box.height }
    }
    const state = { progress: 0 }
    const render = () => {
      const progress = state.progress
      if (progress <= 0) {
        if (initial) {
          const heroBox = hero.getBoundingClientRect()
          windowElement.style.setProperty('--sculpture-x', `${initial.left - heroBox.left}px`)
          windowElement.style.setProperty('--sculpture-y', `${initial.top - heroBox.top}px`)
          windowElement.style.setProperty('--sculpture-width', `${initial.width}px`)
          windowElement.style.setProperty('--sculpture-height', `${initial.height}px`)
          windowElement.style.maxWidth = ''
          windowElement.style.maxHeight = ''
          sceneControlRef.current?.setViewport(initial.width, initial.height)
        }
        title.style.opacity = '1'
        inkControlRef.current?.setTransition(0)
        sceneControlRef.current?.setProgress(0)
        return
      }
      initial ??= readInitial()
      const heroBox = hero.getBoundingClientRect()
      // One viewport-space interpolation keeps movement and expansion on the
      // same line, avoiding the old center-then-expand detour.
      const viewportLeft = gsap.utils.interpolate(initial.left, 0, progress)
      const viewportTop = gsap.utils.interpolate(initial.top, 0, progress)
      const x = viewportLeft - heroBox.left
      const y = viewportTop - heroBox.top
      const width = gsap.utils.interpolate(initial.width, window.innerWidth, progress)
      const height = gsap.utils.interpolate(initial.height, window.innerHeight, progress)
      windowElement.style.setProperty('--sculpture-x', `${x}px`)
      windowElement.style.setProperty('--sculpture-y', `${y}px`)
      windowElement.style.setProperty('--sculpture-width', `${width}px`)
      windowElement.style.setProperty('--sculpture-height', `${height}px`)
      windowElement.style.maxWidth = 'none'
      windowElement.style.maxHeight = 'none'
      title.style.opacity = `${1 - Math.min(progress / 0.65, 1)}`
      inkControlRef.current?.setTransition(Math.min(progress / 0.2, 1))
      // Use the same interpolated bounds for CSS and the WebGL drawing buffer
      // so fast scrub updates cannot show a stale aspect ratio or low-res frame.
      sceneControlRef.current?.setViewport(width, height)
      sceneControlRef.current?.setProgress(progress)
    }
    const timeline = gsap.timeline({ paused: true, onUpdate: render })
      .to(state, { progress: 1, duration: 1, ease: 'none' })
    const trigger = ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '+=1500', pin: true, scrub: 1,
      invalidateOnRefresh: true,
      animation: timeline,
      onRefreshInit: () => { initial ??= readInitial() },
      onRefresh: self => { timeline.progress(self.progress); render() },
    })
    return () => {
      trigger.kill()
      timeline.kill()
      sceneControlRef.current?.setProgress(0)
      inkControlRef.current?.setTransition(0)
      title.style.opacity = ''
      windowElement.style.maxWidth = ''
      windowElement.style.maxHeight = ''
    }
  }, [heroRef, windowRef, titleRef, sceneControlRef, inkControlRef])
}
