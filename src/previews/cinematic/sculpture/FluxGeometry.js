import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'

// Two original, closed, tapered blade surfaces. Their elliptical sections twist
// along different S-shaped spines; neither geometry is a loop or a torus.
export class FluxGeometry extends BufferGeometry {
  constructor(variant = 0) {
    super()
    const spine = variant === 0
      ? [[-0.48, -1.68, 0.02], [-0.62, -0.85, 0.22], [0.22, -0.12, 0.12],
        [0.46, 0.7, -0.24], [-0.16, 1.68, 0.06]]
      : [[0.36, -1.38, -0.16], [0.62, -0.68, -0.16], [-0.20, 0.10, -0.28],
        [-0.42, 0.82, 0.04], [0.30, 1.40, 0.18]]
    const curve = new CatmullRomCurve3(spine.map(point => new Vector3(...point)))
    const segments = 160
    const sides = 40
    const frames = curve.computeFrenetFrames(segments, false)
    const vertices = [...spine[0]]
    const indices = []
    const point = new Vector3()
    const section = new Vector3()

    for (let ring = 1; ring < segments; ring++) {
      const t = ring / segments
      curve.getPointAt(t, point)
      const taper = Math.pow(Math.sin(Math.PI * t), 0.65)
      const width = (variant === 0 ? 0.62 : 0.40) * taper * (0.85 + 0.15 * Math.sin(t * Math.PI * 3))
      const thickness = (variant === 0 ? 0.115 : 0.085) * taper
      const twist = t * Math.PI * (variant === 0 ? 1.65 : -1.45) + variant * 0.8
      for (let side = 0; side < sides; side++) {
        const angle = side / sides * Math.PI * 2
        const x = Math.cos(angle) * width
        const y = Math.sin(angle) * thickness
        const u = x * Math.cos(twist) - y * Math.sin(twist)
        const v = x * Math.sin(twist) + y * Math.cos(twist)
        section.copy(point).addScaledVector(frames.normals[ring], u)
          .addScaledVector(frames.binormals[ring], v)
        vertices.push(section.x, section.y, section.z)
      }
    }

    // Shared seam vertices and single-vertex tips avoid open edges and cap seams.
    const tip = vertices.length / 3
    vertices.push(...spine[spine.length - 1])
    for (let side = 0; side < sides; side++) {
      const next = (side + 1) % sides
      indices.push(0, 1 + next, 1 + side)
      for (let ring = 0; ring < segments - 2; ring++) {
        const a = 1 + ring * sides + side
        const b = 1 + ring * sides + next
        indices.push(a, b, a + sides, b, b + sides, a + sides)
      }
      const last = 1 + (segments - 2) * sides
      indices.push(last + side, last + next, tip)
    }
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    this.setIndex(indices)
    this.computeVertexNormals()
    this.computeBoundingSphere()
  }
}
