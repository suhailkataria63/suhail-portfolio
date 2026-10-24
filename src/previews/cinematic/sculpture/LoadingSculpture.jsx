import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Curve,
  ExtrudeGeometry,
  MathUtils,
  Path,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three'
import { PERSPECTIVE_ELLIPSE_ORBIT_END_ANGLE, projectedSculptureBounds } from './loaderChoreography'
import { useHorizontalScan } from './useHorizontalScan'
import { createPolyhedronEnvironment } from './createPolyhedronEnvironment'
import { createAngularEnvironment } from './createAngularEnvironment'

// Stable local transforms make Pass 2's convergence animation a data-only
// change rather than a second positioning system.
export const LOADING_FORM_LAYOUT = [
  { key: 'ring', position: [-0.48, 0.18, 0.08], rotation: [0.32, -0.18, 0.22], scale: 1.02 },
  { key: 'knot', position: [0.02, 0.28, 0.18], rotation: [-0.18, 0.34, -0.26], scale: 0.86 },
  { key: 'polyhedron', position: [0.46, 0.17, -0.12], rotation: [0.42, 0.18, 0.62], scale: 0.84 },
  { key: 'starburst', position: [-0.2, -0.32, 0.32], rotation: [0.18, -0.32, 0.08], scale: 1.05 },
  { key: 'angular', position: [0.34, -0.3, -0.02], rotation: [-0.28, 0.46, 0.38], scale: 0.82 },
]

// Production-only opening arrangement. The studio/workshop keeps the shared
// reference layout above; the loader places the faceted form at the top and
// the curved knot on the right to separate the two rounded silhouettes.
const PRODUCTION_LOADING_FORM_LAYOUT = [
  LOADING_FORM_LAYOUT[0],
  { ...LOADING_FORM_LAYOUT[1], position: LOADING_FORM_LAYOUT[2].position },
  { ...LOADING_FORM_LAYOUT[2], position: LOADING_FORM_LAYOUT[1].position },
  LOADING_FORM_LAYOUT[3],
  LOADING_FORM_LAYOUT[4],
]

// Orbit phase slots use the same identity order as the production anchors:
// ring=left, polyhedron=top, knot=right, starburst=lower-left,
// angular=lower-right.
const DEFAULT_ORBIT_PHASE_ORDER = [2, 1, 0, 3, 4]
const PRODUCTION_ORBIT_PHASE_ORDER = [2, 0, 1, 3, 4]

// Preview-only motion tuning; the original loader path stays the default.
const PERSPECTIVE_ELLIPSE_ORBIT = Object.freeze({
  horizontalRadius: 0.96,
  verticalRadius: 0.72,
  depthAmplitude: 0.72,
  // Apparent scale targets, including the camera's perspective enlargement.
  nearScale: 1.45,
  farScale: 0.60,
})
const ZERO_CONVERGENCE_OFFSET = [0, 0, 0]
const CONVERGENCE_GAP_PX = 5
const CONVERGENCE_MAX_OFFSET_PX = 24

function projectedVertexBounds(object, camera, width, height) {
  object.updateWorldMatrix(true, true)
  camera.updateWorldMatrix(true, false)
  const point = new Vector3()
  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  object.traverse(child => {
    const positions = child.geometry?.getAttribute('position')
    if (!positions) return
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      point.fromBufferAttribute(positions, vertex).applyMatrix4(child.matrixWorld).project(camera)
      const x = (point.x + 1) * width * 0.5
      const y = (1 - point.y) * height * 0.5
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  })
  return Number.isFinite(left)
    ? { left, top, width: right - left, height: bottom - top }
    : projectedSculptureBounds(object, camera, width, height)
}

function boundsOverlap(a, b, gap) {
  const overlapX = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left) + gap
  const overlapY = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top) + gap
  return overlapX > 0 && overlapY > 0 ? { overlapX, overlapY } : null
}

