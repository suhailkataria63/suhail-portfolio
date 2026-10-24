import { CatmullRomCurve3, Color, Vector3 } from 'three'
import { createInfinityCenterline, createInfinitySampling, infinityBandRoll } from './particleInfinityCurve'

const TAU = Math.PI * 2
const FRAME_SAMPLES = 512
const periodicDistance = (a, b) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b))
const curveBand = (t, center, width) => Math.exp(-((periodicDistance(t, center) / width) ** 2))

// A swept, self-overlapping loop, authored for the existing +Z camera.
// The two passages through the middle are separated in depth, not noise.
const centerline = new CatmullRomCurve3([
  new Vector3(-1.05, -0.32, 0.12),
  new Vector3(-0.74, -0.59, 0.4),
  new Vector3(0.06, -0.4, 0.54),
  new Vector3(0.84, 0.04, 0.32),
  new Vector3(0.95, 0.55, -0.1),
  new Vector3(0.38, 0.64, -0.4),
  new Vector3(-0.04, -0.35, -0.48),
  new Vector3(-0.68, 0.05, -0.28),
], true, 'centripetal')

export function makeRibbonParticleData(count, placementPositions, shape = 'ribbon') {
  const infinity = shape === 'infinity'
  const path = infinity ? createInfinityCenterline() : centerline
  const infinitySampling = infinity ? createInfinitySampling(path) : null
  let seed = 0x51f15e
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  // Three's closed Frenet frames use parallel transport between tangents and
  // distribute seam correction over the loop, avoiding frame flips.
  const frames = path.computeFrenetFrames(FRAME_SAMPLES, true)
  const axis = new Vector3()
  const baseNormal = new Vector3()
  const baseBinormal = new Vector3()
  const surface = (t, across, layer) => {
    const f = t * FRAME_SAMPLES
    const i = Math.floor(f) % FRAME_SAMPLES
    const blend = f - Math.floor(f)
    axis.copy(frames.tangents[i]).lerp(frames.tangents[i + 1], blend).normalize()
    baseNormal.copy(frames.normals[i]).lerp(frames.normals[i + 1], blend).normalize()
    baseBinormal.crossVectors(axis, baseNormal).normalize()
    baseNormal.crossVectors(baseBinormal, axis).normalize()
    // A full continuous turn plus a restrained local fold; closed at the seam.
    const twist = TAU * t + Math.sin(TAU * t) * 0.48 + Math.sin(TAU * t * 2 - 0.4) * 0.09 + 0.3
    const widthDirection = baseNormal.clone().multiplyScalar(Math.cos(twist))
      .addScaledVector(baseBinormal, Math.sin(twist))
    const normal = new Vector3().crossVectors(axis, widthDirection).normalize()
    const curvature = Math.min(1, frames.tangents[i].distanceTo(frames.tangents[i + 1]) * 32)
    if (infinity) {
      // The reference is a broad folded band, not a round cord. Start with a
      // camera-readable lateral direction perpendicular to the real tangent,
      // then roll the band smoothly through each lobe. The roll is periodic;
      // the crossover stays broad and the two branches remain depth-separated.
      widthDirection.set(-axis.y, axis.x, 0).normalize()
      normal.crossVectors(axis, widthDirection).normalize()
      const roll = infinityBandRoll(t)
      widthDirection.multiplyScalar(Math.cos(roll)).addScaledVector(normal, Math.sin(roll))
      normal.crossVectors(axis, widthDirection).normalize()
      // A shallow, closed oval section gives the band physical thickness and
      // softly rolled edges instead of an infinitely thin, two-sided sheet.
      const angle = across * Math.PI
      const radius = 0.18 + 0.018 * Math.cos(TAU * t * 2)
      const depthRadius = 0.045 + 0.009 * Math.sin(TAU * t) ** 2
      const surfaceNormal = widthDirection.clone().multiplyScalar(Math.cos(angle) / radius)
        .addScaledVector(normal, Math.sin(angle) / depthRadius).normalize()
      const point = path.getPointAt(t)
        .addScaledVector(widthDirection, Math.cos(angle) * radius)
        .addScaledVector(normal, Math.sin(angle) * depthRadius)
        .addScaledVector(surfaceNormal, layer)
      return { point, normal: surfaceNormal, curvature }
    }
    // A gentle waist clears the inner negative space at the rear crossing;
    // broader outer sweeps keep the two lobes connected as one ribbon.
    const width = 0.255 + 0.05 * Math.cos(TAU * t * 2 + 0.6) - curveBand(t, 0.73, 0.095) * 0.027
    const crown = (1 - across * across) * 0.018
    const point = path.getPointAt(t)
      .addScaledVector(widthDirection, across * width)
      .addScaledVector(normal, layer + crown)
    // Approximate curvature from neighboring transported tangents. Adjust the
    // transverse normal for the shallow physical crown across the surface.
    normal.addScaledVector(widthDirection, across * 0.036 / width).normalize()
    return { point, normal, curvature }
  }
  const palette = ['#151d2a', '#1b304c', '#496a90', '#9aa8bb', '#5b93ef'].map(hex => new Color(hex))
  const samples = []
  for (let i = 0; i < count; i += 1) {
    const category = random()
    const dust = category > 0.95
    const core = category < 0.2
    const edge = !dust && category >= 0.2 && category < 0.27
    // The original ribbon keeps its existing core distribution and random
    // draws. Infinity uses one smooth density field for every particle type.
    let t = (i + random()) / count
    if (core) {
      const coreT = ((random() < 0.55 ? 0.23 : 0.73) + (random() + random() + random() - 1.5) * 0.075 + 1) % 1
      if (!infinity) t = coreT
    }
    if (infinitySampling) t = infinitySampling.along(t)
    const acrossQuantile = random()
    let across = (acrossQuantile * 2 - 1)
    if (core) across *= 0.7
    if (edge) across = 0.9 + Math.sqrt(random()) * 0.1
    if (infinitySampling) across = infinitySampling.across(t, acrossQuantile)
    const layer = core ? (random() - 0.5) * 0.055 : (random() < 0.5 ? -0.012 : 0.012)
    const { point, normal, curvature } = surface(t, across, layer)
    if (dust) point.addScaledVector(normal, (random() - 0.5) * 0.16)
    // Highlight is a continuous property of the real positive-width edge,
    // including nearby surface grains. Sampling adds detail, not a detached
    // line. A broad key catch and a much weaker rear catch avoid an outline.
    const edgeWindow = curveBand(t, 0.28, 0.18) + curveBand(t, 0.8, 0.065) * 0.16
    const edgeFalloff = Math.exp(-(((1 - across) / 0.085) ** 2))
    const highlight = dust || core ? 0 : Math.min(1, edgeWindow * edgeFalloff) * (0.84 + random() * 0.16)
    const tone = random()
    const bodyColor = core ? palette[0] : tone < 0.56 ? palette[0] : tone < 0.91 ? palette[1] : palette[2]
    const color = bodyColor.clone().lerp(tone < 0.86 ? palette[3] : palette[4], highlight * 0.72)
    samples.push({ point, normal, color, curvature, highlight, dust, core,
      size: dust ? 0.68 + random() * 0.27 : (1.08 + random() * 0.5) * (1 + highlight * 0.12),
      seeds: [random(), random(), random()],
    })
  }

  // The original ribbon retains its exact pre-existing raw local envelope.
  // The preview fits inside that same envelope, preserving the lemniscate's
  // rounded XY proportions after the existing shader expansion.
  const min = new Vector3(Infinity, Infinity, Infinity)
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  const oldMin = min.clone()
  const oldMax = max.clone()
  for (const { point } of samples) { min.min(point); max.max(point) }
  const reference = new Vector3()
  for (let i = 0; i < placementPositions.length; i += 3) {
    reference.fromArray(placementPositions, i)
    oldMin.min(reference); oldMax.max(reference)
  }
  const fit = oldMax.clone().sub(oldMin).divide(max.clone().sub(min))
  const shaderExpansion = new Vector3(1.25, 1.16, 1)
  const sourceCenter = min.clone().add(max).multiplyScalar(0.5)
  const targetCenter = oldMin.clone().add(oldMax).multiplyScalar(0.5)
  if (infinity) {
    const screenPlaneFit = Math.min(fit.x * shaderExpansion.x, fit.y * shaderExpansion.y)
    fit.x = screenPlaneFit / shaderExpansion.x
    fit.y = screenPlaneFit / shaderExpansion.y
  }
  for (const sample of samples) {
    if (infinity) sample.point.sub(sourceCenter).multiply(fit).add(targetCenter)
    else sample.point.sub(min).multiply(fit).add(oldMin)
    // Inverse-transpose for anisotropic envelope fitting and the existing
    // shader x/y expansion. Mobile adds another inverse scale in the shader.
    sample.normal.divide(fit).divide(shaderExpansion).normalize()
  }
  // The fixed camera looks down -Z: draw rear grains before front grains.
  samples.sort((a, b) => a.point.z - b.point.z)
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count * 3)
  const surfaceData = new Float32Array(count * 4)
  const sizes = new Float32Array(count)
  samples.forEach((sample, i) => {
    const offset = i * 3
    sample.point.toArray(positions, offset)
    sample.normal.toArray(normals, offset)
    sample.color.toArray(colors, offset)
    seeds.set(sample.seeds, offset)
    surfaceData.set([sample.highlight, sample.dust ? 1 : 0, sample.core ? 1 : 0, sample.curvature], i * 4)
    sizes[i] = sample.size
  })
  return { positions, normals, colors, seeds, surfaceData, sizes }
}
