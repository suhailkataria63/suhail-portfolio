import { Color, Vector3 } from 'three'

const palette = {
  navy: new Color('#101a2a'),
  ink: new Color('#1b2b43'),
  steel: new Color('#456487'),
  silver: new Color('#9aaabd'),
  ice: new Color('#6e9fdb'),
}

function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function gaussian(random) {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-6))) * Math.cos(Math.PI * 2 * random())
}

function rotate(point, x, y, z) {
  const cx = Math.cos(x); const sx = Math.sin(x)
  const cy = Math.cos(y); const sy = Math.sin(y)
  const cz = Math.cos(z); const sz = Math.sin(z)
  const afterX = new Vector3(point.x, point.y * cx - point.z * sx, point.y * sx + point.z * cx)
  const afterY = new Vector3(afterX.x * cy + afterX.z * sy, afterX.y, -afterX.x * sy + afterX.z * cy)
  return new Vector3(afterY.x * cz - afterY.y * sz, afterY.x * sz + afterY.y * cz, afterY.z)
}

function torusSample(random) {
  const kindRoll = random()
  const dust = kindRoll > 0.99
  const primary = kindRoll < 0.72
  const layer = kindRoll >= 0.72 && kindRoll < 0.98
  let phi = random() * Math.PI * 2
  phi += 0.1 * Math.sin(phi * 3 + 0.35)
  const lane = Math.floor(random() * 6)
  const pitch = layer ? (lane < 3 ? -2 : 3) : lane < 4 ? 3 : -2
  // Twelve interleaved helical currents wind through the tube volume. A narrow
  // cross-section spread keeps each current visible instead of randomizing it
  // back into a uniform donut.
  const theta = primary || layer
    ? pitch * phi + lane * Math.PI / 3 + gaussian(random) * 0.075
    : random() * Math.PI * 2
  const organic = Math.sin(phi * 3 + theta * 0.7) * 0.026 + Math.cos(phi * 5 - 0.4) * 0.014
  const major = (layer ? 0.58 : 0.53) + organic
  const tube = primary || layer
    ? (layer ? 0.145 : 0.17) + gaussian(random) * (layer ? 0.014 : 0.018)
    : (layer ? 0.145 : 0.205) * (1 + 0.1 * Math.sin(phi * 4 + theta))
  const loose = dust ? 0.1 + random() * 0.18 : 0
  const radial = major + (tube * Math.cos(theta)) + loose
  const point = new Vector3(radial * Math.cos(phi), radial * Math.sin(phi), tube * Math.sin(theta))
  const normal = new Vector3(Math.cos(theta) * Math.cos(phi), Math.cos(theta) * Math.sin(phi), Math.sin(theta))
  // Tangent to each helical current. Keeping this direction with the point lets
  // the vertex shader animate along the designed path rather than adding world
  // space noise that broadens the torus into a cloud.
  const radialRate = (primary || layer) ? -tube * Math.sin(theta) * pitch : 0
  const flow = new Vector3(
    radialRate * Math.cos(phi) - radial * Math.sin(phi),
    radialRate * Math.sin(phi) + radial * Math.cos(phi),
    (primary || layer) ? tube * Math.cos(theta) * pitch : 0,
  ).normalize()
  const tiltedPoint = rotate(point, -0.48 + 0.025 * Math.sin(phi * 2), 0.27, 0.02)
  const tiltedNormal = rotate(normal, -0.48, 0.27, 0.02).normalize()
  const tiltedFlow = rotate(flow, -0.48, 0.27, 0.02).normalize()
  return {
    point: tiltedPoint,
    normal: tiltedNormal,
    flow: tiltedFlow,
    motion: [phi / (Math.PI * 2), theta / (Math.PI * 2)],
    // Six current IDs are reused by both interleaved spiral layers.
    track: primary || layer ? lane : 6,
    dust,
    core: false,
    primary: primary || layer,
    layer,
    highlight: Math.pow(Math.max(0, Math.sin(theta + 0.45)), 7) * (layer ? 0.54 : primary ? 0.82 : 0.68),
  }
}

const gyroscopeTracks = [
  // The five distinct ellipses from the earlier, clearer structure remain the
  // silhouette anchors; width is a narrow Gaussian band around each curve.
  { rx: 0.69, ry: 0.59, tilt: [0.34, -0.18, 0.04], width: 0.018 },
  { rx: 0.61, ry: 0.68, tilt: [-0.62, 0.2, -0.15], width: 0.016 },
  { rx: 0.75, ry: 0.42, tilt: [0.84, 0.13, 0.16], width: 0.013 },
  { rx: 0.52, ry: 0.7, tilt: [0.18, 0.72, 0.07], width: 0.006 },
  { rx: 0.73, ry: 0.51, tilt: [-0.26, -0.62, -0.12], width: 0.004 },
]

function chooseGyroscopeTrack(random) {
  const value = random()
  if (value < 0.29) return 0
  if (value < 0.54) return 1
  if (value < 0.75) return 2
  if (value < 0.89) return 3
  return 4
}

