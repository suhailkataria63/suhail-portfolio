import {
  CODE_DURATION,
  CODE_START,
  FILL_DURATION,
  SCENE3_PROGRESS_SCALE,
  SUPPORT_DURATION,
  SUPPORT_START,
} from './sceneThreeTiming'

// Preview-only boundary: the first gesture ends at the completed, outlined
// headline. The second gesture completes the existing fills, particle reveal,
// and supporting copy before the authored section exit begins.
export const OUTLINED_HEADLINE_END_PHASE = CODE_START + CODE_DURATION
export const PREVIEW_FILL_START_PHASE = OUTLINED_HEADLINE_END_PHASE
const PREVIEW_TEXT_REVEAL_END_PHASE = Math.max(
  PREVIEW_FILL_START_PHASE + FILL_DURATION,
  SUPPORT_START + SUPPORT_DURATION,
)
const PARTICLE_FORMATION_COVERAGE = 0.85

export const PREVIEW_PARTICLE_REVEAL = {
  startPhase: OUTLINED_HEADLINE_END_PHASE,
  // Let the existing particles form across most of the approved reveal span,
  // while leaving a short settled interval before the scene reaches its
  // shared reveal endpoint. Text and subtext timing remain independent.
  duration: (PREVIEW_TEXT_REVEAL_END_PHASE - OUTLINED_HEADLINE_END_PHASE) * PARTICLE_FORMATION_COVERAGE,
  fillStartPhase: PREVIEW_FILL_START_PHASE,
}

export const PREVIEW_REVEAL_END_PHASE = Math.max(
  PREVIEW_TEXT_REVEAL_END_PHASE,
  PREVIEW_PARTICLE_REVEAL.startPhase + PREVIEW_PARTICLE_REVEAL.duration,
)

export const OUTLINED_HEADLINE_END_PROGRESS = OUTLINED_HEADLINE_END_PHASE / SCENE3_PROGRESS_SCALE
export const PREVIEW_REVEAL_END_PROGRESS = PREVIEW_REVEAL_END_PHASE / SCENE3_PROGRESS_SCALE
export const JOURNEY_TO_BEYOND_STAGE_UNITS = 0.25
