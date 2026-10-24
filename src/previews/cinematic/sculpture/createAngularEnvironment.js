import {
  DataTexture,
  EquirectangularReflectionMapping,
  Euler,
  FloatType,
  LinearSRGBColorSpace,
  PMREMGenerator,
  RGBAFormat,
  Vector3,
} from 'three'
import { reflectionSoftbox, reflectionSoftboxWeight } from './reflectionSoftbox'

// Angular's broad front planes need a continuous navy reflection floor. The
// shared studio map has dark gaps that read as black on those planes, while
// this private map keeps the side bevels controlled and reflective.
export function createAngularEnvironment(renderer) {
  const width = 512
  const height = 256
  const pixels = new Float32Array(width * height * 4)
  const softboxes = [
    // Low navy fill, separate from the high-contrast panel reflections.
    { direction: [0, 0, 4], spread: 0.14, radiance: [0.14, 0.21, 0.37] },
    { direction: [-3, 2, 3], spread: 0.15, radiance: [0.2, 0.3, 0.52] },
    { direction: [3, 1, -2], spread: 0.24, radiance: [0.14, 0.25, 0.52] },
    { direction: [0, 4, -1], spread: 0.25, radiance: [0.18, 0.29, 0.58] },
  ].map(box => ({ ...box, direction: new Vector3(...box.direction).normalize() }))
  // For the authored AngularSymbol rotation and a +Z camera, the BRDF samples
  // reflect(-viewDir, normal), not -normal. Keep these panels world-fixed;
  // they are reflected naturally as the frame rotates through them.
  const frontNormal = new Vector3(0, 0, 1).applyEuler(new Euler(0.16, -0.3, 0.08))
  const frontReflection = new Vector3(0, 0, -1).reflect(frontNormal)
  const highlights = [
    reflectionSoftbox(frontReflection.toArray(), 0.09, 0.32, [1.45, 1.75, 2.2]),
    reflectionSoftbox([2, 1.2, 4], 0.065, 0.28, [1.1, 1.35, 1.8]),
  ]
  const direction = new Vector3()

  for (let y = 0; y < height; y += 1) {
    const theta = ((y + 0.5) / height) * Math.PI
    for (let x = 0; x < width; x += 1) {
      const phi = ((x + 0.5) / width) * Math.PI * 2
      // Inverse of Three.js equirectUv for DataTexture (flipY = false).
      direction.set(-Math.sin(theta) * Math.cos(phi), -Math.cos(theta), -Math.sin(theta) * Math.sin(phi))
      const offset = (y * width + x) * 4
      pixels[offset] = 0.025
      pixels[offset + 1] = 0.04
      pixels[offset + 2] = 0.07
      pixels[offset + 3] = 1
      for (const box of softboxes) {
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
