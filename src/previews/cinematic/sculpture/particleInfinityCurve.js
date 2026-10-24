import { Curve, Vector3 } from 'three'

const TAU = Math.PI * 2

// A single periodic Gerono lemniscate. The two projected center crossings
// occur at t=0 and t=.5, separated by .64 world units along Z. The foreground
// branch sweeps diagonally down-right in screen space, like the reference's
// folded band. Both rounded lobes belong to this same smooth, closed path.
class InfinityCurve extends Curve {
  constructor() {
    super()
    this.arcLengthDivisions = 1024
    this.horizontalRadius = 1.22
    this.verticalRadius = 0.45
  }

  getPoint(t, target = new Vector3()) {
    const angle = t * TAU
    return target.set(this.horizontalRadius * Math.sin(angle), -this.verticalRadius * Math.sin(2 * angle), 0.32 * Math.cos(angle))
  }

  getTangent(t, target = new Vector3()) {
    const angle = t * TAU
    return target.set(this.horizontalRadius * Math.cos(angle), -2 * this.verticalRadius * Math.cos(2 * angle), -0.32 * Math.sin(angle)).normalize()
  }
}

export const createInfinityCenterline = () => new InfinityCurve()

export const infinityBandRoll = t => 0.62 * Math.sin(TAU * t * 2) + 0.18 * Math.cos(TAU * t)

// Precompute continuous probability distributions once during geometry setup.
// Inverse-CDF sampling redistributes exactly the existing particle budget;
// there is no rejection loop, runtime resampling, or opacity-based masking.
export function createInfinitySampling(path) {
  const alongSegments = 512
  const acrossSegments = 64
  const stride = acrossSegments + 1
  const alongCdf = new Float64Array(alongSegments + 1)
  const acrossCdf = new Float32Array((alongSegments + 1) * stride)
  const point = new Vector3()
  const tangent = new Vector3()
  const lateral = new Vector3()
  const normal = new Vector3()
  const inward = new Vector3()
  let previousWeight = 0

  for (let row = 0; row <= alongSegments; row += 1) {
    const t = row / alongSegments
    path.getPointAt(t, point)
    path.getTangentAt(t, tangent)
    const relativeX = point.x / path.horizontalRadius
    // A nonzero floor keeps both tips connected and airy. The broad middle
    // weighting avoids the previous separate pile of core particles at t=0/.5.
    const weight = 0.3 + 0.7 * Math.max(0, 1 - relativeX * relativeX)
      + 0.4 * Math.exp(-((relativeX / 0.35) ** 2))
    if (row > 0) alongCdf[row] = alongCdf[row - 1] + (previousWeight + weight) * 0.5
    previousWeight = weight

    // Use the same rolled frame as the actual band. Aim toward each loop's
    // opening, smoothly merging the two cavity centers through the crossover.
    lateral.set(-tangent.y, tangent.x, 0).normalize()
    normal.crossVectors(tangent, lateral).normalize()
    const roll = infinityBandRoll(t)
    lateral.multiplyScalar(Math.cos(roll)).addScaledVector(normal, Math.sin(roll))
    inward.set(path.horizontalRadius * 0.6 * Math.tanh(relativeX / 0.18) - point.x, -point.y, 0).normalize()
    // The inward side changes between the two openings. Fade that preference
    // to zero at the waist so its direction cannot jump at either crossing.
    const inwardBias = lateral.dot(inward) * (1 - Math.exp(-((relativeX / 0.25) ** 2)))
    const density = fraction => {
      const angle = (fraction * 2 - 1) * Math.PI
      // Dense broad faces/middle, a restrained inward-facing bias, and soft
      // sparse edges. The periodic profile never cuts off either surface.
      return 0.28 + 0.64 * Math.sin(angle) ** 2 + 0.2 * (1 + inwardBias * Math.cos(angle))
    }
    const offset = row * stride
    let previousDensity = density(0)
    for (let column = 1; column <= acrossSegments; column += 1) {
      const nextDensity = density(column / acrossSegments)
      acrossCdf[offset + column] = acrossCdf[offset + column - 1] + (previousDensity + nextDensity) * 0.5
      previousDensity = nextDensity
    }
    const total = acrossCdf[offset + acrossSegments]
    for (let column = 1; column <= acrossSegments; column += 1) acrossCdf[offset + column] /= total
  }
  const total = alongCdf[alongSegments]
  for (let row = 1; row <= alongSegments; row += 1) alongCdf[row] /= total

  const invert = (quantile, segments, read) => {
    let low = 0
    let high = segments
    while (high - low > 1) {
      const middle = (low + high) >> 1
      if (read(middle) <= quantile) low = middle
      else high = middle
    }
    const start = read(low)
    return (low + (quantile - start) / (read(high) - start)) / segments
  }
  return {
    along: quantile => invert(quantile, alongSegments, index => alongCdf[index]),
    across: (t, quantile) => {
      const row = Math.min(Math.floor(t * alongSegments), alongSegments - 1)
      const blend = t * alongSegments - row
      const offset = row * stride
      const fraction = invert(quantile, acrossSegments, column => {
        const a = acrossCdf[offset + column]
        return a + (acrossCdf[offset + stride + column] - a) * blend
      })
      return fraction * 2 - 1
    },
  }
}
