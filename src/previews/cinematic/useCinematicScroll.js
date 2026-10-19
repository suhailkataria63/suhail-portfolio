import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FLUX_SCROLL_DISTANCE = 2880
const INTRO_DURATION = 1
const PROJECT_DURATION = 1
const PROJECT_COUNT = 3
const PROJECT_STEP = 0.82
const PROJECT_SEQUENCE_DURATION = PROJECT_STEP * (PROJECT_COUNT - 1) + PROJECT_DURATION
const ABOUT_INTRO_DURATION = 1.8
const BUILDER_DURATION = 3.6
const JOURNEY_DURATION = 5.4
const SCENE3_DURATION = 6.4
const CONTACT_DURATION = 5.8
const JOURNEY_HANDOFF = 0.98
const ABOUT_DURATION = ABOUT_INTRO_DURATION + BUILDER_DURATION + JOURNEY_DURATION * JOURNEY_HANDOFF + SCENE3_DURATION + CONTACT_DURATION
const ABOUT_INTRO_SHARE = ABOUT_INTRO_DURATION / ABOUT_DURATION
const BUILDER_SHARE = BUILDER_DURATION / ABOUT_DURATION
const JOURNEY_SHARE = JOURNEY_DURATION / ABOUT_DURATION
const JOURNEY_START_SHARE = ABOUT_INTRO_SHARE + BUILDER_SHARE
// Begin the next scene during Journey's final reading/exit passage so the
// white canvas never sits empty between the two compositions.
const SCENE3_START_SHARE = (ABOUT_INTRO_DURATION + BUILDER_DURATION + JOURNEY_DURATION * JOURNEY_HANDOFF) / ABOUT_DURATION
const SCENE3_SHARE = SCENE3_DURATION / ABOUT_DURATION
const CONTACT_START_SHARE = SCENE3_START_SHARE + SCENE3_SHARE
// The introduction previously occupied 0.6 of a 2.5-unit timeline over 7200px:
// 7200 / 2.5 * 0.6 = 1728px. Double that stage for the new readable hold.
const STAGE_SCROLL_DISTANCE = 3456
const FLUX_DURATION = FLUX_SCROLL_DISTANCE / STAGE_SCROLL_DISTANCE
const FEATURED_DURATION = INTRO_DURATION + PROJECT_SEQUENCE_DURATION
const ABOUT_START = FLUX_DURATION + FEATURED_DURATION
const TOTAL_DURATION = ABOUT_START + ABOUT_DURATION
const TOTAL_SCROLL_DISTANCE = Math.round(STAGE_SCROLL_DISTANCE * TOTAL_DURATION)

