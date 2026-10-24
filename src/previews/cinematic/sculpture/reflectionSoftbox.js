import { Vector3 } from 'three'

// An environment-only rectangular studio source, similar to the Knot's
// reflected softbox panels. Half-width/height are angular radians; the outer
// 35% of each panel is feathered before PMREM roughness filtering.
export function reflectionSoftbox(direction, width, height, radiance) {
  const normal = new Vector3(...direction).normalize()
  const up = Math.abs(normal.y) > 0.95 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0)
  const horizontal = new Vector3().crossVectors(up, normal).normalize()
  const vertical = new Vector3().crossVectors(normal, horizontal).normalize()
  return { normal, horizontal, vertical, width, height, radiance }
}

export function reflectionSoftboxWeight(direction, box) {
  const forward = direction.dot(box.normal)
  if (forward <= 0) return 0
  const x = Math.abs(Math.atan2(direction.dot(box.horizontal), forward)) / box.width
  const y = Math.abs(Math.atan2(direction.dot(box.vertical), forward)) / box.height
  const feather = distance => {
    const t = Math.min(1, Math.max(0, (distance - 0.65) / 0.35))
    return 1 - t * t * (3 - 2 * t)
  }
  return feather(x) * feather(y)
}