function gyroscopeSample(random) {
  const core = random() < 0.03
  const dust = !core && random() > 0.985
  const track = chooseGyroscopeTrack(random)
  const orbit = gyroscopeTracks[track]
  if (core) {
    const point = new Vector3(gaussian(random) * 0.065, gaussian(random) * 0.065, gaussian(random) * 0.08)
    const normal = point.lengthSq() > 1e-6 ? point.clone().normalize() : new Vector3(0, 0, 1)
    return { point, normal, flow: new Vector3(), motion: [0, 0], track: 5, dust: false, core: true, highlight: 0.04, opacity: 0.82 }
  }
  const t = random() * Math.PI * 2
  const thickness = dust ? 0.009 + random() * 0.018 : gaussian(random) * (track < 3 ? 0.0055 : 0.0035)
  const point = new Vector3(orbit.rx * Math.cos(t), orbit.ry * Math.sin(t), thickness)
  const planarNormal = new Vector3(orbit.ry * Math.cos(t), orbit.rx * Math.sin(t), 0).normalize()
  point.addScaledVector(planarNormal, gaussian(random) * orbit.width)
  const flow = new Vector3(-orbit.rx * Math.sin(t), orbit.ry * Math.cos(t), 0).normalize()
  const normal = new Vector3(Math.cos(t) / orbit.rx, Math.sin(t) / orbit.ry, 0.2).normalize()
  const rotated = rotate(point, ...orbit.tilt)
  const rotatedNormal = rotate(normal, ...orbit.tilt).normalize()
  const rotatedFlow = rotate(flow, ...orbit.tilt).normalize()
  if (dust) rotated.add(new Vector3(gaussian(random) * 0.012, gaussian(random) * 0.012, gaussian(random) * 0.018))
  return {
    point: rotated,
    normal: rotatedNormal,
    flow: rotatedFlow,
    motion: [t / (Math.PI * 2), 0],
    track,
    dust,
    core: false,
    primary: track < 3,
    highlight: Math.pow(Math.max(0, Math.sin(t * 2 + track)), 8) * (track < 3 ? 0.76 : 0.46),
    opacity: dust ? 0.48 + random() * 0.2 : track < 3 ? 0.84 + random() * 0.14 : 0.7 + random() * 0.2,
  }
}

const trailPaths = [
  [[-0.78, -0.16], [-0.28, 0.62], [0.52, -0.66], [0.67, 0.37]],
  [[-0.78, 0.55], [-0.15, 0.24], [0.3, -0.5], [0.62, -0.08]],
  [[-0.7, -0.48], [-0.18, -0.82], [0.54, 0.28], [0.7, 0.72]],
  [[-0.75, 0.1], [-0.35, -0.45], [0.55, 0.76], [0.62, 0.48]],
  [[-0.9, -0.62], [-0.3, -0.44], [0.08, 0.12], [0.78, 0.04]],
  [[-0.6, 0.75], [-0.22, 0.5], [0.7, -0.25], [0.6, -0.55]],
  [[-0.92, -0.12], [-0.58, 0.82], [0.4, 0.18], [0.9, 0.55]],
  [[-0.95, 0.4], [-0.5, 0.9], [0.1, -0.15], [0.85, -0.68]],
  [[-0.86, -0.7], [-0.2, -0.84], [0.6, -0.15], [0.9, 0.24]],
  [[-0.65, 0.8], [-0.35, 0.42], [0.8, 0.25], [0.92, -0.28]],
  [[-0.92, 0.05], [-0.4, -0.22], [0.5, -0.85], [0.78, -0.75]],
  [[-0.88, -0.45], [-0.18, 0.15], [0.66, 0.95], [0.86, 0.62]],
]

function trailCenterline(strand, t) {
  const [p0, p1, p2, p3] = trailPaths[strand]
  const inverse = 1 - t
  const x = inverse ** 3 * p0[0] + 3 * inverse ** 2 * t * p1[0] + 3 * inverse * t ** 2 * p2[0] + t ** 3 * p3[0]
  const y = inverse ** 3 * p0[1] + 3 * inverse ** 2 * t * p1[1] + 3 * inverse * t ** 2 * p2[1] + t ** 3 * p3[1]
  const z = 0.22 * Math.sin(t * Math.PI * 2 + strand * 0.78) + 0.1 * Math.sin(t * Math.PI * 4 + strand)
  return new Vector3(x, y, z)
}

