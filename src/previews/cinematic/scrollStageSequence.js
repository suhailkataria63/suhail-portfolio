import {
  ARRANGEMENT_DURATION, ARRANGEMENT_START, CODE_DURATION, CODE_START,
  CONSTELLATION_DURATION, CONSTELLATION_START, FILL_DURATION, FILL_START,
  OPENING_EXIT_START, SCENE3_PROGRESS_SCALE, SUPPORT_DURATION, SUPPORT_START,
} from './sceneThreeTiming'
import { mapContactProgress } from './contactTiming'

const invert = (map, target) => {
  let low = 0, high = 1
  for (let i = 0; i < 30; i += 1) {
    const middle = (low + high) / 2
    if (map(middle) < target) low = middle
    else high = middle
  }
  return (low + high) / 2
}

// Stops are in the ORIGINAL scene-progress coordinate system. No scene's
// animation formulas, relative overlaps, typography, or R3F poses are changed.
// Durations below are preview input-response times, not new scene keyframes.
export function createScrollStageSequence({
  fluxDuration, aboutStart, aboutIntroDuration, builderDuration,
  journeyDuration, journeyHandoff, scene3Duration, contactDuration,
  mapBuilderProgress, journeyProgressToStage,
}) {
  const builderStart = aboutStart + aboutIntroDuration
  const journeyStart = builderStart + builderDuration
  const beyondStart = journeyStart + journeyDuration * journeyHandoff
  const contactStart = beyondStart + scene3Duration
  const builder = progress => builderStart + builderDuration * invert(mapBuilderProgress, progress)
  const journey = progress => journeyStart + journeyDuration * journeyProgressToStage(progress)
  const beyond = phase => beyondStart + scene3Duration * phase / SCENE3_PROGRESS_SCALE
  const contact = progress => contactStart + contactDuration * invert(mapContactProgress, progress)
  const stops = []
  const add = (id, label, phase, duration = 0.9, extra = {}) => stops.push({ id, label, phase, duration, ...extra })

  add('home', 'Hero', 0, 0)
  add('hero-exit', 'Hero exit / Orbit expands', fluxDuration, 1.1)
  add('work', 'Selected Work entrance / horizontal Orbit', fluxDuration + 0.48, 0.9)
  add('work-hold', 'Selected Work reading hold', fluxDuration + 0.58, 0.28)
  for (let index = 0; index < 3; index += 1) {
    const start = fluxDuration + 1 + index * 0.82
    add(`project-${index + 1}-entry`, `${index ? 'Previous project exit / ' : 'Selected Work exit / '}Project ${index + 1} entrance`, start + 0.37, 1.1)
    add(`project-${index + 1}-settled`, `Project ${index + 1} depth presentation settles`, start + 0.62, 0.65)
  }
  add('about-background', 'Final project exit / black-to-white reveal / Orbit returns', aboutStart + aboutIntroDuration * 0.55, 1.15)
  add('about', 'Beyond the Code introduction / Orbit moves right', aboutStart + aboutIntroDuration * 0.82, 0.9)
  add('about-hold', 'About introduction reading hold', builderStart, 0.28)
  add('builder-entry', 'About exit / Builder statement entrance', builder(0.18 + 0.82 * 0.22), 1.05)
  add('builder-fill', 'Builder outline text fills', builder(0.18 + 0.82 * 0.48), 0.85)
  add('builder-settled', 'Builder statement settles / biography appears', builder(0.7376), 0.8)
  add('builder-hold', 'Builder reading hold', builder(0.18 + 0.82 * 0.78), 0.28)
  add('journey-entry', 'Builder exit / Journey heading entrance', journey(0.18), 1.05)
  add('journey-heading', 'Journey heading shrinks / timeline enters', journey(0.34), 0.8)
  const years = ['2021', '2023', '2024', '2025', '2026', '2027']
  years.forEach((year, index) => {
    // First detail's strongest readable pose occurs just before its existing
    // .72 segment crossfade. Other years stop inside their established holds.
    const progress = index === 0 ? 0.36 + 0.52 * 0.72 / 5
      : index === 5 ? 0.88 : 0.36 + 0.52 * (index + 0.18) / 5
    add(`journey-${year}`, `Journey: ${year} milestone`, journey(progress), 0.85, { milestone: index / 5 })
  })
  add('journey-hold', 'Final Journey milestone reading hold', journey(0.97), 0.3)
  add('beyond-entry', 'Journey exit / More Than Just Code and particles enter', beyond(CODE_START + CODE_DURATION), 1.1)
  add('beyond-fill', 'CODE and particle color fill', beyond(FILL_START + FILL_DURATION), 0.9)
  add('beyond-copy', 'Beyond supporting copy reveal', beyond(SUPPORT_START + SUPPORT_DURATION), 0.75)
  add('beyond-hold', 'Beyond headline and sculpture hold', beyond(OPENING_EXIT_START), 0.28)
  add('constellation-entry', 'Beyond exit / constellation and copy reveal', beyond(CONSTELLATION_START + CONSTELLATION_DURATION), 1.25)
  add('constellation-settled', 'Constellation arrangement completes', beyond(ARRANGEMENT_START + ARRANGEMENT_DURATION), 0.8)
  add('always-curious', 'Constellation exit / Always Curious entrance', contactStart, 1.0)
  // Curious's exit and the following environment reveal are contiguous;
  // parking at Contact .16 would strand the visitor on an empty white frame.
  add('contact-environment', 'Always Curious exit / white-to-black reveal / helix enters', contact(0.48), 1.3)
  add('contact-hold', 'Contact helix / black reading hold', contact(0.6), 0.3)
  add('contact-marquee', 'Make Ideas Real marquee passage and exit', contact(0.86), 1.8)
  add('contact', 'Contact headline, copy, links and helix settle', contactStart + contactDuration, 1.1)

  let time = 0
  return stops.map((stop, index) => {
    if (index) time += stop.duration
    return { ...stop, time }
  })
}

export function stageTimeForPhase(stages, phase) {
  if (phase <= stages[0].phase) return 0
  for (let i = 1; i < stages.length; i += 1) {
    if (phase > stages[i].phase) continue
    const previous = stages[i - 1]
    const next = stages[i]
    return previous.time + (next.time - previous.time) * (phase - previous.phase) / (next.phase - previous.phase)
  }
  return stages[stages.length - 1].time
}