function solveProjectedSeparation(bounds, gap, maxOffset) {
  const shifts = bounds.map(() => ({ x: 0, y: 0 }))
  const pairs = new Set()
  for (let pass = 0; pass < 32; pass += 1) {
    let changed = false
    for (let a = 0; a < bounds.length; a += 1) {
      for (let b = a + 1; b < bounds.length; b += 1) {
        const shiftedA = { ...bounds[a], left: bounds[a].left + shifts[a].x, top: bounds[a].top + shifts[a].y }
        const shiftedB = { ...bounds[b], left: bounds[b].left + shifts[b].x, top: bounds[b].top + shifts[b].y }
        const overlap = boundsOverlap(shiftedA, shiftedB, gap)
        if (!overlap) continue
        pairs.add(`${a}:${b}`)
        const centerAX = bounds[a].left + bounds[a].width * 0.5 + shifts[a].x
        const centerAY = bounds[a].top + bounds[a].height * 0.5 + shifts[a].y
        const centerBX = bounds[b].left + bounds[b].width * 0.5 + shifts[b].x
        const centerBY = bounds[b].top + bounds[b].height * 0.5 + shifts[b].y
        const useX = overlap.overlapX <= overlap.overlapY
        const direction = useX
          ? (centerAX <= centerBX ? -1 : 1)
          : (centerAY <= centerBY ? -1 : 1)
        const amount = (useX ? overlap.overlapX : overlap.overlapY) * 0.52
        const key = useX ? 'x' : 'y'
        shifts[a][key] += direction * amount
        shifts[b][key] -= direction * amount
        changed = true
      }
    }
    for (const shift of shifts) {
      const length = Math.hypot(shift.x, shift.y)
      if (length > maxOffset) {
        const factor = maxOffset / length
        shift.x *= factor
        shift.y *= factor
      }
    }
    if (!changed) break
  }
  // A common translation does not affect separation. Remove it so the
  // projected formation remains centered on its existing convergence point.
  const mean = shifts.reduce((sum, shift) => ({ x: sum.x + shift.x / shifts.length, y: sum.y + shift.y / shifts.length }), { x: 0, y: 0 })
  shifts.forEach(shift => { shift.x -= mean.x; shift.y -= mean.y })
  const largestShift = Math.max(...shifts.map(shift => Math.hypot(shift.x, shift.y)))
  if (largestShift > maxOffset) {
    const factor = maxOffset / largestShift
    shifts.forEach(shift => { shift.x *= factor; shift.y *= factor })
  }
  const remainingPairs = []
  for (let a = 0; a < bounds.length; a += 1) {
    for (let b = a + 1; b < bounds.length; b += 1) {
      const shiftedA = { ...bounds[a], left: bounds[a].left + shifts[a].x, top: bounds[a].top + shifts[a].y }
      const shiftedB = { ...bounds[b], left: bounds[b].left + shifts[b].x, top: bounds[b].top + shifts[b].y }
      if (boundsOverlap(shiftedA, shiftedB, gap)) remainingPairs.push(`${a}:${b}`)
    }
  }
  return { shifts, pairs: [...pairs], remainingPairs }
}

// Independent local axes keep the five sculptures visibly alive while their
// carrier groups follow the shared orbital path. Rates are intentionally
// small and different so the motion never reads as a synchronized turntable.
const LOADING_SPIN_AXES = [
  [0.28, 0.41, 0.12],
  [0.19, -0.32, 0.27],
  [-0.24, 0.17, 0.36],
  [0.34, 0.15, -0.2],
  [-0.16, 0.29, 0.23],
]

const materialSpec = {
  chrome: { color: '#aebbd0', roughness: 0.12, metalness: 0.96 },
  // Ring-only calibration: the Starburst retains its existing chrome finish.
  ring: { color: '#49698e', roughness: 0.1, metalness: 0.96 },
  graphite: { color: '#1b2638', roughness: 0.2, metalness: 0.9 },
  // The crystal keeps a deep navy base while allowing the studio reflections
  // to separate its flat faces.  Its slightly higher roughness and restrained
  // environment response keep it darker than the knot without losing facet
  // definition.
  polyhedron: {
    color: '#1b2d49',
    roughness: 0.14,
    metalness: 0.95,
    clearcoat: 0.42,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.45,
  },
  angular: {
    color: '#172947',
    roughness: 0.12,
    metalness: 0.95,
    clearcoat: 0.42,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.35,
  },
  navy: { color: '#1b2e4b', roughness: 0.14, metalness: 0.94 },
  knot: { color: '#49698e', roughness: 0.12, metalness: 0.96 },
  steel: { color: '#536b89', roughness: 0.22, metalness: 0.92 },
}

function MetalMaterial({ finish = 'steel', flatShading = false, materialRef }) {
  const spec = materialSpec[finish] ?? materialSpec.steel
  return (
    <meshPhysicalMaterial
      ref={materialRef}
      color={spec.color}
      metalness={spec.metalness}
      roughness={spec.roughness}
      clearcoat={spec.clearcoat ?? 0.42}
      clearcoatRoughness={spec.clearcoatRoughness ?? 0.08}
      envMapIntensity={spec.envMapIntensity ?? 2.35}
      flatShading={flatShading}
    />
  )
}

class TrefoilCurve extends Curve {
  constructor() {
    super()
    // TubeGeometry samples by arc length; use a dense length table so its
    // samples follow the analytic curve evenly through the tighter bends.
    this.arcLengthDivisions = 2048
  }

  getPoint(t, target = new Vector3()) {
    const angle = t * Math.PI * 2
    // The classic three-lobed trefoil projection. A separate depth amplitude
    // preserves over-under clearance without making the lobes stand edge-on.
    return target.set(
      0.17 * (Math.sin(angle) + 2 * Math.sin(2 * angle)),
      0.17 * (Math.cos(angle) - 2 * Math.cos(2 * angle)),
      0.15 * Math.sin(3 * angle),
    )
  }

  getTangent(t, target = new Vector3()) {
    const angle = t * Math.PI * 2
    // Analytic derivative: positions and tangents agree at both endpoints.
    // The common 2π derivative factor cancels when normalized.
    return target.set(
      0.17 * (Math.cos(angle) + 4 * Math.cos(2 * angle)),
      0.17 * (-Math.sin(angle) + 4 * Math.sin(2 * angle)),
      0.45 * Math.cos(3 * angle),
    ).normalize()
  }
}