function etherealSample(random) {
  const category = random()
  // Three dominant currents, a close bundle of secondary filaments, and long
  // peripheral wisps form a hierarchy instead of a homogeneous curve cloud.
  const strand = category < 0.62
    ? Math.floor(random() * 3)
    : category < 0.9
      ? 3 + Math.floor(random() * 3)
      : 6 + Math.floor(random() * 6)
  const denseCurrent = strand < 3
  // Preserve continuous coverage along primary paths; the older concentrated
  // window caused particles to pile up at one shared crossing.
  let t = random()
  const escaping = category > 0.99
  if (escaping) t = random() < 0.5 ? random() * 0.14 : 0.86 + random() * 0.14
  const before = trailCenterline(strand, Math.max(0, t - 0.003))
  const after = trailCenterline(strand, Math.min(1, t + 0.003))
  const tangent = after.sub(before).normalize()
  const side = new Vector3(-tangent.y, tangent.x, 0.18 * Math.sin(strand + t * 5)).normalize()
  const depth = new Vector3().crossVectors(tangent, side).normalize()
  const centralWidth = Math.sin(Math.PI * t)
  const width = denseCurrent ? 0.012 + centralWidth * 0.035 : strand < 6 ? 0.004 + random() * 0.008 : 0.002 + random() * 0.004
  const strandDepth = denseCurrent ? (strand - 1) * 0.13 : strand < 6 ? (strand - 4) * 0.11 : (strand - 8.5) * 0.1
  const point = trailCenterline(strand, t)
    .addScaledVector(side, gaussian(random) * width)
    .addScaledVector(depth, strandDepth + gaussian(random) * (denseCurrent ? 0.03 : strand < 6 ? 0.035 : 0.045))
  if (escaping) point.add(new Vector3(gaussian(random) * 0.04, gaussian(random) * 0.05, gaussian(random) * 0.06))
  // Wisps stay fine through their authored size/opacity. Only truly detached
  // edge particles use the shader's stronger dust attenuation.
  const dust = escaping
  const wisp = strand >= 6 && !escaping
  return {
    point,
    normal: depth,
    flow: tangent,
    motion: [t, strand / trailPaths.length],
    track: strand % 8,
    dust,
    wisp,
    core: denseCurrent,
    primary: denseCurrent,
    highlight: dust ? 0.16 : Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.4 + strand)), 5) * (denseCurrent ? 0.72 : 0.48),
    opacity: denseCurrent ? 0.9 + random() * 0.1 : strand < 6 ? 0.66 + random() * 0.22 : escaping ? 0.36 + random() * 0.16 : 0.42 + random() * 0.22,
  }
}

const sampleFor = {
  vortex: torusSample,
  gyroscope: gyroscopeSample,
  ethereal: etherealSample,
}

export function makeParticleDesignData(shape, count) {
  const random = createRandom(shape === 'vortex' ? 0x9e3779b9 : shape === 'gyroscope' ? 0x243f6a88 : 0xb7e15162)
  const sample = sampleFor[shape]
  const points = []
  for (let i = 0; i < count; i += 1) {
    const item = sample(random)
    // The existing Beyond shader expands around x=1.5. Keeping each design
    // centered on that same anchor lets its established responsive layout fit
    // the actual bounds without touching section or scroll choreography.
    item.point.x += 1.5
    const tone = random()
    const base = item.core || item.primary && (shape === 'vortex' || shape === 'ethereal') && !item.layer
      ? (tone < 0.72 ? palette.navy : palette.ink)
      : item.layer && shape === 'vortex'
        ? (tone < 0.34 ? palette.ink : tone < 0.82 ? palette.steel : palette.silver)
      : item.primary && shape === 'gyroscope'
        ? (tone < 0.64 ? palette.navy : tone < 0.9 ? palette.ink : palette.steel)
        : tone < 0.48 ? palette.ink : tone < 0.82 ? palette.steel : palette.silver
    const color = base.clone().lerp(palette.ice, item.highlight * (tone > 0.8 ? 0.3 : 0.14))
    points.push({
      ...item,
      color,
      size: item.dust ? 0.48 + random() * 0.48 : item.wisp ? 0.48 + random() * 0.32 : item.layer ? 0.72 + random() * 0.4 : item.primary ? 0.94 + random() * 0.7 : 0.78 + random() * 0.62,
      opacity: item.opacity ?? (item.dust ? 0.32 + random() * 0.22 : 0.78 + random() * 0.2),
      seed: [random(), random(), (item.track + 0.5) / 8],
    })
  }

  // Match the existing depth ordering and GPU-friendly attribute layout.
  points.sort((a, b) => a.point.z - b.point.z)
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const flows = new Float32Array(count * 3)
  const motions = new Float32Array(count * 2)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count * 3)
  const surfaceData = new Float32Array(count * 4)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)
  points.forEach((item, index) => {
    const offset = index * 3
    item.point.toArray(positions, offset)
    item.normal.toArray(normals, offset)
    item.flow?.toArray(flows, offset)
    motions.set(item.motion ?? [0, 0], index * 2)
    item.color.toArray(colors, offset)
    seeds.set(item.seed, offset)
    surfaceData.set([item.highlight, item.dust ? 1 : 0, item.core ? 1 : 0, 0.45], index * 4)
    sizes[index] = item.size
    opacities[index] = item.opacity
  })
  return { positions, normals, flows, motions, colors, seeds, surfaceData, sizes, opacities }
}
