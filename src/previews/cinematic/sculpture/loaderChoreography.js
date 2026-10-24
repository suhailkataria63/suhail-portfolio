import { Vector3 } from 'three'

export const FORMATION_I_TIMING = Object.freeze({
  cluster: 0.5, separation: 0.6, orbit: 1.8, settle: 0.65,
  anticipation: 0.2, ignition: 0.2, expansion: 0.45, scan: 2,
  pause: 0.16, contraction: 0.4, fade: 0.16, showcase: 0.8,
})

export const FORMATION_I_ORBIT_SPEED = 0.72
export const FORMATION_I_ORBIT_SETTLE_ANGLE = 0.234
export const FORMATION_I_ORBIT_ENTRY_ANGLE = 0.216
export const PERSPECTIVE_ELLIPSE_ORBIT_DURATION = (Math.PI - FORMATION_I_ORBIT_SETTLE_ANGLE) / FORMATION_I_ORBIT_SPEED
export const PERSPECTIVE_ELLIPSE_ORBIT_END_ANGLE = FORMATION_I_ORBIT_ENTRY_ANGLE + Math.PI

export function addFormationIOrbitClock(timeline, state, reducedMotion = false, orbitDuration = FORMATION_I_TIMING.orbit) {
  if (reducedMotion) return timeline
  const start = FORMATION_I_TIMING.cluster
  const separationEnd = start + FORMATION_I_TIMING.separation
  const orbitEnd = separationEnd + orbitDuration
  return timeline
    .to(state, { orbitAngle: FORMATION_I_ORBIT_ENTRY_ANGLE, duration: FORMATION_I_TIMING.separation, ease: 'power2.inOut' }, start)
    .to(state, { orbitAngle: FORMATION_I_ORBIT_ENTRY_ANGLE + orbitDuration * FORMATION_I_ORBIT_SPEED, duration: orbitDuration, ease: 'none' }, separationEnd)
    .to(state, {
      orbitAngle: FORMATION_I_ORBIT_ENTRY_ANGLE + orbitDuration * FORMATION_I_ORBIT_SPEED + FORMATION_I_ORBIT_SETTLE_ANGLE,
      duration: FORMATION_I_TIMING.settle,
      ease: 'power2.out',
    }, orbitEnd)
}

// One controller owns these channels; R3F only consumes them (and advances
// the shared orbital angle). Values are independent of React render timing.
export const createLoaderState = () => ({
  phase: 'cluster', separation: 0, convergence: 0, orbitSpeed: 0,
  orbitAngle: 0, orbitReveal: 0, orbitScale: 0, formsOpacity: 1, handoff: 0,
  background: 1, showcase: 0, reducedMotion: false,
  clusterPixels: 0, heroTarget: null, onHandoffRendered: null, commitHandoff: null,
  handoffCommitted: false,
  scanSettle: 0, scanProgress: 0, scanTurn: 0, scanTime: 0, scanBounds: null,
  // Formation-I beam channels. The scan boundary remains scanProgress; these
  // only control the visible beam's ignition, width and shutdown.
  scanBeamOpacity: 0, scanBeamExpand: 0, scanTimelineProgress: 0,
  scanDiagnosticElement: null, scanBoundaryCssY: 0, scanShaderBoundaryCssY: 0,
  // Optional formation channels. Formation I uses scanProgress in both the
  // isolated route and production; other experiments use their own channels.
  formationMode: null, formationProgress: 0, spiralProgress: 0, alignmentProgress: 0, fusionProgress: 0, fusionFade: 0, morphProgress: 0, morphOpacity: 1, noHandoff: false,
})

// Project each mesh's bounding-box corners rather than the group pivot.
// These are CSS pixels, independent of the renderer's device pixel ratio.
// Used only for initial/resize fitting, never for per-particle work.
export function projectedSculptureBounds(object, camera, width, height) {
  object.updateWorldMatrix(true, true)
  camera.updateWorldMatrix(true, false)
  const point = new Vector3()
  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  object.traverse(child => {
    if (!child.geometry) return
    const geometry = child.geometry
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box || box.isEmpty()) return
    for (let corner = 0; corner < 8; corner += 1) {
      point.set(
        corner & 1 ? box.max.x : box.min.x,
        corner & 2 ? box.max.y : box.min.y,
        corner & 4 ? box.max.z : box.min.z,
      ).applyMatrix4(child.matrixWorld).project(camera)
      const x = (point.x + 1) * width * 0.5
      const y = (1 - point.y) * height * 0.5
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  })
  return { left, top, width: right - left, height: bottom - top }
}

export function fitProjectedSculpture(object, camera, width, height, pixels) {
  const previousScale = object.scale.clone()
  let low = 0.001
  let high = 1.5
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const candidate = (low + high) * 0.5
    object.scale.setScalar(candidate)
    const bounds = projectedSculptureBounds(object, camera, width, height)
    if (bounds.width > pixels || bounds.height > height * 0.7) high = candidate
    else low = candidate
  }
  object.scale.copy(previousScale)
  return (low + high) * 0.5
}
