const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)

// Keep the original wave as a one-value baseline so the active treatment can
// be tuned without changing the scroll choreography.
export const waveStandUpBaseline = Object.freeze({
  waveIntensity: 1,
  waveTravel: 1,
  waveDepth: 1,
})

export const waveStandUpConfig = {
  waveIntensity: 1.45,
  waveTravel: 1.45,
  waveDepth: 1.45,
}

// Preserved from the original Contact headline entrance for reuse in a
// future section. It intentionally remains separate from the current
// stand-up treatment.
export function depthMaterialize(progress, start = 0.86, duration = 0.1) {
  const amount = ease(clamp((progress - start) / duration))
  return {
    amount,
    opacity: 0.02 + amount * 0.98,
    filter: `blur(${((1 - amount) * 7).toFixed(2)}px)`,
    transform: `perspective(900px) translateZ(${((1 - amount) * -180).toFixed(2)}px) rotateX(${((1 - amount) * 24).toFixed(2)}deg) rotateY(${((1 - amount) * -18).toFixed(2)}deg) scale3d(${(0.78 + amount * 0.22).toFixed(4)}, ${(0.92 + amount * 0.08).toFixed(4)}, 1)`,
  }
}

export function rigidStandUp(progress, index, start = 0.86) {
  const amount = ease(clamp((progress - (start + index * 0.012)) / 0.06))
  return {
    amount,
    opacity: 0.14 + amount * 0.86,
    transform: `translate3d(0, ${((1 - amount) * 20).toFixed(2)}px, ${((1 - amount) * -24).toFixed(2)}px) rotateX(${((1 - amount) * -82).toFixed(2)}deg)`,
  }
}

// Character-level version of the stand-up motion. The small phase offset
// between adjacent characters creates a travelling fold while the sine term
// adds a restrained, continuous surface curvature that resolves to zero.
export function waveStandUp(progress, lineIndex, characterIndex, characterCount, start = 0.86) {
  const lineStart = start + lineIndex * 0.012
  const characterStart = lineStart + characterIndex * 0.002 * waveStandUpConfig.waveTravel
  const characterDuration = 0.04 / (0.75 + waveStandUpConfig.waveTravel * 0.25)
  const amount = ease(clamp((progress - characterStart) / characterDuration))
  const curve = characterCount > 1 ? Math.sin((characterIndex / (characterCount - 1)) * Math.PI) : 0
  const remaining = 1 - amount
  const intensity = waveStandUpConfig.waveIntensity
  const depth = waveStandUpConfig.waveDepth
  return {
    amount,
    opacity: 0.14 + amount * 0.86,
    transform: `translate3d(0, ${(remaining * (20 * depth + curve * 2 * intensity)).toFixed(2)}px, ${(remaining * (-24 * depth + curve * 5 * depth)).toFixed(2)}px) rotateY(${(remaining * curve * 4 * intensity).toFixed(2)}deg) rotateX(${(remaining * -82).toFixed(2)}deg)`,
  }
}

// Kept as a compatibility alias for callers that used the earlier name.
export const standUpLine = rigidStandUp
