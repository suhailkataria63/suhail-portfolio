import { useEffect, useLayoutEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  SCENE3_BASE_DURATION, SCENE3_PROGRESS_SCALE,
  ARRANGEMENT_DURATION, ARRANGEMENT_START,
  COMPOSITION_BODY_DURATION, COMPOSITION_BODY_START, COMPOSITION_DURATION, COMPOSITION_START,
  CONSTELLATION_DURATION, CONSTELLATION_START, FINAL_REVEAL_START, OPENING_EXIT_START,
} from './sceneThreeTiming'
import { CONTACT_DURATION, mapContactProgress, mapPreviewContactProgress, PREVIEW_CONTACT_DURATION } from './contactTiming'
import { createScrollStageSequence } from './scrollStageSequence'
import { createScrollStageController } from './createScrollStageController'
import { createScrollChoreography } from './scrollChoreography'
import {
  JOURNEY_TO_BEYOND_STAGE_UNITS,
  OUTLINED_HEADLINE_END_PROGRESS,
  PREVIEW_REVEAL_END_PROGRESS,
} from './journeyBeyondPreviewTiming'

gsap.registerPlugin(ScrollTrigger)

const FLUX_SCROLL_DISTANCE = 2880
const INTRO_DURATION = 1
const PROJECT_DURATION = 1
const PROJECT_COUNT = 3
const PROJECT_STEP = 0.82
const PROJECT_EXIT_START = 0.62
const PROJECT_SEQUENCE_DURATION = PROJECT_STEP * (PROJECT_COUNT - 1) + PROJECT_DURATION
const ABOUT_INTRO_DURATION = 1.8
const ABOUT_HANDOFF_PROGRESS = 0.16
const BUILDER_BASE_DURATION = 3.6
const BUILDER_DURATION = 3.3
const BUILDER_SETTLE_END = 0.7376
const BUILDER_ENTRY_END = 0.18 + 0.82 * 0.22
const BUILDER_REVEAL_SCALE = 0.5
const BUILDER_JOURNEY_HANDOFF_SCALE = 0.25
const BUILDER_SETTLE_UNITS = BUILDER_BASE_DURATION * BUILDER_SETTLE_END
const BUILDER_TAIL_UNITS = BUILDER_BASE_DURATION - BUILDER_SETTLE_UNITS
const BUILDER_TAIL_DURATION = BUILDER_DURATION - BUILDER_SETTLE_UNITS
const JOURNEY_BASE_DURATION = 5.4
const JOURNEY_MILESTONE_START = 0.36
const JOURNEY_MILESTONE_END = 0.88
const JOURNEY_MILESTONE_SCALE = 0.5
const JOURNEY_ENTRY_SCALE = 0.25
const JOURNEY_PRE_MILESTONE_UNITS = JOURNEY_BASE_DURATION * JOURNEY_MILESTONE_START
const JOURNEY_MILESTONE_UNITS = JOURNEY_BASE_DURATION * (JOURNEY_MILESTONE_END - JOURNEY_MILESTONE_START) * JOURNEY_MILESTONE_SCALE
const JOURNEY_POST_MILESTONE_UNITS = JOURNEY_BASE_DURATION * (1 - JOURNEY_MILESTONE_END)
const JOURNEY_DURATION = JOURNEY_PRE_MILESTONE_UNITS + JOURNEY_MILESTONE_UNITS + JOURNEY_POST_MILESTONE_UNITS
const JOURNEY_MILESTONE_END_UNITS = JOURNEY_PRE_MILESTONE_UNITS + JOURNEY_MILESTONE_UNITS
const JOURNEY_HANDOFF_PROGRESS = 0.98
// SceneThree tightens only the Beyond headline lead-in while preserving the
// CODE fill and all downstream phase lengths.
const SCENE3_DURATION = SCENE3_BASE_DURATION * SCENE3_PROGRESS_SCALE
// The introduction previously occupied 0.6 of a 2.5-unit timeline over 7200px:
// 7200 / 2.5 * 0.6 = 1728px. Double that stage for the new readable hold.
const STAGE_SCROLL_DISTANCE = 3456
const FLUX_DURATION = FLUX_SCROLL_DISTANCE / STAGE_SCROLL_DISTANCE
const FEATURED_DURATION = INTRO_DURATION + PROJECT_SEQUENCE_DURATION
const progressSmoothstep = (value, min, max) => {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

const mapBuilderProgress = value => {
  const elapsed = Math.max(0, Math.min(1, value)) * BUILDER_DURATION
  if (elapsed <= BUILDER_SETTLE_UNITS) return elapsed / BUILDER_BASE_DURATION
  return BUILDER_SETTLE_END + ((elapsed - BUILDER_SETTLE_UNITS) / BUILDER_TAIL_DURATION) * (BUILDER_TAIL_UNITS / BUILDER_BASE_DURATION)
}

const mapJourneyProgress = value => {
  const elapsed = Math.max(0, Math.min(1, value)) * JOURNEY_DURATION
  if (elapsed <= JOURNEY_PRE_MILESTONE_UNITS) return elapsed / JOURNEY_BASE_DURATION
  if (elapsed <= JOURNEY_MILESTONE_END_UNITS) {
    return JOURNEY_MILESTONE_START + ((elapsed - JOURNEY_PRE_MILESTONE_UNITS) / JOURNEY_MILESTONE_UNITS) * (JOURNEY_MILESTONE_END - JOURNEY_MILESTONE_START)
  }
  return JOURNEY_MILESTONE_END + ((elapsed - JOURNEY_MILESTONE_END_UNITS) / JOURNEY_POST_MILESTONE_UNITS) * (1 - JOURNEY_MILESTONE_END)
}

const journeyProgressToStage = value => {
  const target = Math.max(0, Math.min(1, value))
  let elapsed
  if (target <= JOURNEY_MILESTONE_START) elapsed = target * JOURNEY_BASE_DURATION
  else if (target <= JOURNEY_MILESTONE_END) {
    elapsed = JOURNEY_PRE_MILESTONE_UNITS + ((target - JOURNEY_MILESTONE_START) / (JOURNEY_MILESTONE_END - JOURNEY_MILESTONE_START)) * JOURNEY_MILESTONE_UNITS
  } else {
    elapsed = JOURNEY_MILESTONE_END_UNITS + ((target - JOURNEY_MILESTONE_END) / (1 - JOURNEY_MILESTONE_END)) * JOURNEY_POST_MILESTONE_UNITS
  }
  return elapsed / JOURNEY_DURATION
}

const inverseProgressMap = (mapProgress, target) => {
  let low = 0
  let high = 1
  for (let index = 0; index < 32; index += 1) {
    const middle = (low + high) / 2
    if (mapProgress(middle) < target) low = middle
    else high = middle
  }
  return (low + high) / 2
}

export function useCinematicScroll(heroRef, windowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef, navControlRef, scrollMode = 'continuous', shortenHeroTransition = false, shortenFinalProjectToBeyond = false, shortenBeyondToBuilderEntry = false, shortenBuilderRevealAndJourneyEntry = false, shortenJourneyToBeyondReveal = false, scopeSceneFallback = false, shortenCuriousToContact = false, heroTechLifecycleRef = null, orbitDiagnostics = null, aboutThreadsControlRef = null) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (scrollMode !== 'choreography') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [scrollMode])
  useLayoutEffect(() => {
    const hero = heroRef.current
    const windowElement = windowRef.current
    const title = titleRef.current
    if (!hero || !windowElement || !title || (scrollMode === 'choreography' ? reducedMotion : window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined
    const isChoreography = scrollMode === 'choreography'
    // Isolated preview options reallocate only their named timeline spans. The
    // shared pixels-per-unit scale and subsequent scene durations stay fixed.
    const fluxDuration = FLUX_DURATION * (shortenHeroTransition ? 0.5 : 1)
    const projects = projectsControlRef.current?.getStageInfo?.()
    const milestones = journeyControlRef.current?.getStageInfo?.()
    // Metadata comes from the actual rendered collections, not a second
    // preview copy of their contents/counts. Default production ranges stay put.
    const projectSourceDuration = isChoreography
      ? projects.intro + projects.step * Math.max(0, projects.items.length - 1) + projects.duration
      : FEATURED_DURATION
    const projectIntro = isChoreography ? projects.intro : INTRO_DURATION
    const projectStep = isChoreography ? projects.step : PROJECT_STEP
    const projectDuration = isChoreography ? projects.duration : PROJECT_DURATION
    const projectCount = isChoreography ? projects.items.length : PROJECT_COUNT
    const lastProjectExitStart = projectIntro + Math.max(0, projectCount - 1) * projectStep + projectDuration * PROJECT_EXIT_START
    const projectExitSourceSpan = Math.max(0, projectSourceDuration - lastProjectExitStart)
    const projectExitScale = shortenFinalProjectToBeyond ? 0.5 : 1
    const shortenedProjectExitSpan = projectExitSourceSpan * projectExitScale
    const featuredDuration = projectSourceDuration - projectExitSourceSpan + shortenedProjectExitSpan
    const mapProjectProgress = value => {
      const progress = Math.max(0, Math.min(featuredDuration, value))
      if (!shortenFinalProjectToBeyond || progress <= lastProjectExitStart || shortenedProjectExitSpan === 0) return progress
      return lastProjectExitStart + ((progress - lastProjectExitStart) / shortenedProjectExitSpan) * projectExitSourceSpan
    }
    const aboutIntroDuration = ABOUT_INTRO_DURATION * (shortenFinalProjectToBeyond ? 0.5 : 1)
    const aboutStart = fluxDuration + featuredDuration
    const builderEntrySourceUnits = BUILDER_DURATION * inverseProgressMap(mapBuilderProgress, BUILDER_ENTRY_END)
    const builderEntryScale = shortenBeyondToBuilderEntry ? 0.5 : 1
    const builderEntryUnits = builderEntrySourceUnits * builderEntryScale
    const builderRevealSourceUnits = Math.max(0, BUILDER_SETTLE_UNITS - builderEntrySourceUnits)
    const builderRevealScale = shortenBuilderRevealAndJourneyEntry ? BUILDER_REVEAL_SCALE : 1
    const builderRevealUnits = builderRevealSourceUnits * builderRevealScale
    const builderExitSourceUnits = Math.max(0, BUILDER_DURATION - BUILDER_SETTLE_UNITS)
    const builderExitScale = shortenBuilderRevealAndJourneyEntry ? BUILDER_JOURNEY_HANDOFF_SCALE : 1
    const builderExitUnits = builderExitSourceUnits * builderExitScale
    const builderDuration = builderEntryUnits + builderRevealUnits + builderExitUnits
    const mapBuilderStageProgress = value => {
      const allocatedUnits = Math.max(0, Math.min(1, value)) * builderDuration
      let sourceUnits
      if (allocatedUnits <= builderEntryUnits) {
        sourceUnits = allocatedUnits / builderEntryScale
      } else if (allocatedUnits <= builderEntryUnits + builderRevealUnits) {
        sourceUnits = builderEntrySourceUnits + (allocatedUnits - builderEntryUnits) / builderRevealScale
      } else {
        sourceUnits = BUILDER_SETTLE_UNITS + (allocatedUnits - builderEntryUnits - builderRevealUnits) / builderExitScale
      }
      return mapBuilderProgress(sourceUnits / BUILDER_DURATION)
    }
    const journeyEntrySourceUnits = JOURNEY_BASE_DURATION * JOURNEY_MILESTONE_START
    const journeyEntryUnits = journeyEntrySourceUnits * JOURNEY_ENTRY_SCALE
    const journeyStageDuration = JOURNEY_DURATION - journeyEntrySourceUnits + journeyEntryUnits
    const mapJourneyStageProgress = value => {
      const allocatedUnits = Math.max(0, Math.min(1, value)) * journeyStageDuration
      const sourceUnits = allocatedUnits <= journeyEntryUnits
        ? allocatedUnits / JOURNEY_ENTRY_SCALE
        : journeyEntrySourceUnits + allocatedUnits - journeyEntryUnits
      return mapJourneyProgress(sourceUnits / JOURNEY_DURATION)
    }
    const journeyTiming = shortenBuilderRevealAndJourneyEntry ? {
      duration: journeyStageDuration,
      mapProgress: mapJourneyStageProgress,
      fractionForProgress: value => inverseProgressMap(mapJourneyStageProgress, value),
    } : {
      duration: JOURNEY_DURATION,
      mapProgress: mapJourneyProgress,
      fractionForProgress: journeyProgressToStage,
    }
    const journeyDuration = journeyTiming.duration
    const journeyHandoff = journeyTiming.fractionForProgress(JOURNEY_HANDOFF_PROGRESS)
    const sceneThreeTiming = shortenJourneyToBeyondReveal ? (() => {
      const journeyExitUnits = journeyDuration * (
        journeyTiming.fractionForProgress(JOURNEY_HANDOFF_PROGRESS)
        - journeyTiming.fractionForProgress(0.97)
      )
      const sceneEntryProgress = OUTLINED_HEADLINE_END_PROGRESS
      const revealEndProgress = PREVIEW_REVEAL_END_PROGRESS
      const sceneEntryUnits = JOURNEY_TO_BEYOND_STAGE_UNITS - journeyExitUnits
      const sceneRevealUnits = JOURNEY_TO_BEYOND_STAGE_UNITS
      const beyondExitStartProgress = OPENING_EXIT_START / SCENE3_PROGRESS_SCALE
      const completedRevealHoldUnits = (beyondExitStartProgress - revealEndProgress) * SCENE3_DURATION
      // The Tools resting boundary is the latest completion among its copy,
      // body, constellation/planet entrance, and node arrangement. Always
      // Curious begins at the existing final-reveal start; its contact exit
      // remains in the following, unchanged Contact timeline.
      const toolsSettledProgress = Math.max(
        COMPOSITION_START + COMPOSITION_DURATION,
        COMPOSITION_BODY_START + COMPOSITION_BODY_DURATION,
        CONSTELLATION_START + CONSTELLATION_DURATION,
        ARRANGEMENT_START + ARRANGEMENT_DURATION,
      ) / SCENE3_PROGRESS_SCALE
      const toolsExitStartProgress = FINAL_REVEAL_START / SCENE3_PROGRESS_SCALE
      const toolsEntryUnits = JOURNEY_TO_BEYOND_STAGE_UNITS
      const toolsToCuriousUnits = JOURNEY_TO_BEYOND_STAGE_UNITS
      const toolsHoldUnits = toolsToCuriousUnits * (
        (toolsExitStartProgress - toolsSettledProgress) / (1 - toolsSettledProgress)
      )
      const curiousEntryUnits = toolsToCuriousUnits - toolsHoldUnits
      const revealBoundaryUnits = sceneEntryUnits + sceneRevealUnits
      const beyondExitBoundaryUnits = revealBoundaryUnits + completedRevealHoldUnits
      const toolsBoundaryUnits = beyondExitBoundaryUnits + toolsEntryUnits
      const curiousEntryBoundaryUnits = toolsBoundaryUnits + toolsHoldUnits
      const duration = toolsBoundaryUnits + toolsToCuriousUnits
      const mapProgress = value => {
        const allocatedUnits = Math.max(0, Math.min(1, value)) * duration
        if (allocatedUnits <= sceneEntryUnits) {
          return (allocatedUnits / sceneEntryUnits) * sceneEntryProgress
        }
        if (allocatedUnits <= revealBoundaryUnits) {
          return sceneEntryProgress + ((allocatedUnits - sceneEntryUnits) / sceneRevealUnits) * (revealEndProgress - sceneEntryProgress)
        }
        if (allocatedUnits <= beyondExitBoundaryUnits) {
          return revealEndProgress + (allocatedUnits - revealBoundaryUnits) / SCENE3_DURATION
        }
        if (allocatedUnits <= toolsBoundaryUnits) {
          return beyondExitStartProgress + ((allocatedUnits - beyondExitBoundaryUnits) / toolsEntryUnits) * (toolsSettledProgress - beyondExitStartProgress)
        }
        if (allocatedUnits <= curiousEntryBoundaryUnits) {
          return toolsSettledProgress + ((allocatedUnits - toolsBoundaryUnits) / toolsHoldUnits) * (toolsExitStartProgress - toolsSettledProgress)
        }
        return toolsExitStartProgress + ((allocatedUnits - curiousEntryBoundaryUnits) / curiousEntryUnits) * (1 - toolsExitStartProgress)
      }
      return {
        duration,
        mapProgress,
        fractionForProgress: value => inverseProgressMap(mapProgress, value),
      }
    })() : {
      duration: SCENE3_DURATION,
      mapProgress: value => Math.max(0, Math.min(1, value)),
      fractionForProgress: value => Math.max(0, Math.min(1, value)),
    }
    const scene3Duration = sceneThreeTiming.duration
    const mapCurrentContactProgress = shortenCuriousToContact ? mapPreviewContactProgress : mapContactProgress
    const contactTiming = {
      duration: shortenCuriousToContact ? PREVIEW_CONTACT_DURATION : CONTACT_DURATION,
      mapProgress: mapCurrentContactProgress,
      fractionForProgress: value => inverseProgressMap(mapCurrentContactProgress, value),
    }
    const contactDuration = contactTiming.duration
    const aboutDuration = aboutIntroDuration + builderDuration + journeyDuration * journeyHandoff + scene3Duration + contactDuration
    const aboutIntroShare = aboutIntroDuration / aboutDuration
    const builderShare = builderDuration / aboutDuration
    const journeyShare = journeyDuration / aboutDuration
    const journeyStartShare = aboutIntroShare + builderShare
    const scene3StartShare = (aboutIntroDuration + builderDuration + journeyDuration * journeyHandoff) / aboutDuration
    const scene3Share = scene3Duration / aboutDuration
    const contactStartShare = scene3StartShare + scene3Share
    const scrollTotalDuration = aboutStart + aboutDuration
    const totalScrollDistance = Math.round(STAGE_SCROLL_DISTANCE * scrollTotalDuration)
    let initial = null
    const readInitial = () => {
      // During the loading handoff the window is intentionally fullscreen,
      // so use the measured Hero bounds captured by SculptureWindow instead
      // of treating the preview overlay as the permanent Hero viewport.
      try {
        const loaderInitial = windowElement.dataset.loaderInitial
        if (loaderInitial) {
          const parsed = JSON.parse(loaderInitial)
          if ([parsed.left, parsed.top, parsed.width, parsed.height].every(value => Number.isFinite(value))) return parsed
        }
      } catch {
        // Fall through to the live bounds if the diagnostic data is absent.
      }
      if (windowElement.dataset.loaderPreview === 'true') {
        const heroBox = hero.getBoundingClientRect()
        const preferredWidth = heroBox.width <= 640 ? 120 : 196
        const width = Math.min(preferredWidth, heroBox.width * 0.24)
        const height = width * 0.78
        const left = Math.max(12, Math.min(heroBox.width - width - 12, heroBox.width * 0.8 - width / 2))
        const top = Math.max(16, Math.min(heroBox.height * 0.32 - height, heroBox.height * 0.2 - height / 2))
        return { left: heroBox.left + left, top: heroBox.top + top, width, height }
      }
      const box = windowElement.getBoundingClientRect()
      return { left: box.left, top: box.top, width: box.width, height: box.height }
    }
    const state = { progress: 0 }
    const stageContext = {
      fluxDuration, aboutStart, aboutIntroDuration,
      builderDuration, journeyDuration, journeyHandoff,
      scene3Duration, contactDuration,
      mapBuilderProgress, journeyProgressToStage: journeyTiming.fractionForProgress,
    }
    const choreography = isChoreography ? createScrollChoreography({
      ...stageContext, projects, milestones, sourcePixelsPerUnit: STAGE_SCROLL_DISTANCE,
    }) : null
    const stages = choreography?.stages ?? (scrollMode === 'stages' ? createScrollStageSequence(stageContext) : null)
    const totalDuration = choreography ? stages[stages.length - 1].phase : scrollTotalDuration
    let stageController = null
    const publishHeroLifecycle = (heroProgress, writer = 'useCinematicScroll.render() → publishHeroLifecycle') => {
      const lifecycle = heroTechLifecycleRef?.current
      if (!lifecycle) return
      lifecycle.progress = heroProgress
      lifecycle.opacity = 1 - Math.min(heroProgress / 0.65, 1)
      lifecycle.active = lifecycle.opacity > 0
      lifecycle.entranceDiagnostics?.lifecycle(writer, { progress: lifecycle.progress, opacity: lifecycle.opacity, active: lifecycle.active })
      orbitDiagnostics?.updateLifecycle({ progress: lifecycle.progress, opacity: lifecycle.opacity, active: lifecycle.active })
      lifecycle.listeners.forEach(listener => listener(lifecycle))
    }
    const render = () => {
      // Temporary inspection freezes the normal controller too, after its
      // first Hero frame has been captured. In ordinary playback this is absent.
      if (windowElement.__handoffInspection?.frozen) return
      // Loader owns the clipping window and Orbit until its final frame has
      // been rendered. Keep the existing scroll timeline/section lengths.
      if (windowElement.dataset.loaderPreview === 'true') {
        heroTechLifecycleRef?.current?.entranceDiagnostics?.write('useCinematicScroll.render() returns while loader owns scene', {
          active: heroTechLifecycleRef.current.active, opacity: heroTechLifecycleRef.current.opacity,
        })
        return
      }
      const progress = state.progress
      const channels = choreography?.sample(progress)
      const heroProgress = Math.max(0, Math.min(progress / fluxDuration, 1))
      publishHeroLifecycle(heroProgress)
      const projectProgress = mapProjectProgress(progress - fluxDuration)
      const aboutProgress = Math.max(0, Math.min((progress - aboutStart) / aboutDuration, 1))
      const aboutIntroProgress = Math.max(0, Math.min(aboutProgress / aboutIntroShare, 1))
      const builderStageProgress = Math.max(0, Math.min((aboutProgress - aboutIntroShare) / builderShare, 1))
      const builderProgress = shortenBeyondToBuilderEntry || shortenBuilderRevealAndJourneyEntry
        ? mapBuilderStageProgress(builderStageProgress)
        : mapBuilderProgress(builderStageProgress)
      const journeyProgress = journeyTiming.mapProgress(Math.max(0, Math.min((aboutProgress - journeyStartShare) / journeyShare, 1)))
      const scene3Progress = sceneThreeTiming.mapProgress(Math.max(0, Math.min((aboutProgress - scene3StartShare) / scene3Share, 1)))
      const contactProgressRaw = Math.max(0, Math.min((aboutProgress - contactStartShare) / (1 - contactStartShare), 1))
      const contactProgress = contactTiming.mapProgress(contactProgressRaw)
      const cardsActive = scene3Progress > 0.001 && scene3Progress < 0.999
      if (scopeSceneFallback) {
        const projectOpacity = 1 - progressSmoothstep(projectProgress, 0.78, 0.98)
        const aboutOpacity = progressSmoothstep(aboutIntroProgress, 0.02, 0.56)
        const builderFade = progressSmoothstep(builderProgress, 0.5, 0.72)
        const fallbackVisible = Math.max(projectOpacity, aboutOpacity) * (1 - builderFade) > 0.001 && !cardsActive
        const visibleValue = fallbackVisible ? 'true' : 'false'
        if (windowElement.dataset.sceneFallbackVisible !== visibleValue) windowElement.dataset.sceneFallbackVisible = visibleValue
      }
      const curiousExit = Math.max(0, Math.min(contactProgress / 0.16, 1))
      let navigationTone = 0
      if (progress >= aboutStart) {
        if (aboutProgress < aboutIntroShare) {
          // Match the existing About veil while it fades from black to white.
          navigationTone = Math.max(0, Math.min(aboutIntroProgress / 0.55, 1))
        } else {
          const environmentProgress = Math.max(0, Math.min((contactProgress - 0.16) / 0.32, 1))
          navigationTone = 1 - environmentProgress
        }
      }
      let activeSection = ''
      if (progress >= fluxDuration) {
        if (projectProgress < projectSourceDuration) activeSection = 'work'
        else if (aboutProgress >= journeyStartShare && aboutProgress < scene3StartShare) activeSection = 'journey'
        else if (aboutProgress >= scene3StartShare && contactProgress < 0.16) activeSection = 'beyond'
        else if (contactProgress >= 0.16) activeSection = 'contact'
        else activeSection = 'about'
      }
      navControlRef.current?.setProgress?.({ progress, total: totalDuration, tone: navigationTone, activeSection })
      if (progress <= 0) {
        if (scopeSceneFallback && windowElement.dataset.sceneFallbackVisible !== 'true') windowElement.dataset.sceneFallbackVisible = 'true'
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
        heroTechLifecycleRef?.current?.entranceDiagnostics?.write('useCinematicScroll.render() → native title opacity', { opacity: 1 })
        inkControlRef.current?.setTransition(0)
        sceneControlRef.current?.setProgress(0)
        sceneControlRef.current?.setContactProgress?.(0)
        sceneControlRef.current?.setAboutProgress(0)
        sceneControlRef.current?.setAboutExit(0)
        projectsControlRef.current?.setProgress(0)
        aboutControlRef.current?.setProgress(0)
        aboutThreadsControlRef?.current?.setProgress(0)
        builderControlRef.current?.setProgress(0)
        if (aboutThreadsControlRef) windowElement.style.removeProperty('--builder-cover-transmission')
        journeyControlRef.current?.setProgress(0)
        scene3ControlRef.current?.setProgress(0)
        sceneControlRef.current?.setSceneThreeProgress?.(0)
        scene3ControlRef.current?.setContactExit?.(0)
        contactControlRef.current?.setProgress(0)
        navControlRef.current?.setProgress?.({ progress: 0, total: totalDuration, tone: 0, activeSection: '' })
        // At the initial Hero position the sculpture window is the original
        // black panel. The loader backdrop is separate and already removed.
        windowElement.style.backgroundColor = '#000'
        windowElement.style.zIndex = '5'
        windowElement.style.pointerEvents = 'auto'
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
      orbitDiagnostics?.writer('useCinematicScroll.render() → sculpture wrapper CSS variables', {
        progress, heroProgress, initial, viewportTarget: { left: viewportLeft, top: viewportTop, width, height }, localTarget: { x, y },
      })
      windowElement.style.setProperty('--sculpture-x', `${x}px`)
      windowElement.style.setProperty('--sculpture-y', `${y}px`)
      windowElement.style.setProperty('--sculpture-width', `${width}px`)
      windowElement.style.setProperty('--sculpture-height', `${height}px`)
      windowElement.style.maxWidth = 'none'
      windowElement.style.maxHeight = 'none'
      title.style.opacity = `${1 - Math.min(heroProgress / 0.65, 1)}`
      heroTechLifecycleRef?.current?.entranceDiagnostics?.write('useCinematicScroll.render() → native title opacity', { opacity: title.style.opacity })
      inkControlRef.current?.setTransition(Math.min(heroProgress / 0.2, 1))
      // Share the interpolated bounds with the scene only for uniform fitting;
      // the persistent WebGL canvas itself stays viewport-sized.
      sceneControlRef.current?.setViewport(width, height)
      sceneControlRef.current?.setProgress(heroProgress + projectProgress)
      sceneControlRef.current?.setContactProgress?.(contactProgress, channels?.helixLayout)
      sceneControlRef.current?.setAboutProgress(aboutIntroProgress)
      // Share production's original raw Builder-stage exit progress. Threads
      // controls only the background and does not retime the Orbit.
      sceneControlRef.current?.setAboutExit(builderStageProgress)
      projectsControlRef.current?.setProgress(projectProgress)
      // Map only the beginning of Builder onto the About handoff. The prior
      // linear multiplication made About's exit span the entire Builder
      // scene, allowing its remnants to show through Builder's later exit.
      const handoffProgress = Math.min(builderProgress / ABOUT_HANDOFF_PROGRESS, 1) * ABOUT_HANDOFF_PROGRESS
      const aboutControlProgress = Math.max(aboutIntroProgress + handoffProgress, progress >= aboutStart ? 0.0001 : 0)
      aboutControlRef.current?.setProgress(aboutControlProgress)
      aboutThreadsControlRef?.current?.setProgress(Math.min(aboutProgress / Math.max(journeyStartShare, 0.0001), 1))
      const builderCoverOpacity = builderControlRef.current?.setProgress(builderProgress, channels?.builder) ?? 0
      if (aboutThreadsControlRef) {
        // Match production's white-cover compositing without covering Threads.
        // Reuse BuilderScene's actual cover alpha, not a second timing curve.
        windowElement.style.setProperty('--builder-cover-transmission', `${1 - builderCoverOpacity}`)
      }
      journeyControlRef.current?.setProgress(journeyProgress, channels?.journey)
      scene3ControlRef.current?.setContactExit?.(curiousExit)
      scene3ControlRef.current?.setProgress(scene3Progress, channels?.sceneThree)
      sceneControlRef.current?.setSceneThreeProgress?.(scene3Progress, channels?.particle)
      // SceneThree owns an opaque DOM layer. Promote the persistent canvas
      // only for the card interval so its transparent background does not
      // hide the cards, while keeping Orbit/Helix behind the authored scene.
      windowElement.style.zIndex = cardsActive ? '12' : '5'
      windowElement.style.pointerEvents = cardsActive ? 'none' : 'auto'
      contactControlRef.current?.setProgress(channels?.contactTextOverride ? channels.contactText : contactProgress)
      const environmentProgress = Math.max(0, Math.min((contactProgress - 0.16) / 0.32, 1))
      if (environmentProgress > 0) {
        const shade = Math.round(255 * (1 - environmentProgress))
        windowElement.style.backgroundColor = `rgb(${shade}, ${shade}, ${shade})`
      } else {
        windowElement.style.backgroundColor = progress >= aboutStart ? 'transparent' : '#000'
      }
    }
    const timeline = gsap.timeline({ paused: true, onUpdate: render })
    if (stages) {
      timeline.addLabel('home', 0)
      stages.slice(1).forEach((stage, index) => {
        timeline.to(state, { progress: stage.phase, duration: stage.time - stages[index].time, ease: 'none' })
        timeline.addLabel(stage.id)
      })
    } else timeline.to(state, { progress: totalDuration, duration: totalDuration, ease: 'none' })
    const trigger = ScrollTrigger.create({
      trigger: hero, start: 'top top',
      end: stages ? () => `+=${Math.round(timeline.duration() * (choreography?.pixelsPerUnit ?? Math.max(220, Math.min(380, window.innerHeight * 0.38))))}` : `+=${totalScrollDistance}`,
      pin: true, scrub: stages && !choreography ? true : 0.55,
      invalidateOnRefresh: true,
      animation: timeline,
      onScrubComplete: choreography ? () => stageController?.settled() : undefined,
      onRefreshInit: self => {
        orbitDiagnostics?.note('ScrollTrigger refresh init', { progress: self?.progress, start: self?.start, end: self?.end })
        stageController?.cancel(); initial ??= readInitial()
      },
      onRefresh: self => {
        orbitDiagnostics?.note('ScrollTrigger refresh', { progress: self.progress, start: self.start, end: self.end })
        timeline.progress(self.progress); render()
      },
    })
    const destinations = {
        // Land inside established compositions, leaving their cinematic
        // entrances intact for natural scrolling.
        home: 0,
        // Selected Work's readable introduction hold, before Project 01.
        work: fluxDuration + INTRO_DURATION * 0.68,
        about: aboutStart + aboutIntroDuration * 0.82,
        // Journey's timeline reveal completes at .24 + .16 = .40. Production's
        // 2021 entrance is also complete (.36 + .03), before the 2023 transition.
        journey: aboutStart + aboutDuration * (journeyStartShare + journeyShare * journeyTiming.fractionForProgress(0.4)),
        // Use the middle of the completed reveal/exit interval. Exit is authored
        // in phase units, so normalize it before inverting the scene's time map.
        beyond: aboutStart + aboutDuration * (scene3StartShare + scene3Share * sceneThreeTiming.fractionForProgress((PREVIEW_REVEAL_END_PROGRESS + OPENING_EXIT_START / SCENE3_PROGRESS_SCALE) / 2)),
        contact: aboutStart + aboutDuration * (contactStartShare + (1 - contactStartShare) * 0.94),
    }
    if (stages) {
      const stageIds = { home: 'home', work: 'work', about: 'about',
        journey: stages.find(stage => stage.milestone === 0)?.id,
        beyond: choreography ? 'beyond-fill' : 'beyond-copy', contact: 'contact' }
      Object.entries(stageIds).forEach(([section, id]) => { destinations[section] = stages.find(stage => stage.id === id)?.phase })
      stageController = createScrollStageController({
        hero, stages, getPhase: () => state.progress,
        readScroll: () => trigger.scroll(),
        writeScroll: value => { trigger.scroll(value); ScrollTrigger.update() },
        getBounds: () => ({ start: trigger.start, end: trigger.end }),
        nativeRanges: choreography?.nativeRanges,
        isSettling: () => Boolean(choreography && trigger.getTween()?.isActive()),
        isReady: () => windowElement.dataset.loaderPreview !== 'true' && !windowElement.__handoffInspection?.frozen,
        resolveHash: hash => destinations[hash] ?? stages.find(stage => stage.id === hash)?.phase,
      })
    }
    navControlRef.current && (navControlRef.current.navigate = section => {
      const targetProgress = destinations[section]
      if (typeof targetProgress !== 'number') return
      if (stageController) { stageController.goToPhase(targetProgress, section); return }
      const timelineTarget = targetProgress / totalDuration
      window.scrollTo({ top: trigger.start + timelineTarget * (trigger.end - trigger.start), behavior: 'smooth' })
    })
    const releaseLoader = () => {
      // Resize/font changes may have updated the source Hero bounds while the
      // loader owned the viewport. Release against that latest measurement.
      orbitDiagnostics?.note('useCinematicScroll.releaseLoader() before render', {
        scrollY: window.scrollY, loaderInitial: windowElement.dataset.loaderInitial,
        cachedInitial: initial, currentWrapperStyle: windowElement.style.cssText,
      })
      initial = readInitial()
      render()
      orbitDiagnostics?.note('useCinematicScroll.releaseLoader() after render', {
        scrollY: window.scrollY, resolvedInitial: initial, currentWrapperStyle: windowElement.style.cssText,
        heroLifecycle: heroTechLifecycleRef?.current,
      })
    }
    windowElement.addEventListener('sculpture-loader-complete', releaseLoader)
    windowElement.addEventListener('sculpture-landing-change', releaseLoader)
    journeyControlRef.current?.setNavigate?.(value => {
      const target = Math.max(0, Math.min(1, value))
      if (stageController) { stageController.goToMilestone(target); return }
      const aboutTarget = journeyStartShare + journeyTiming.fractionForProgress(target) * journeyShare
      const timelineTarget = (aboutStart + aboutDuration * aboutTarget) / totalDuration
      window.scrollTo({ top: trigger.start + timelineTarget * (trigger.end - trigger.start), behavior: 'smooth' })
    })
    return () => {
      publishHeroLifecycle(1, 'useCinematicScroll effect cleanup → publishHeroLifecycle(1)')
      stageController?.dispose()
      windowElement.removeEventListener('sculpture-loader-complete', releaseLoader)
      windowElement.removeEventListener('sculpture-landing-change', releaseLoader)
      trigger.kill()
      timeline.kill()
      if (aboutThreadsControlRef) windowElement.style.removeProperty('--builder-cover-transmission')
      sceneControlRef.current?.setProgress(0)
      sceneControlRef.current?.setContactProgress?.(0)
      sceneControlRef.current?.setAboutExit(0)
      inkControlRef.current?.setTransition(0)
      projectsControlRef.current?.setProgress(0)
      aboutControlRef.current?.setProgress(0)
      aboutThreadsControlRef?.current?.setProgress(0)
      builderControlRef.current?.setProgress(0)
      journeyControlRef.current?.setProgress(0)
      scene3ControlRef.current?.setProgress(0)
      sceneControlRef.current?.setSceneThreeProgress?.(0)
      scene3ControlRef.current?.setContactExit?.(0)
      contactControlRef.current?.setProgress(0)
      if (navControlRef.current) {
        delete navControlRef.current.navigate
        navControlRef.current.setProgress?.({ progress: 0, total: totalDuration, tone: 0, activeSection: '' })
      }
      sceneControlRef.current?.setAboutProgress(0)
      title.style.opacity = ''
      windowElement.style.maxWidth = ''
      windowElement.style.maxHeight = ''
      windowElement.style.backgroundColor = ''
      windowElement.style.zIndex = '5'
      windowElement.style.pointerEvents = 'auto'
    }
  }, [heroRef, windowRef, titleRef, sceneControlRef, inkControlRef, projectsControlRef, aboutControlRef, builderControlRef, journeyControlRef, scene3ControlRef, contactControlRef, navControlRef, scrollMode, shortenHeroTransition, shortenFinalProjectToBeyond, shortenBeyondToBuilderEntry, shortenBuilderRevealAndJourneyEntry, shortenJourneyToBeyondReveal, scopeSceneFallback, shortenCuriousToContact, reducedMotion, heroTechLifecycleRef, orbitDiagnostics, aboutThreadsControlRef])
}
