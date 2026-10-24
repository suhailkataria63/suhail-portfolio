import { Vector4 } from 'three'
import { horizontalScanSource } from './useHorizontalScan'

// Prepare the actual materials, renderer, scene and camera used by production.
// A zero-area scissor protects the visible framebuffer while render() still
// creates the configured renderer-owned transmission target and uses the real
// output-color/tone-mapping variants. No extra scene, mesh or target is needed.
export function prepareOrbitHandoff(renderer, scene, camera, orbit, recorder, state) {
  const started = performance.now()
  const scissor = renderer.getScissor(new Vector4())
  const scissorTest = renderer.getScissorTest()
  const visible = orbit.visible
  const entries = []
  orbit.traverse(mesh => {
    if (!mesh.isMesh || !mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    entries.push({ mesh, material: mesh.material, materials,
      values: materials.map(material => ({ transparent: material.transparent, transmission: material.transmission })),
    })
  })
  recorder?.note('handoff preparation start', state)
  try {
    renderer.setScissor(0, 0, 0, 0)
    renderer.setScissorTest(true)
    orbit.visible = true
    for (const entry of entries) {
      for (const material of entry.materials) {
        const source = horizontalScanSource(material)
        if (!source) continue
        material.transparent = true
        if ('transmission' in material) material.transmission = 0
        material.needsUpdate = true
      }
    }
    // Prepare the exact B travel state, not just the opaque scan state:
    // transparent=true and transmission=0 select a separate shader variant.
    renderer.render(scene, camera)
    recorder?.note('handoff preparation transparent-zero-transmission variant', state, { programs: renderer.info.programs?.length })
    for (const entry of entries) {
      for (const material of entry.materials) {
        const source = horizontalScanSource(material)
        if (source && 'transmission' in material) {
          material.transmission = source.transmission
          material.needsUpdate = true
        }
      }
    }
    // Scan-copy transmission variant, including the transmission render pass.
    recorder?.note('transmission warmup activation', state)
    renderer.render(scene, camera)
    for (const entry of entries) {
      const sources = entry.materials.map(material => horizontalScanSource(material) || material)
      entry.mesh.material = Array.isArray(entry.material) ? sources : sources[0]
    }
    // Keep the real Hero programs referenced by their real materials, so scan
    // copy disposal at completion cannot evict every prepared Orbit program.
    renderer.render(scene, camera)
  } finally {
    for (const entry of entries) {
      entry.mesh.material = entry.material
      entry.materials.forEach((material, index) => {
        material.transparent = entry.values[index].transparent
        if ('transmission' in material) material.transmission = entry.values[index].transmission
        material.needsUpdate = true
      })
    }
    orbit.visible = visible
    renderer.setScissor(scissor)
    renderer.setScissorTest(scissorTest)
    recorder?.note('handoff preparation end', state, {
      durationMs: performance.now() - started,
      programs: renderer.info.programs?.length, textures: renderer.info.memory.textures,
      transmissionResolutionScale: renderer.transmissionResolutionScale,
      sceneId: scene.id, cameraId: camera.id,
      drawingBufferWidth: renderer.domElement.width, drawingBufferHeight: renderer.domElement.height,
    })
  }
}