export function createKnotGeometry() {
  // Closed transported frames and matching end rows provide a continuous
  // circular tube, including its vertex normals at the closure seam.
  const geometry = new TubeGeometry(new TrefoilCurve(), 384, 0.052, 32, true)
  // Present one lobe above the other two, with the broad three-lobed face
  // toward the camera. Studio/loader motion remains on its existing parents.
  geometry.rotateZ(Math.PI)
  geometry.center()
  geometry.computeBoundingSphere()
  return geometry
}

export function createAngularGeometry() {
  // One watertight extruded triangular frame gives the object flat metallic
  // faces, narrow bevels, and a real central opening instead of a rounded tube.
  const shape = new Shape()
  shape.moveTo(0, 0.4)
  shape.lineTo(-0.36, -0.28)
  shape.lineTo(0.36, -0.28)
  shape.closePath()
  const opening = new Path()
  opening.moveTo(0, 0.22)
  opening.lineTo(0.2, -0.14)
  opening.lineTo(-0.2, -0.14)
  opening.closePath()
  shape.holes.push(opening)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    curveSegments: 1,
  })
  geometry.translate(0, 0, -0.07)
  return geometry
}

function RingSymbol() {
  return (
    <mesh rotation={[0.08, 0.16, 0.12]}>
      <torusGeometry args={[0.32, 0.065, 32, 96]} />
      <MetalMaterial finish="ring" />
    </mesh>
  )
}

function KnotSymbol({ geometries }) {
  return (
    <mesh geometry={geometries}>
      <MetalMaterial finish="knot" />
    </mesh>
  )
}

function PolyhedronSymbol() {
  const material = useRef(null)
  const { gl, invalidate } = useThree()
  useLayoutEffect(() => {
    const environment = createPolyhedronEnvironment(gl)
    const target = material.current
    // A material envMap overrides scene.environment only for this sculpture.
    // Keep it world-aligned while the facets rotate through its softboxes.
    target.envMap = environment.texture
    target.needsUpdate = true
    invalidate()
    return () => {
      target.envMap = null
      target.needsUpdate = true
      environment.dispose()
    }
  }, [gl, invalidate])
  return (
    <mesh scale={[1.05, 0.86, 1.16]}>
      <icosahedronGeometry args={[0.34, 0]} />
      <MetalMaterial finish="polyhedron" flatShading materialRef={material} />
    </mesh>
  )
}

