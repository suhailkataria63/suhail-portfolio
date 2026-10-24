import {
  CODE_START, CODE_DURATION, FILL_START, FILL_DURATION,
  SUPPORT_START, SUPPORT_DURATION, OPENING_EXIT_START, OPENING_EXIT_DURATION,
  CONSTELLATION_START, CONSTELLATION_DURATION, FINAL_REVEAL_START,
  SCENE3_PROGRESS_SCALE,
} from './sceneThreeTiming'
import { mapContactProgress } from './contactTiming'

const clamp = value => Math.max(0, Math.min(1, value))
const inverse = (map, target) => {
  let low = 0, high = 1
  for (let i = 0; i < 32; i += 1) {
    const middle = (low + high) / 2
    if (map(middle) < target) low = middle
    else high = middle
  }
  return (low + high) / 2
}
const between = (phase, start, end) => clamp((phase - start) / (end - start))
const sample = (points, phase) => {
  if (phase <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i += 1) {
    if (phase > points[i][0]) continue
    const [start, from] = points[i - 1]
    const [end, to] = points[i]
    return from + (to - from) * between(phase, start, end)
  }
  return points[points.length - 1][1]
}

// Only the scroll-choreography preview uses this manifest. Phase coordinates
// remain those of the original pinned timeline; every pose is sampled from
// the same playhead (including reverse, native scrolling and anchor jumps).
export function createScrollChoreography({
  fluxDuration, aboutStart, aboutIntroDuration, builderDuration, journeyDuration,
  journeyHandoff, scene3Duration, contactDuration, mapBuilderProgress,
  journeyProgressToStage, projects, milestones, sourcePixelsPerUnit,
}) {
  const builderStart = aboutStart + aboutIntroDuration
  const journeyStart = builderStart + builderDuration
  const beyondStart = journeyStart + journeyDuration * journeyHandoff
  const contactStart = beyondStart + scene3Duration
  const builder = value => builderStart + builderDuration * inverse(mapBuilderProgress, value)
  const journey = value => journeyStart + journeyDuration * journeyProgressToStage(value)
  const beyond = phase => beyondStart + scene3Duration * phase / SCENE3_PROGRESS_SCALE
  const contact = value => contactStart + contactDuration * inverse(mapContactProgress, value)
  const stops = []
  const add = (id, label, phase, duration = 1, extra = {}) => {
    const stop = { id, label, phase, duration, playbackDuration: duration, ...extra }
    stops.push(stop)
    return phase
  }
  add('home', 'Hero', 0, 0)
  add('work', 'Hero to Selected Work', fluxDuration + 0.58, 1.6, { playbackDuration: 3 })
  projects.items.forEach((project, index) => {
    add(`project-${index + 1}`, project.title,
      fluxDuration + projects.intro + index * projects.step + projects.duration * 0.62, 1.25,
      { playbackDuration: 1.7 })
  })
  add('about-background', 'Black to white', aboutStart + aboutIntroDuration * 0.55, 1.15, { playbackDuration: 1.8 })
  add('about', 'Beyond the Code entry', builderStart, 1.05, { playbackDuration: 1.9 })
  add('about-exit', 'Beyond the Code exit', builder(0.16), 0.8, { playbackDuration: 1.8 })
  const builderEntry = add('builder-entry', 'Builder entry', builder(0.18 + 0.82 * 0.22), 1.1, { playbackDuration: 1.8 })
  const builderFill = add('builder-fill', 'Designing / Exploring fill and supporting copy', builder(0.7376), 1.15, { playbackDuration: 2.25 })
  add('builder-exit', 'Builder exit', journeyStart, 0.95, { playbackDuration: 1.8 })
  // .40 finishes the timeline entrance as well as the heading's .34 settle.
  // The first timestamp is deliberately kept hidden until its own gesture.
  const journeyHeading = add('journey-heading', 'Journey heading entry and settle', journey(0.4), 1.4, { playbackDuration: 2.25 })
  const timestampPoints = []
  milestones.forEach((milestone, index) => {
    const fraction = index / Math.max(1, milestones.length - 1)
    const phase = add(`journey-${milestone.year}`, `Journey: ${milestone.year}`,
      journey(0.5 + 0.38 * fraction), 1, { milestone: fraction, playbackDuration: 1.55 })
    timestampPoints.push([phase, fraction])
  })
  const firstTimestamp = timestampPoints[0]?.[0] ?? journeyHeading
  add('journey-exit', 'Journey exit', journey(1), 1, { playbackDuration: 1.8 })
  const beyondEntry = add('beyond-entry', 'More Than Just Code outlined entry', beyond(CODE_START + CODE_DURATION), 1.1, { playbackDuration: 1.8 })
  const beyondFill = add('beyond-fill', 'CODE fill / particle reveal / supporting copy', beyond(SUPPORT_START + SUPPORT_DURATION), 1.2, { playbackDuration: 2.3 })
  const beyondExit = add('beyond-exit', 'More Than Just Code exit', beyond(OPENING_EXIT_START + OPENING_EXIT_DURATION), 1, { playbackDuration: 1.8 })
  const toolsEntry = add('tools-entry', 'Tools entry / planet movement 50%', beyond(CONSTELLATION_START + CONSTELLATION_DURATION), 1.2, { playbackDuration: 2.5 })
  const toolsExit = add('tools-exit', 'Tools exit / planet movement 100%', beyond(FINAL_REVEAL_START), 1.1, { playbackDuration: 2.5 })
  const curiousEnd = add('curious-native-end', 'Always Curious (original native scroll)', contact(0.16), 1, { native: true })
  add('contact-environment', 'Helix enters / white to black', contact(0.48), 1.3, { playbackDuration: 2.3 })
  const marquee = add('contact-marquee', 'Make Ideas Real passage', contact(0.86), 1.8, { playbackDuration: 3.5 })
  const helix = add('contact-helix', 'Helix repositions', contact(0.94), 1.1, { playbackDuration: 2.2 })
  // Stop at the actual complete Contact pose, not the unused tail after the
  // piecewise contact map has already reached 1.
  const end = add('contact', 'Final contact reveal', contact(1), 1.2, { playbackDuration: 1.8 })

  // `duration` retains the pinned timeline's existing time weights and
  // therefore its scroll mapping. `playbackDuration` controls only how long
  // a deliberate gesture takes to reach that unchanged endpoint.
  // Native Curious keeps its original physical distance and .55 scrub.
  const pixelsPerUnit = 320
  let time = 0
  const stages = stops.map((stop, index) => {
    const weight = stop.native
      ? (stop.phase - stops[index - 1].phase) * sourcePixelsPerUnit / pixelsPerUnit
      : stop.duration
    // Make stops native CSS-pixel coordinates, so scroll rounding cannot
    // leave a fill/reveal fractionally unfinished at a checkpoint.
    time = Math.round((time + weight) * pixelsPerUnit) / pixelsPerUnit
    return { ...stop, time }
  })
  // Invert SceneThree's existing cubic ease at 50%; retain that ease rather
  // than substituting a new linear planet/orbit movement.
  const arrangementPoints = [[beyondExit, 0], [toolsEntry, 1 - Math.cbrt(0.5)], [toolsExit, 1]]
  const milestonePoints = timestampPoints.length ? timestampPoints : [[journeyHeading, 0]]
  const particlePoints = [[beyondEntry, 0], [beyondFill, (FILL_START + FILL_DURATION) / SCENE3_PROGRESS_SCALE],
    [beyondExit, (OPENING_EXIT_START + OPENING_EXIT_DURATION) / SCENE3_PROGRESS_SCALE]]
  const contactPoints = [[marquee, 0.86], [helix, 0.86], [end, 1]]
  return {
    stages, pixelsPerUnit,
    nativeRanges: [{ start: toolsExit, end: curiousEnd }],
    // Narrow channel overrides reuse the original scene renderers, normals,
    // keyframes and easing. No second scene timeline or animation loop.
    sample: phase => ({
      builder: {
        fill: between(phase, builderEntry, builderFill),
        reposition: between(phase, builderEntry, builderFill),
      },
      journey: {
        milestones: sample(milestonePoints, phase),
        firstMilestone: firstTimestamp > journeyHeading ? between(phase, journeyHeading, firstTimestamp) : 0,
      },
      sceneThree: {
        fill: between(phase, beyondEntry, beyondFill),
        support: between(phase, beyondEntry, beyondFill),
        arrangement: sample(arrangementPoints, phase),
        constellationExit: between(phase, toolsEntry, toolsExit),
        // Complete the authored stagger of every skill during the entry,
        // instead of leaving the later nodes half-revealed at the stop.
        constellationEntry: between(phase, beyondExit, toolsEntry),
      },
      particle: sample(particlePoints, phase),
      contactText: sample(contactPoints, phase),
      helixLayout: 0.86 + between(phase, marquee, helix) * 0.12,
      contactTextOverride: phase >= marquee,
    }),
  }
}
