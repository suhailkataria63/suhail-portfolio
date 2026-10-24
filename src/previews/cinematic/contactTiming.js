// Contact keeps the marquee and final reveal distances from the original
// 5.8-unit scene while compressing only the pre-marquee handoff.
export const CONTACT_BASE_DURATION = 5.8
export const CONTACT_HANDOFF_UNITS = CONTACT_BASE_DURATION * 0.16
export const CONTACT_PRE_MARQUEE_UNITS = 2.467
export const CONTACT_MARQUEE_UNITS = CONTACT_BASE_DURATION * 0.26
export const CONTACT_POST_MARQUEE_UNITS = CONTACT_BASE_DURATION * 0.14
export const CONTACT_DURATION = CONTACT_HANDOFF_UNITS + CONTACT_PRE_MARQUEE_UNITS + CONTACT_MARQUEE_UNITS + CONTACT_POST_MARQUEE_UNITS

const PRE_MARQUEE_MIDDLE_UNITS = CONTACT_PRE_MARQUEE_UNITS - CONTACT_HANDOFF_UNITS

// The incremental preview gives the Curious exit/helix teaser and the helix
// centering their own short, continuous scroll spans. The marquee keeps a
// longer span for legibility, while the authored final contact reveal retains
// its original post-marquee allocation.
const PREVIEW_CURIOUS_TO_TEASER_UNITS = 0.25
const PREVIEW_TEASER_TO_CENTER_UNITS = 0.25
const PREVIEW_MARQUEE_UNITS = 0.75
const PREVIEW_CONTACT_SEGMENTS = [
  // .28 is 37.5% through the existing .16-.48 background/helix entrance.
  { start: 0, end: 0.28, units: PREVIEW_CURIOUS_TO_TEASER_UNITS },
  // .6 lands on black with the helix fully entered and the marquee still offscreen.
  { start: 0.28, end: 0.6, units: PREVIEW_TEASER_TO_CENTER_UNITS },
  { start: 0.6, end: 0.86, units: PREVIEW_MARQUEE_UNITS },
  { start: 0.86, end: 1, units: CONTACT_POST_MARQUEE_UNITS },
]
export const PREVIEW_CONTACT_DURATION = PREVIEW_CONTACT_SEGMENTS.reduce((total, segment) => total + segment.units, 0)

export function mapContactProgress(progress) {
  const value = Math.max(0, Math.min(1, progress))
  const elapsed = value * CONTACT_DURATION
  const handoffEnd = CONTACT_HANDOFF_UNITS
  const preMarqueeEnd = CONTACT_PRE_MARQUEE_UNITS
  const marqueeEnd = preMarqueeEnd + CONTACT_MARQUEE_UNITS
  if (elapsed <= handoffEnd) return elapsed / CONTACT_BASE_DURATION
  if (elapsed <= preMarqueeEnd) {
    return 0.16 + ((elapsed - handoffEnd) / PRE_MARQUEE_MIDDLE_UNITS) * 0.44
  }
  if (elapsed <= marqueeEnd) {
    return 0.6 + ((elapsed - preMarqueeEnd) / CONTACT_MARQUEE_UNITS) * 0.26
  }
  return 0.86 + ((elapsed - marqueeEnd) / CONTACT_POST_MARQUEE_UNITS) * 0.14
}

export function mapPreviewContactProgress(progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * PREVIEW_CONTACT_DURATION
  let segmentStart = 0

  for (let index = 0; index < PREVIEW_CONTACT_SEGMENTS.length; index += 1) {
    const segment = PREVIEW_CONTACT_SEGMENTS[index]
    const segmentEnd = segmentStart + segment.units
    if (elapsed <= segmentEnd || index === PREVIEW_CONTACT_SEGMENTS.length - 1) {
      const segmentProgress = segment.units > 0 ? (elapsed - segmentStart) / segment.units : 1
      return segment.start + Math.max(0, Math.min(1, segmentProgress)) * (segment.end - segment.start)
    }
    segmentStart = segmentEnd
  }

  return 1
}