export function useCinematicScroll(heroRef, windowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef) {
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
      const heroProgress = Math.max(0, Math.min(progress / FLUX_DURATION, 1))
      const projectProgress = Math.max(0, Math.min(progress - FLUX_DURATION, FEATURED_DURATION))
      const aboutProgress = Math.max(0, Math.min((progress - ABOUT_START) / ABOUT_DURATION, 1))
      const aboutIntroProgress = Math.max(0, Math.min(aboutProgress / ABOUT_INTRO_SHARE, 1))
      const builderProgress = Math.max(0, Math.min((aboutProgress - ABOUT_INTRO_SHARE) / BUILDER_SHARE, 1))
      const journeyProgress = Math.max(0, Math.min((aboutProgress - JOURNEY_START_SHARE) / JOURNEY_SHARE, 1))
      const scene3Progress = Math.max(0, Math.min((aboutProgress - SCENE3_START_SHARE) / SCENE3_SHARE, 1))
      const contactProgress = Math.max(0, Math.min((aboutProgress - CONTACT_START_SHARE) / (1 - CONTACT_START_SHARE), 1))
      const curiousExit = Math.max(0, Math.min(contactProgress / 0.16, 1))
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
        sceneControlRef.current?.setContactProgress?.(0)
        sceneControlRef.current?.setAboutProgress(0)
        sceneControlRef.current?.setAboutExit(0)
        projectsControlRef.current?.setProgress(0)
        aboutControlRef.current?.setProgress(0)
        builderControlRef.current?.setProgress(0)
        journeyControlRef.current?.setProgress(0)
        scene3ControlRef.current?.setProgress(0)
        scene3ControlRef.current?.setContactExit?.(0)
        contactControlRef.current?.setProgress(0)
        windowElement.style.backgroundColor = '#000'
        return
      }
      initial ??= readInitial()
      const heroBox = hero.getBoundingClientRect()
      // One viewport-space interpolation keeps movement and expansion on the
      // same line, avoiding the old center-then-expand detour.
      const viewportLeft = gsap.utils.interpolate(initial.left, 0, heroProgress)
      const viewportTop = gsap.utils.interpolate(initial.top, 0, heroProgress)
      const x = viewportLeft - heroBox.left
      const y = viewportTop - heroBox.top
      const width = gsap.utils.interpolate(initial.width, window.innerWidth, heroProgress)
      const height = gsap.utils.interpolate(initial.height, window.innerHeight, heroProgress)
      windowElement.style.setProperty('--sculpture-x', `${x}px`)
      windowElement.style.setProperty('--sculpture-y', `${y}px`)
      windowElement.style.setProperty('--sculpture-width', `${width}px`)
      windowElement.style.setProperty('--sculpture-height', `${height}px`)
      windowElement.style.maxWidth = 'none'
      windowElement.style.maxHeight = 'none'
      title.style.opacity = `${1 - Math.min(heroProgress / 0.65, 1)}`
      inkControlRef.current?.setTransition(Math.min(heroProgress / 0.2, 1))
      // Share the interpolated bounds with the scene only for uniform fitting;
      // the persistent WebGL canvas itself stays viewport-sized.
      sceneControlRef.current?.setViewport(width, height)
      sceneControlRef.current?.setProgress(heroProgress + projectProgress)
      sceneControlRef.current?.setContactProgress?.(contactProgress)
      sceneControlRef.current?.setAboutProgress(aboutIntroProgress)
      // Keep the full Builder interval available to the persistent Orbit. It
      // uses the early portion to return from the About layout and the later
      // portion to travel vertically out of frame before Builder takes over.
      sceneControlRef.current?.setAboutExit(builderProgress)
      projectsControlRef.current?.setProgress(projectProgress)
      // Let the completed intro overlap the Builder entrance briefly instead
      // of exposing a white frame between the two scenes.
      const aboutControlProgress = Math.max(aboutIntroProgress + builderProgress * 0.16, progress >= ABOUT_START ? 0.0001 : 0)
      aboutControlRef.current?.setProgress(aboutControlProgress)
      builderControlRef.current?.setProgress(builderProgress)
      journeyControlRef.current?.setProgress(journeyProgress)
      scene3ControlRef.current?.setContactExit?.(curiousExit)
      scene3ControlRef.current?.setProgress(scene3Progress)
      contactControlRef.current?.setProgress(contactProgress)
      const environmentProgress = Math.max(0, Math.min((contactProgress - 0.16) / 0.32, 1))
      if (environmentProgress > 0) {
        const shade = Math.round(255 * (1 - environmentProgress))
        windowElement.style.backgroundColor = `rgb(${shade}, ${shade}, ${shade})`
      } else {
        windowElement.style.backgroundColor = progress >= ABOUT_START ? 'transparent' : '#000'
      }
    }
    const timeline = gsap.timeline({ paused: true, onUpdate: render })
      .to(state, { progress: TOTAL_DURATION, duration: TOTAL_DURATION, ease: 'none' })
    const trigger = ScrollTrigger.create({
      trigger: hero, start: 'top top', end: `+=${TOTAL_SCROLL_DISTANCE}`, pin: true, scrub: 0.55,
      invalidateOnRefresh: true,
      animation: timeline,
      onRefreshInit: () => { initial ??= readInitial() },
      onRefresh: self => { timeline.progress(self.progress); render() },
    })
    journeyControlRef.current?.setNavigate?.(value => {
      const target = Math.max(0, Math.min(1, value))
      const aboutTarget = JOURNEY_START_SHARE + target * JOURNEY_SHARE
      const timelineTarget = (ABOUT_START + ABOUT_DURATION * aboutTarget) / TOTAL_DURATION
      window.scrollTo({ top: trigger.start + timelineTarget * (trigger.end - trigger.start), behavior: 'smooth' })
    })
    return () => {
      trigger.kill()
      timeline.kill()
      sceneControlRef.current?.setProgress(0)
      sceneControlRef.current?.setContactProgress?.(0)
      sceneControlRef.current?.setAboutExit(0)
      inkControlRef.current?.setTransition(0)
      projectsControlRef.current?.setProgress(0)
      aboutControlRef.current?.setProgress(0)
      builderControlRef.current?.setProgress(0)
      journeyControlRef.current?.setProgress(0)
      scene3ControlRef.current?.setProgress(0)
      scene3ControlRef.current?.setContactExit?.(0)
      contactControlRef.current?.setProgress(0)
      sceneControlRef.current?.setAboutProgress(0)
      title.style.opacity = ''
      windowElement.style.maxWidth = ''
      windowElement.style.maxHeight = ''
      windowElement.style.backgroundColor = ''
    }
  }, [heroRef, windowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef])
}
