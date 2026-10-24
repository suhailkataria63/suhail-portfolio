import {
  DataTexture,
  EquirectangularReflectionMapping,
  FloatType,
  LinearSRGBColorSpace,
  PMREMGenerator,
  RGBAFormat,
  Vector3,
} from 'three'
import { reflectionSoftbox, reflectionSoftboxWeight } from './reflectionSoftbox'

// Private reflection studio for broad planar facets. The shared environment
// deliberately has black gaps between its small softboxes; these broad,
// overlapping spherical softboxes leave a dim blue surround in every direction.
// Values are linear HDR radiance, not emissive object colors.
export function createPolyhedronEnvironment(renderer) {
  const width = 512
  const height = 256
  const pixels = new Float32Array(width * height * 4)
  const softboxes = [
    // The wider sources are deliberately much dimmer and more saturated.
    { direction: [3, 1, 2], spread: 0.2, radiance: [0.42, 0.62, 1.15] },
    { direction: [0, 4, -1], spread: 0.16, radiance: [0.78, 0.95, 1.5] },
    { direction: [-2, 0, -3], spread: 0.25, radiance: [0.2, 0.32, 0.62] },
    { direction: [2, -2, -2], spread: 0.27, radiance: [0.11, 0.2, 0.4] },
    { direction: [-1, -3, 2], spread: 0.25, radiance: [0.08, 0.14, 0.3] },
  ].map(box => ({ ...box, direction: new Vector3(...box.direction).normalize() }))
  // Replace Gaussian highlight blobs with narrow feathered panels. Their
  // radiance is unchanged; the smaller solid angle preserves dark facets.
  const highlights = [
    reflectionSoftbox([-3, 2, 3], 0.1, 0.38, [2.1, 2.35, 2.8]),
    reflectionSoftbox([2.5, 0.8, 3.5], 0.055, 0.26, [2.4, 2.9, 3.6]),
  ]
  const direction = new Vector3()

  for (let y = 0; y < height; y += 1) {
    const theta = ((y + 0.5) / height) * Math.PI
    for (let x = 0; x < width; x += 1) {
      const phi = ((x + 0.5) / width) * Math.PI * 2
      // Inverse of Three.js equirectUv for DataTexture (flipY = false).
      direction.set(-Math.sin(theta) * Math.cos(phi), -Math.cos(theta), -Math.sin(theta) * Math.sin(phi))
      const offset = (y * width + x) * 4
      // A low-level midnight-blue floor keeps turned-away facets legible.
      pixels[offset] = 0.028
      pixels[offset + 1] = 0.043
      pixels[offset + 2] = 0.075
      pixels[offset + 3] = 1
      for (const box of softboxes) {
        // Smooth across longitude seams and poles; no hard panel boundaries.
        const weight = Math.exp((direction.dot(box.direction) - 1) / box.spread)
        for (let channel = 0; channel < 3; channel += 1) {
          pixels[offset + channel] += box.radiance[channel] * weight
        }
      }
      for (const box of highlights) {
        const weight = reflectionSoftboxWeight(direction, box)
        for (let channel = 0; channel < 3; channel += 1) {
          pixels[offset + channel] += box.radiance[channel] * weight
        }
      }
    }
  }

  const source = new DataTexture(pixels, width, height, RGBAFormat, FloatType)
  source.mapping = EquirectangularReflectionMapping
  source.colorSpace = LinearSRGBColorSpace
  source.needsUpdate = true
  const generator = new PMREMGenerator(renderer)
  try {
    return generator.fromEquirectangular(source)
  } finally {
    source.dispose()
    generator.dispose()
  }
}
