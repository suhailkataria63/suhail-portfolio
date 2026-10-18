import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene } from 'three'

// HDR-strength softboxes baked once into a reflection map; no remote assets.
export function createStudioEnvironment(renderer) {
  const studio = new Scene()
  studio.background = new Color('#080a0e')
  const panels = [
    { position: [-3, 1.4, 2], size: [2.2, 5], color: '#f2f5ff', intensity: 7 },
    { position: [3, 0.6, 1], size: [0.7, 4.5], color: '#8aafff', intensity: 5 },
    { position: [0, 4, -1], size: [4, 2], color: '#ffffff', intensity: 6 },
    { position: [-1, -2, 3], size: [3, 0.45], color: '#c5d6ee', intensity: 3 },
    { position: [1.5, 1, -4], size: [1.8, 4], color: '#6c88bc', intensity: 4 },
  ]
  for (const panel of panels) {
    const mesh = new Mesh(new PlaneGeometry(...panel.size), new MeshBasicMaterial({
      color: new Color(panel.color).multiplyScalar(panel.intensity),
      side: DoubleSide,
      toneMapped: false,
    }))
    mesh.position.set(...panel.position)
    mesh.lookAt(0, 0, 0)
    studio.add(mesh)
  }
  const generator = new PMREMGenerator(renderer)
  try {
    return generator.fromScene(studio, 0.04, 0.1, 20, { size: 256 })
  } finally {
    generator.dispose()
    for (const mesh of studio.children) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
  }
}