function StarburstSymbol() {
  const spikes = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2
    const length = index % 2 === 0 ? 0.4 : 0.235
    return {
      position: [Math.cos(angle) * length * 0.48, Math.sin(angle) * length * 0.48, 0],
      rotation: [0, 0, angle - Math.PI / 2],
      length,
    }
  }), [])
  return (
    <group>
      <mesh>
        <dodecahedronGeometry args={[0.12, 0]} />
        <MetalMaterial finish="steel" flatShading />
      </mesh>
      {spikes.map((spike, index) => (
        <mesh key={index} position={spike.position} rotation={spike.rotation}>
          <coneGeometry args={[0.052, spike.length, 6]} />
          <MetalMaterial finish={index % 3 === 0 ? 'chrome' : 'steel'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function AngularSymbol({ geometry }) {
  const material = useRef(null)
  const { gl, invalidate } = useThree()
  useLayoutEffect(() => {
    const environment = createAngularEnvironment(gl)
    const target = material.current
    target.envMap = environment.texture
    target.needsUpdate = true
    invalidate()
    return () => {
      target.envMap = null
      target.needsUpdate = true
      environment.dispose()
    }
  }, [gl, invalidate])
  return (
    <group rotation={[0.16, -0.3, 0.08]}>
      <mesh geometry={geometry}>
        <MetalMaterial finish="angular" materialRef={material} />
      </mesh>
    </group>
  )
}

function SymbolByKey({ type, knotGeometries, angularGeometry }) {
  if (type === 'ring') return <RingSymbol />
  if (type === 'knot') return <KnotSymbol geometries={knotGeometries} />
  if (type === 'polyhedron') return <PolyhedronSymbol />
  if (type === 'starburst') return <StarburstSymbol />
  return <AngularSymbol geometry={angularGeometry} />
}

// Reusable inspection primitive. The workshop uses this exact symbol tree so
// geometry changes remain shared with the production loader.
export function LoadingObject({ type }) {
  const knotGeometries = useMemo(() => createKnotGeometry(), [])
  const angularGeometry = useMemo(() => createAngularGeometry(), [])
  useEffect(() => () => {
    knotGeometries.dispose()
    angularGeometry.dispose()
  }, [knotGeometries, angularGeometry])
  return <SymbolByKey type={type} knotGeometries={knotGeometries} angularGeometry={angularGeometry} />
}

export default function LoadingSculpture({ animate = true, lifecycleRef, scanMode = false, orbitVariant = 'original' }) {
  const rootRef = useRef(null)
  const updateScan = useHorizontalScan(rootRef, scanMode, lifecycleRef, -1, orbitVariant === 'perspective-ellipse')
  const scanMeasurement = useRef('')
  const convergenceOffsetsRef = useRef([])
  const groupRefs = useRef([])
  const spinRefs = useRef([])
  const materialsRef = useRef([])
  const elapsed = useRef(0)
  const { viewport, size, camera, gl } = useThree()
  const knotGeometries = useMemo(() => createKnotGeometry(), [])
  const angularGeometry = useMemo(() => createAngularGeometry(), [])
  const targetPixels = Math.min(340, Math.max(220, size.width * 0.22))
  const formLayout = scanMode ? PRODUCTION_LOADING_FORM_LAYOUT : LOADING_FORM_LAYOUT
  const worldWidth = Math.max(viewport.width, 0.1)
  // Preserve the approved cluster sizing. The orbit fits inside a modestly
  // larger envelope; this root scale is never animated toward zero.
  const scale = Math.min(1.08, Math.max(0.62, (targetPixels / Math.max(size.width, 1) * worldWidth) / 1.35))
  const orbitScale = Math.min(scale * 0.86, worldWidth * 0.84 / 3, viewport.height * 0.72 / 3)

  useLayoutEffect(() => {
    if (!rootRef.current || !lifecycleRef?.current) return
    const poses = groupRefs.current.map(group => ({
      position: group.position.clone(), rotation: group.rotation.clone(), scale: group.scale.clone(),
    }))
    groupRefs.current.forEach((group, index) => {
      const form = formLayout[index]
      group.position.fromArray(form.position)
      group.rotation.fromArray(form.rotation)
      group.scale.setScalar(form.scale)
    })
    lifecycleRef.current.clusterPixels = projectedSculptureBounds(rootRef.current, camera, size.width, size.height).width
    groupRefs.current.forEach((group, index) => {
      group.position.copy(poses[index].position)
      group.rotation.copy(poses[index].rotation)
      group.scale.copy(poses[index].scale)
    })
    const materials = new Set()
    rootRef.current.traverse(child => {
      if (child.material) materials.add(child.material)
    })
    materialsRef.current = [...materials]
  }, [camera, lifecycleRef, scale, size.width, size.height])

  useLayoutEffect(() => {
    const root = rootRef.current
    const state = lifecycleRef?.current
    if (orbitVariant !== 'perspective-ellipse' || !root || !state || !camera.isPerspectiveCamera) {
      convergenceOffsetsRef.current = []
      return
    }

    const rootScale = root.scale.clone()
    const poses = groupRefs.current.map(group => group && ({
      position: group.position.clone(), rotation: group.rotation.clone(), scale: group.scale.clone(),
    }))
    const spinRotations = spinRefs.current.map(group => group?.rotation.clone())
    const phaseOrder = DEFAULT_ORBIT_PHASE_ORDER
    // The parent initializes loader state in useEffect, after this child
    // layout effect, so read the user's motion preference directly here.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const endAngle = reducedMotion ? state.orbitAngle : PERSPECTIVE_ELLIPSE_ORBIT_END_ANGLE
    const initialBounds = []
    root.scale.setScalar(scale)
    groupRefs.current.forEach((group, index) => {
      if (!group) return
      const form = formLayout[index]
      const angle = endAngle + phaseOrder[index] * Math.PI * 2 / 5 + 0.12
      const wave = Math.sin(angle)
      const orbital = reducedMotion
        ? form.position
        : [
          Math.cos(angle) * PERSPECTIVE_ELLIPSE_ORBIT.horizontalRadius,
          wave * PERSPECTIVE_ELLIPSE_ORBIT.verticalRadius,
          -wave * PERSPECTIVE_ELLIPSE_ORBIT.depthAmplitude,
        ]
      group.position.set(orbital[0] * 0.45, orbital[1] * 0.45, orbital[2] * 0.45)
      group.rotation.set(0.12, -0.42 + endAngle * 0.18 * 0.12, -0.25)
      group.scale.setScalar(form.scale * 0.86)
      if (spinRefs.current[index]) spinRefs.current[index].rotation.set(0, 0, 0)
      initialBounds[index] = projectedVertexBounds(group, camera, size.width, size.height)
    })

    const { shifts, pairs, remainingPairs } = solveProjectedSeparation(initialBounds, CONVERGENCE_GAP_PX, CONVERGENCE_MAX_OFFSET_PX)
    convergenceOffsetsRef.current = shifts.map((shift, index) => {
      const form = formLayout[index]
      const angle = endAngle + phaseOrder[index] * Math.PI * 2 / 5 + 0.12
      const z = reducedMotion ? form.position[2] * 0.45 : -Math.sin(angle) * PERSPECTIVE_ELLIPSE_ORBIT.depthAmplitude * 0.45
      const cameraDepth = Math.max(0.1, camera.position.z - z * scale)
      const pixelsPerLocalUnit = size.height * scale / (2 * cameraDepth * Math.tan(MathUtils.degToRad(camera.fov * 0.5)))
      return [shift.x / pixelsPerLocalUnit, -shift.y / pixelsPerLocalUnit, 0]
    })
    state.convergenceProjection = {
      objectKeys: formLayout.map(form => form.key),
      initialBounds,
      shiftsPx: shifts,
      adjustedPairs: pairs,
      remainingPairs,
      offsets: convergenceOffsetsRef.current,
    }

    groupRefs.current.forEach((group, index) => {
      if (!group || !poses[index]) return
      group.position.copy(poses[index].position)
      group.rotation.copy(poses[index].rotation)
      group.scale.copy(poses[index].scale)
      if (spinRefs.current[index] && spinRotations[index]) spinRefs.current[index].rotation.copy(spinRotations[index])
    })
    root.scale.copy(rootScale)
  }, [camera, formLayout, lifecycleRef, orbitVariant, scale, size.height, size.width])

  useEffect(() => () => {
    knotGeometries.dispose()
    angularGeometry.dispose()
  }, [knotGeometries, angularGeometry])

  useFrame((_, delta) => {
    if (lifecycleRef?.current?.handoffDebug?.frozen) return
    const state = lifecycleRef.current
    // Production's scan is finished before Hero travel starts. These forms
    // are fully clipped, and the beam has already shut down. Leave their last
    // pose/uniforms intact instead of measuring the moving Canvas and writing
    // the hidden beam's styles after every GSAP layout update.
    const scannedOut = scanMode && !state.noHandoff && state.scanProgress >= 1
      && ['handoff', 'settling', 'complete'].includes(state.phase)
    // Match the B benchmark: shader-discarded forms no longer enter either
    // render pass after the wipe. Reset visibility for a new loader run.
    if (rootRef.current) rootRef.current.visible = !scannedOut
    if (scannedOut) return
    if (!state.clusterPixels && state.phase === 'cluster' && rootRef.current) {
      state.clusterPixels = projectedSculptureBounds(rootRef.current, camera, size.width, size.height).width
    }
    const dt = Math.min(delta, 0.05)
    if (scanMode) {
      // The master timeline owns I's clock so pause, speed and replay affect
      // orbital motion as well as the scan. Other routes retain their clock.
      elapsed.current = state.reducedMotion ? 0 : state.scanTime || 0
    } else if (animate) {
      elapsed.current += dt
      // One angle, one speed, five fixed phase offsets: no independent
      // orbital clocks, changing spacing, or reversals at phase boundaries.
      state.orbitAngle += dt * state.orbitSpeed
    }
    const separation = state.reducedMotion ? 0 : state.separation
    const experimentalMode = state.formationMode
    const formationProgress = MathUtils.clamp(state.formationProgress || 0, 0, 1)
    const hybridSpiral = MathUtils.clamp(state.spiralProgress || 0, 0, 1)
    const hybridAlignment = MathUtils.clamp(state.alignmentProgress || 0, 0, 1)
    const fusionProgress = MathUtils.clamp(state.fusionProgress || 0, 0, 1)
    const convergence = experimentalMode === 'hybrid'
      ? Math.max(hybridSpiral, hybridAlignment)
      : experimentalMode === 'fusion'
        ? Math.max(hybridSpiral, fusionProgress)
        : experimentalMode === 'bridge' || experimentalMode === 'progressive' || experimentalMode === 'unified'
          ? Math.max(hybridSpiral, fusionProgress)
      : experimentalMode ? formationProgress : state.convergence
    const idleWeight = (1 - separation) * (1 - convergence) * (scanMode ? 1 - (state.scanSettle || 0) : 1)
    // Keep the tight and balanced comparison route values available. The
    // active loader-refinement preview uses 45% endpoint retention so the five
    // silhouettes remain distinct while preserving their orbital ordering.
      const convergenceRadius = orbitVariant === 'perspective-ellipse'
      ? 0.45
      : orbitVariant === 'perspective-ellipse-balanced' ? 0.22 : 0.17
    const radial = 1 - convergence * (1 - convergenceRadius)
    rootRef.current?.scale.setScalar(MathUtils.lerp(scale, orbitScale, separation * (1 - convergence)))
    const phaseOrder = scanMode ? PRODUCTION_ORBIT_PHASE_ORDER : DEFAULT_ORBIT_PHASE_ORDER
    groupRefs.current.forEach((group, index) => {
      if (!group) return
      const form = formLayout[index]
      const idlePhase = elapsed.current * (0.24 + index * 0.025) + index * 1.17
      const rotationLimit = [0.022, 0.018, 0.024, 0.016, 0.018][index]
      const angle = state.orbitAngle + phaseOrder[index] * Math.PI * 2 / 5 + 0.12
      const perspectiveOrbit = orbitVariant.startsWith('perspective-ellipse')
      const x = Math.cos(angle) * (perspectiveOrbit ? PERSPECTIVE_ELLIPSE_ORBIT.horizontalRadius : 0.96)
      const orbitWave = Math.sin(angle)
      let orbitX
      let orbitY
      let orbitZ
      let orbitScaleFactor = 1
      if (perspectiveOrbit) {
        // Camera sits on +Z, so the lower screen arc (negative Y) is brought
        // toward the viewer with positive Z. All three coordinates share the
        // same phase; the production path below remains exactly unchanged.
        orbitX = x
        orbitY = orbitWave * PERSPECTIVE_ELLIPSE_ORBIT.verticalRadius
        orbitZ = -orbitWave * PERSPECTIVE_ELLIPSE_ORBIT.depthAmplitude
        const nearWeight = (1 - orbitWave) * 0.5
        const apparentScale = MathUtils.lerp(PERSPECTIVE_ELLIPSE_ORBIT.farScale, PERSPECTIVE_ELLIPSE_ORBIT.nearScale, nearWeight)
        // At full separation the root uses orbitScale. Compensate for the
        // existing +Z camera projection so the requested apparent sizes are
        // not amplified a second time by real depth (including on resize).
        const perspectiveGain = camera.isPerspectiveCamera
          ? camera.position.z / (camera.position.z - orbitZ * orbitScale)
          : 1
        orbitScaleFactor = apparentScale / perspectiveGain
      } else {
        const planeY = orbitWave * 0.86
        // Existing production path: rotate one shared elliptical plane about
        // X, then gently about Z. Keep this branch untouched by the preview.
        const tiltedY = planeY * Math.cos(0.68)
        orbitX = x * Math.cos(-0.18) - tiltedY * Math.sin(-0.18)
        orbitY = x * Math.sin(-0.18) + tiltedY * Math.cos(-0.18)
        orbitZ = planeY * Math.sin(0.68)
      }
      let targetX = 0
      let targetY = 0
      let targetZ = 0
      let targetRotation = null
      if (experimentalMode === 'direct') {
        // Fixed structural regions echo the three Orbit bands while retaining
        // a compact, readable silhouette at the end of formation.
        const targets = [[-0.48, 0.22, 0.08], [0.28, 0.46, 0.18], [0.5, -0.12, -0.08], [-0.18, -0.45, -0.12], [-0.38, 0.02, 0.24]]
        const target = targets[index]
        targetX = target[0]
        targetY = target[1]
        targetZ = target[2]
      } else if (experimentalMode === 'ring') {
        const ringAngle = index * Math.PI * 2 / 5 + 0.26
        targetX = Math.cos(ringAngle) * 0.66
        targetY = Math.sin(ringAngle) * 0.52
        targetZ = Math.sin(ringAngle) * 0.22
      } else if (experimentalMode === 'spiral') {
        const spiralAngle = angle + formationProgress * Math.PI * 1.25
        const spiralRadius = 0.96 * (1 - formationProgress * 0.82)
        targetX = Math.cos(spiralAngle) * spiralRadius
        targetY = Math.sin(spiralAngle) * spiralRadius * 0.82
        targetZ = Math.sin(spiralAngle * 1.3) * 0.2 * (1 - formationProgress)
      } else if (experimentalMode === 'hybrid') {
        const spiralAngle = angle + hybridSpiral * Math.PI * 1.25
        const spiralRadius = 0.96 * (1 - hybridSpiral * 0.82)
        const spiralTarget = [
          Math.cos(spiralAngle) * spiralRadius,
          Math.sin(spiralAngle) * spiralRadius * 0.82,
          Math.sin(spiralAngle * 1.3) * 0.2 * (1 - hybridSpiral),
        ]
        const targets = [[-0.48, 0.22, 0.08], [0.28, 0.46, 0.18], [0.5, -0.12, -0.08], [-0.18, -0.45, -0.12], [-0.38, 0.02, 0.24]]
        const directTarget = targets[index]
        targetX = MathUtils.lerp(spiralTarget[0], directTarget[0], hybridAlignment)
        targetY = MathUtils.lerp(spiralTarget[1], directTarget[1], hybridAlignment)
        targetZ = MathUtils.lerp(spiralTarget[2], directTarget[2], hybridAlignment)
        const rotations = [[0.18, -0.35, 0.12], [-0.16, 0.42, -0.1], [0.26, -0.22, 0.2], [-0.22, 0.28, -0.18], [0.1, 0.55, 0.08]]
        targetRotation = rotations[index]
      } else if (experimentalMode === 'fusion') {
        const spiralAngle = angle + hybridSpiral * Math.PI * 1.18
        const spiralRadius = 0.96 * (1 - hybridSpiral * 0.82)
        const spiralTarget = [
          Math.cos(spiralAngle) * spiralRadius,
          Math.sin(spiralAngle) * spiralRadius * 0.82,
          Math.sin(spiralAngle * 1.3) * 0.18 * (1 - hybridSpiral),
        ]
        // Keep a small, layered compact volume rather than collapsing all
        // five forms into one mathematically identical point.
        const compactTargets = [[-0.34, 0.16, 0.12], [0.26, 0.3, 0.16], [0.4, -0.1, -0.1], [-0.18, -0.3, -0.1], [-0.28, 0.02, 0.22]]
        const compactTarget = compactTargets[index]
        targetX = MathUtils.lerp(spiralTarget[0], compactTarget[0], fusionProgress)
        targetY = MathUtils.lerp(spiralTarget[1], compactTarget[1], fusionProgress)
        targetZ = MathUtils.lerp(spiralTarget[2], compactTarget[2], fusionProgress)
        const rotations = [[0.16, -0.34, 0.1], [-0.12, 0.38, -0.08], [0.22, -0.2, 0.16], [-0.2, 0.25, -0.14], [0.08, 0.5, 0.06]]
        targetRotation = rotations[index]
      } else if (experimentalMode === 'bridge' || experimentalMode === 'progressive') {
        const spiralAngle = angle + hybridSpiral * Math.PI * 1.16
        const spiralRadius = 0.96 * (1 - hybridSpiral * 0.8)
        const spiralTarget = [
          Math.cos(spiralAngle) * spiralRadius,
          Math.sin(spiralAngle) * spiralRadius * 0.82,
          Math.sin(spiralAngle * 1.25) * 0.18 * (1 - hybridSpiral),
        ]
        const ringTargets = [[-0.38, 0.18, 0.1], [0.28, 0.28, 0.16], [0.42, -0.12, -0.1], [-0.2, -0.3, -0.1], [-0.3, 0.02, 0.2]]
        const target = ringTargets[index]
        targetX = MathUtils.lerp(spiralTarget[0], target[0], state.morphProgress)
        targetY = MathUtils.lerp(spiralTarget[1], target[1], state.morphProgress)
        targetZ = MathUtils.lerp(spiralTarget[2], target[2], state.morphProgress)
        const rotations = [[0.16, -0.34, 0.1], [-0.12, 0.38, -0.08], [0.22, -0.2, 0.16], [-0.2, 0.25, -0.14], [0.08, 0.5, 0.06]]
        targetRotation = rotations[index]
      } else if (experimentalMode === 'unified') {
        const spiralAngle = angle + hybridSpiral * Math.PI * 1.12
        const spiralRadius = 0.96 * (1 - hybridSpiral * 0.84)
        const compactTargets = [[-0.14, 0.06, 0.08], [0.1, 0.12, 0.02], [0.16, -0.08, -0.06], [-0.06, -0.14, -0.02], [-0.12, 0.01, 0.14]]
        const target = compactTargets[index]
        targetX = MathUtils.lerp(Math.cos(spiralAngle) * spiralRadius, target[0], state.morphProgress)
        targetY = MathUtils.lerp(Math.sin(spiralAngle) * spiralRadius * 0.8, target[1], state.morphProgress)
        targetZ = MathUtils.lerp(Math.sin(spiralAngle * 1.3) * 0.18 * (1 - hybridSpiral), target[2], state.morphProgress)
        const rotations = [[0.12, -0.3, 0.08], [-0.1, 0.34, -0.06], [0.18, -0.16, 0.12], [-0.16, 0.2, -0.1], [0.06, 0.44, 0.05]]
        targetRotation = rotations[index]
      }
      const destinationX = targetX
      const destinationY = targetY
      const destinationZ = targetZ
      const initialX = form.position[0] + Math.cos(idlePhase * 0.83) * 0.012 * idleWeight
      const initialY = form.position[1] + Math.sin(idlePhase) * 0.018 * idleWeight
      const orbitalPosition = [
        MathUtils.lerp(initialX, orbitX, separation),
        MathUtils.lerp(initialY, orbitY, separation),
        MathUtils.lerp(form.position[2], orbitZ, separation),
      ]
      const destination = experimentalMode === 'compact'
        ? [0, 0, 0]
        : [destinationX, destinationY, destinationZ]
      const destinationWeight = experimentalMode === 'hybrid' || experimentalMode === 'fusion' || experimentalMode === 'bridge' || experimentalMode === 'progressive' || experimentalMode === 'unified'
        ? hybridSpiral
        : formationProgress
      const convergenceOffset = orbitVariant === 'perspective-ellipse'
        ? convergenceOffsetsRef.current[index] ?? ZERO_CONVERGENCE_OFFSET
        : ZERO_CONVERGENCE_OFFSET
      group.position.set(
        MathUtils.lerp(orbitalPosition[0], destination[0], destinationWeight) * (experimentalMode ? 1 : radial) + convergenceOffset[0] * convergence,
        MathUtils.lerp(orbitalPosition[1], destination[1], destinationWeight) * (experimentalMode ? 1 : radial) + convergenceOffset[1] * convergence,
        MathUtils.lerp(orbitalPosition[2], destination[2], destinationWeight) * (experimentalMode ? 1 : radial) + convergenceOffset[2] * convergence,
      )
      const commonTurn = state.orbitAngle * 0.18
      group.rotation.set(
        MathUtils.lerp(form.rotation[0] + Math.sin(idlePhase * 0.8) * rotationLimit * idleWeight, 0.12, convergence),
        MathUtils.lerp(form.rotation[1] + commonTurn * separation, -0.42 + commonTurn * 0.12, convergence),
        MathUtils.lerp(form.rotation[2] + Math.cos(idlePhase * 0.7) * rotationLimit * idleWeight, -0.25, convergence),
      )
      const spin = spinRefs.current[index]
      if (spin) {
        const spinAxes = LOADING_SPIN_AXES[index]
        const spinDamping = scanMode
          ? 1 - MathUtils.smoothstep(state.scanSettle || 0, 0.12, 0.62)
          : 1 - MathUtils.clamp(convergence, 0, 1)
        spin.rotation.set(
          elapsed.current * spinAxes[0] * spinDamping,
          elapsed.current * spinAxes[1] * spinDamping,
          elapsed.current * spinAxes[2] * spinDamping,
        )
      }
      if (targetRotation && experimentalMode === 'hybrid') {
        group.rotation.x = MathUtils.lerp(group.rotation.x, targetRotation[0], hybridAlignment)
        group.rotation.y = MathUtils.lerp(group.rotation.y, targetRotation[1], hybridAlignment)
        group.rotation.z = MathUtils.lerp(group.rotation.z, targetRotation[2], hybridAlignment)
      } else if (targetRotation && experimentalMode === 'fusion') {
        group.rotation.x = MathUtils.lerp(group.rotation.x, targetRotation[0], fusionProgress)
        group.rotation.y = MathUtils.lerp(group.rotation.y, targetRotation[1], fusionProgress)
        group.rotation.z = MathUtils.lerp(group.rotation.z, targetRotation[2], fusionProgress)
      } else if (targetRotation && (experimentalMode === 'bridge' || experimentalMode === 'progressive' || experimentalMode === 'unified')) {
        group.rotation.x = MathUtils.lerp(group.rotation.x, targetRotation[0], state.morphProgress)
        group.rotation.y = MathUtils.lerp(group.rotation.y, targetRotation[1], state.morphProgress)
        group.rotation.z = MathUtils.lerp(group.rotation.z, targetRotation[2], state.morphProgress)
      }
      // Preserve a substantial central volume. Visibility falls only during
      // the last 20% of formation, once all forms overlap the emerging Orbit.
      // Follow the existing separation/settle blend so depth scaling reaches
      // the original authored size before the unchanged scan starts.
      const orbitScaleWeight = separation * (1 - convergence)
      group.scale.setScalar(form.scale * (1 - convergence * 0.14) * MathUtils.lerp(1, orbitScaleFactor, orbitScaleWeight))
    })
    if (scanMode) {
      // Measure only after the timeline's settle transform is complete. In
      // the ellipse preview that is the contracted orbit endpoint; production
      // retains its authored layout as the scan reference.
      const key = `${size.width}:${size.height}:${scale}`
      if (state.scanSettle >= 0.999 && (!state.scanBounds || scanMeasurement.current !== key)) {
        state.scanBounds = projectedSculptureBounds(rootRef.current, camera, size.width, size.height)
        scanMeasurement.current = key
      }
      // Only the main portfolio opts into the tighter beam. Reuse the actual
      // projected vertices at the completed pose, without changing scanBounds'
      // existing envelope or any object transform. A new resize envelope
      // invalidates this cached width naturally.
      if (state.scanLineElement?.dataset.clusterWidthRatio && state.scanSettle === 1
        && state.scanBounds && state.scanBounds.visibleClusterWidth === undefined) {
        state.scanBounds.visibleClusterWidth = projectedVertexBounds(rootRef.current, camera, size.width, size.height).width
      }
      updateScan(size.height, gl.domElement.getBoundingClientRect())
      return
    }
    if (experimentalMode === 'fusion') {
      // Fade the forms in the same order as the Orbit's inner-to-outer reveal,
      // keeping each local silhouette tied to a corresponding ring region.
      const fadeStarts = [0.02, 0.14, 0.28, 0.42, 0.54]
      groupRefs.current.forEach((group, index) => {
        if (!group) return
        const localFade = MathUtils.clamp((state.fusionFade - fadeStarts[index]) / 0.34, 0, 1)
        group.traverse(child => {
          if (!child.material) return
          if (!child.material.transparent) {
            child.material.transparent = true
            child.material.needsUpdate = true
          }
          child.material.opacity = state.formsOpacity * (1 - localFade)
          child.material.depthWrite = localFade < 0.04
        })
      })
    } else {
      for (const material of materialsRef.current) {
        if (!material.transparent) {
          material.transparent = true
          material.needsUpdate = true
        }
        material.opacity = state.formsOpacity
        material.depthWrite = state.formsOpacity > 0.98
      }
    }
  })

  return (
    <group ref={rootRef} scale={scale}>
      {formLayout.map((form, index) => (
        <group
          key={form.key}
          ref={element => { groupRefs.current[index] = element }}
          position={form.position}
          rotation={form.rotation}
          scale={form.scale}
        >
          <group ref={element => { spinRefs.current[index] = element }}>
            <SymbolByKey type={form.key} knotGeometries={knotGeometries} angularGeometry={angularGeometry} />
          </group>
        </group>
      ))}
    </group>
  )
}
