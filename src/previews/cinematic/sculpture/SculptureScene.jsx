import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, DoubleSide, MathUtils, TubeGeometry, Vector3 } from 'three'
import { FluxGeometry, OrbitBandGeometry } from './FluxGeometry'
import { createStudioEnvironment } from './createStudioEnvironment'

extend({ FluxGeometry, OrbitBandGeometry })

function subscribeMotion(callback) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  document.addEventListener('visibilitychange', callback)
  return () => {
    media.removeEventListener('change', callback)
    document.removeEventListener('visibilitychange', callback)
  }
}
const motionEnabled = () => !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

function StudioLighting() {
  const { gl, scene, invalidate } = useThree()
  useEffect(() => {
    const previous = scene.environment
    const environment = createStudioEnvironment(gl)
    // eslint-disable-next-line react-hooks/immutability -- Three.js scenes are mutable renderer objects, not React state.
    scene.environment = environment.texture
    invalidate()
    return () => {
      scene.environment = previous
      environment.dispose()
    }
  }, [gl, scene, invalidate])
  return (
    <>
      <directionalLight position={[-3, 4, 5]} intensity={3} color="#f5f7ff" />
      <directionalLight position={[4, 1, -2]} intensity={2} color="#8dafff" />
    </>
  )
}

function FluxSculpture({ pointerRef, controlRef, animate }) {
  const sculpture = useRef(null)
  const revealGroup = useRef(null)
  const floatGroup = useRef(null)
  const outerPivot = useRef(null)
  const middlePivot = useRef(null)
  const innerPivot = useRef(null)
  const elapsed = useRef(0)
  const scrollProgress = useRef(0)
  const projectProgress = useRef(0)
  const aboutProgress = useRef(0)
  const aboutExit = useRef(0)
  const contactProgress = useRef(0)
  const helixGroup = useRef(null)
  const windowFit = useRef(0.14)
  const { invalidate } = useThree()
  const helixGeometry = useMemo(() => [0, Math.PI].map(phase => {
    const points = Array.from({ length: 49 }, (_, index) => {
      const t = (index / 48) * Math.PI * 2
      const angle = t * 1.12 + phase
      return new Vector3(
        Math.cos(angle) * (0.56 + Math.sin(t * 2.1 + phase) * 0.08),
        (t - Math.PI) * 0.52,
        Math.sin(angle) * (0.56 + Math.cos(t * 1.7 + phase) * 0.06),
      )
    })
    const curve = new CatmullRomCurve3(points)
    return {
      geometry: new TubeGeometry(curve, 96, 0.13, 12, false),
      start: curve.getPoint(0),
      end: curve.getPoint(1),
    }
  }), [])
  const sculptureParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sculpture')
    : null
  const orbit = sculptureParam === 'orbit'
  const orbitV2 = sculptureParam !== 'orbit' && sculptureParam !== 'flux'

  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        // GSAP owns the progress value outside React. Always request a frame
        // after updating it so demand-mode roots cannot display a stale scene.
        setProgress: value => {
          scrollProgress.current = value
          projectProgress.current = Math.max(0, Math.min(1, value - 1))
          invalidate()
        },
        setAboutProgress: value => {
          aboutProgress.current = Math.max(0, Math.min(1, value))
          invalidate()
        },
        setAboutExit: value => {
          aboutExit.current = Math.max(0, Math.min(1, value))
          invalidate()
        },
        setContactProgress: value => {
          contactProgress.current = Math.max(0, Math.min(1, value))
          invalidate()
        },
        setViewport: (width, height) => {
          if (width <= 0 || height <= 0) return
          // The DOM window is the clipping viewport. Keep the WebGL drawing
          // buffer stable and only update the uniform sculpture fit.
          const viewportWidth = Math.max(window.innerWidth, 1)
          const viewportHeight = Math.max(window.innerHeight, 1)
          windowFit.current = Math.min(width / viewportWidth, height / viewportHeight)
          invalidate()
        },
      }
    }
    if (!animate && sculpture.current) {
      sculpture.current.rotation.set(0.12, -0.42, -0.25)
      sculpture.current.position.set(0, 0, 0)
      invalidate()
    }
    return () => {
      if (controlRef) controlRef.current = null
    }
  }, [animate, controlRef, invalidate])

  useFrame((_, delta) => {
    if (!animate || !sculpture.current) return
    const dt = Math.min(delta, 0.05)
    elapsed.current += dt
    const object = sculpture.current
    const pointer = pointerRef.current
    const progress = scrollProgress.current
    const project = projectProgress.current
    const about = aboutProgress.current
    const builder = aboutExit.current
    const contact = contactProgress.current
    const heroProgress = Math.min(progress, 1)
    const horizontalPresentation = MathUtils.smoothstep(project, 0.03, 0.34)
    const exitMotion = MathUtils.smoothstep(project, 0.58, 0.9)
    const recession = MathUtils.smoothstep(project, 0.78, 1)
    const selectedExit = MathUtils.smoothstep(project, 0.72, 1)
    // The Orbit leaves the first-project handoff spatially. Keeping this
    // separate from opacity lets the sculpture clear the viewport before the
    // project media begins, while preserving a reversible scroll state.
    const selectedExitLift = MathUtils.smoothstep(project, 0.72, 0.98)
    const aboutEntrance = MathUtils.smoothstep(about, 0.02, 0.56)
    // The heading starts revealing at About progress .55. Start the Orbit's
    // rightward travel on that same interval so the two elements settle as a
    // single composition rather than one appearing to push the other.
    const aboutShift = MathUtils.smoothstep(about, 0.55, 0.8)
    const builderVerticalExit = MathUtils.smoothstep(builder, 0.14, 0.56)
    // Match the two-line About headline reveal: the sculpture turns around
    // its true vertical axis as the text rises into view.
    const headingReveal = MathUtils.smoothstep(about, 0.5, 0.8)
    const projectOpacity = 1 - MathUtils.smoothstep(project, 0.78, 0.98)
    const aboutOpacity = aboutEntrance
    const builderFade = MathUtils.smoothstep(builder, 0.5, 0.72)
    const fluxOpacity = Math.max(projectOpacity, aboutOpacity) * (1 - builderFade)
    // Frame-rate-independent damping keeps the interaction soft at any refresh rate.
    const verticalX = 0.12 + pointer.y * 0.23 + heroProgress * 0.22
    const verticalY = -0.42 + elapsed.current * 0.12 + pointer.x * 0.52 + heroProgress * 0.5
    const verticalZ = -0.25 + pointer.x * 0.06 - heroProgress * 0.16
    const horizontalX = MathUtils.lerp(verticalX, 1.25, horizontalPresentation)
    const horizontalY = MathUtils.lerp(verticalY, 0, horizontalPresentation)
    const horizontalZ = MathUtils.lerp(verticalZ, 1.57, horizontalPresentation)
    // After a short horizontal hold, ease into a restrained exit pose so the
    // sculpture visibly travels away before its final fade.
    const exitX = MathUtils.lerp(horizontalX, 0.95, exitMotion)
    const exitY = MathUtils.lerp(horizontalY, -0.34, exitMotion)
    const exitZ = MathUtils.lerp(horizontalZ, 1.82, exitMotion)
    const aboutRotationX = MathUtils.lerp(1.22, 0.42, aboutEntrance) + pointer.y * 0.08 * aboutEntrance
    const aboutRotationY = MathUtils.lerp(0.02, 0.62, aboutEntrance) + pointer.x * 0.12 * aboutEntrance
    const aboutRotationZ = MathUtils.lerp(1.78, 0.72, aboutEntrance)
    const builderTurn = MathUtils.smoothstep(builder, 0.08, 0.5) * 0.22
    object.rotation.x = MathUtils.damp(object.rotation.x, MathUtils.lerp(exitX, aboutRotationX, aboutEntrance), 4, dt)
    object.rotation.y = MathUtils.damp(object.rotation.y, MathUtils.lerp(exitY, aboutRotationY + builderTurn, aboutEntrance), 4, dt)
    // Flux's spine runs vertically along Y. A measured 1.35 rad Z turn gives
    // the intended horizontal silhouette without changing its geometry.
    object.rotation.z = MathUtils.damp(object.rotation.z, MathUtils.lerp(exitZ, aboutRotationZ, aboutEntrance), 4, dt)
    const parallax = 1 - heroProgress
    const exitPositionX = pointer.x * 0.10 * parallax + exitMotion * 0.22
    const exitPositionY = pointer.y * 0.07 * parallax + horizontalPresentation * 0.35 + exitMotion * 0.28
    const bridgePositionX = MathUtils.lerp(exitPositionX, 0, selectedExit)
    const bridgePositionY = MathUtils.lerp(exitPositionY, 2.55, selectedExitLift)
    const mobileLayout = window.innerWidth < 700
    const aboutPositionX = aboutShift * (mobileLayout ? 0.08 : 1.08) + pointer.x * 0.1 * aboutEntrance
    // Orbit V2's broader three-band silhouette reads lower than its pivot;
    // lift only that variant's About anchor without affecting other stages.
    // Calibrated against the About heading's visual center at the reference
    // desktop viewport; this replaces the earlier partial lift rather than
    // stacking another independent offset.
    const orbitAboutLift = orbitV2 && !mobileLayout ? 0.64 : 0
    const aboutPositionY = (mobileLayout ? 0.58 - aboutShift * 0.12 : -0.2 + orbitAboutLift - aboutShift * 0.18) + pointer.y * 0.06 * aboutEntrance
    // Enter from above, settle into a centered hold, then move into the
    // existing right-hand About composition. Builder reverses those spatial
    // phases before the Orbit travels upward out of frame.
    const aboutEnteringX = MathUtils.lerp(0, aboutPositionX, aboutShift)
    const aboutCenterY = MathUtils.lerp(2.55, 0, aboutEntrance)
    const aboutEnteringY = MathUtils.lerp(aboutCenterY, aboutPositionY, aboutShift)
    // Keep the Orbit on the right during the Builder handoff. Its primary
    // exit motion is vertical, so it never crosses the outgoing headline.
    const builderPositionX = aboutPositionX
    const builderPositionY = aboutPositionY
    const builderExitY = MathUtils.lerp(builderPositionY, 2.85, builderVerticalExit)
    const introTargetX = MathUtils.lerp(bridgePositionX, aboutEnteringX, aboutEntrance)
    const introTargetY = MathUtils.lerp(bridgePositionY, aboutEnteringY, aboutEntrance)
    const targetX = builder > 0 ? builderPositionX : introTargetX
    const targetY = builder > 0 ? builderExitY : introTargetY
    object.position.x = MathUtils.damp(object.position.x, targetX, 3, dt)
    // Keep the horizontal presentation in the upper-middle of the viewport;
    // the persistent canvas is viewport-sized, so this is a stable world-space
    // anchor rather than a transform tied to the clipping window.
    // Match the upper edge of the intro's DOM composition with the actual
    // projected sculpture bounds instead of pushing the object by a large
    // world-space offset. The resulting center leaves a small visual gap
    // above SELECTED WORK while keeping the full silhouette in frame.
    object.position.y = MathUtils.damp(object.position.y, targetY, 3, dt)
    if (floatGroup.current) {
      floatGroup.current.rotation.x = Math.sin(elapsed.current * 0.28) * 0.025 * aboutEntrance
      floatGroup.current.rotation.y = Math.cos(elapsed.current * 0.24) * 0.035 * aboutEntrance
      floatGroup.current.position.y = Math.sin(elapsed.current * 0.7) * 0.018 * aboutEntrance
    }
    if (revealGroup.current) {
      revealGroup.current.rotation.y = 1.15 * headingReveal
    }
    if (orbitV2) {
      // Each pivot has a distinct period and axis so the bands never behave
      // like one synchronized rigid object.
      if (outerPivot.current) {
        outerPivot.current.rotation.y = elapsed.current * 0.075
        outerPivot.current.rotation.x = Math.sin(elapsed.current * 0.17) * 0.035
      }
      if (middlePivot.current) {
        middlePivot.current.rotation.x = -elapsed.current * 0.125
        middlePivot.current.rotation.z = Math.sin(elapsed.current * 0.21 + 1.1) * 0.06
      }
      if (innerPivot.current) {
        innerPivot.current.rotation.z = elapsed.current * 0.19
        innerPivot.current.rotation.y = Math.sin(elapsed.current * 0.13 + 2.2) * 0.1
      }
    }
    if (helixGroup.current) {
      const entrance = MathUtils.smoothstep(Math.max(0, Math.min((contact - 0.16) / 0.32, 1)), 0.02, 0.92)
      const contactLayout = MathUtils.smoothstep(contact, 0.86, 0.98)
      helixGroup.current.position.x = MathUtils.damp(helixGroup.current.position.x, MathUtils.lerp(0, 0.92, contactLayout), 4, dt)
      helixGroup.current.position.y = MathUtils.damp(helixGroup.current.position.y, MathUtils.lerp(-2.2, 0, entrance), 4, dt)
      helixGroup.current.position.z = MathUtils.damp(helixGroup.current.position.z, MathUtils.lerp(-0.35, 0, entrance), 4, dt)
      helixGroup.current.rotation.x = MathUtils.damp(helixGroup.current.rotation.x, MathUtils.lerp(-0.6, 0.06, entrance), 3, dt)
      helixGroup.current.rotation.y = elapsed.current * 0.1 + pointer.x * 0.12
      helixGroup.current.rotation.z = MathUtils.damp(helixGroup.current.rotation.z, MathUtils.lerp(-0.3, 0.04, entrance), 3, dt)
      const helixScale = MathUtils.lerp(0.05, MathUtils.lerp(0.82, 0.68, contactLayout), entrance)
      helixGroup.current.scale.setScalar(MathUtils.damp(helixGroup.current.scale.x, helixScale, 4, dt))
      helixGroup.current.traverse(child => {
        if (child.material) child.material.opacity = entrance * (0.94 - contactLayout * 0.08)
      })
    }
    object.position.z = MathUtils.damp(object.position.z, MathUtils.lerp(Math.abs(pointer.x) * 0.12 * parallax - recession * 1.2, -0.1, aboutEntrance), 3, dt)
    // The canvas remains viewport-sized, so fit the sculpture to the animated
    // clipping window instead of relying on renderer resizing to magnify it.
    const projectScale = 0.72 * windowFit.current * (1 - recession * 0.42)
    const aboutScale = MathUtils.lerp(0.08, 0.52 * windowFit.current, aboutEntrance)
    const builderScale = MathUtils.lerp(aboutScale, aboutScale * (mobileLayout ? 0.9 : 0.84), builderVerticalExit)
    const targetScale = MathUtils.lerp(projectScale, builderScale, aboutEntrance)
    object.scale.setScalar(MathUtils.damp(object.scale.x, targetScale, 4, dt))
    // Flux remains mounted for reverse scrolling, but an invisible transparent
    // mesh must not continue writing depth over the Contact helix.
    const fluxVisible = fluxOpacity > 0.001
    object.visible = fluxVisible
    object.traverse(child => {
      if (child.material) {
        child.material.opacity = fluxOpacity
        child.material.depthWrite = fluxVisible
      }
    })
  })

  return (
    <>
    <group ref={sculpture} scale={[0.1, 0.1, 0.1]} rotation={[0.12, -0.42, -0.25]}>
      <group ref={revealGroup}>
        <group ref={floatGroup}>
          {orbitV2 ? (
            <>
              <group ref={outerPivot} rotation={[0.12, -0.18, 0.08]}>
                <mesh>
                  <orbitBandGeometry args={[1.36, 1.72, 0.24, 0.072, 0.34]} />
                  <meshPhysicalMaterial transparent color="#091326" metalness={0.5} roughness={0.052}
                    clearcoat={1} clearcoatRoughness={0.022} transmission={0.22} thickness={0.3}
                    ior={1.54} envMapIntensity={2.65} />
                </mesh>
              </group>
              <group ref={middlePivot} position={[0.22, 0.02, 0.2]} rotation={[0.74, -0.38, 0.92]}>
                <mesh>
                  <orbitBandGeometry args={[1.02, 1.02, 0.2, 0.066, -0.48]} />
                  <meshPhysicalMaterial transparent color="#101d37" metalness={0.43} roughness={0.06}
                    clearcoat={1} clearcoatRoughness={0.028} transmission={0.29} thickness={0.27}
                    ior={1.56} envMapIntensity={2.45} />
                </mesh>
              </group>
              <group ref={innerPivot} position={[-0.32, -0.04, -0.16]} rotation={[-0.6, 0.62, -0.56]}>
                <mesh>
                  <orbitBandGeometry args={[0.72, 0.78, 0.18, 0.06, 0.62]} />
                  <meshPhysicalMaterial transparent color="#0d1930" metalness={0.46} roughness={0.055}
                    clearcoat={1} clearcoatRoughness={0.025} transmission={0.27} thickness={0.28}
                    ior={1.55} envMapIntensity={2.55} />
                </mesh>
              </group>
            </>
          ) : orbit ? (
            <>
              <mesh rotation={[0.08, 0.16, 0.14]}>
                <orbitBandGeometry args={[1.38, 1.88, 0.24, 0.075]} />
                <meshPhysicalMaterial transparent color="#0b1426" metalness={0.46} roughness={0.055}
                  clearcoat={1} clearcoatRoughness={0.025} transmission={0.24} thickness={0.28}
                  ior={1.52} envMapIntensity={2.6} />
              </mesh>
              <mesh position={[0.28, 0.01, 0.24]} rotation={[0.92, -0.48, 0.86]} scale={[0.82, 0.72, 1]}>
                <orbitBandGeometry args={[1.22, 0.82, 0.21, 0.068]} />
                <meshPhysicalMaterial transparent color="#101c34" metalness={0.42} roughness={0.065}
                  clearcoat={1} clearcoatRoughness={0.03} transmission={0.3} thickness={0.26}
                  ior={1.54} envMapIntensity={2.45} />
              </mesh>
              <mesh position={[-0.34, -0.02, -0.18]} rotation={[-0.68, 0.58, -0.62]} scale={[0.7, 0.62, 1]}>
                <orbitBandGeometry args={[1.16, 0.78, 0.2, 0.065]} />
                <meshPhysicalMaterial transparent color="#0e1a31" metalness={0.44} roughness={0.06}
                  clearcoat={1} clearcoatRoughness={0.028} transmission={0.28} thickness={0.27}
                  ior={1.53} envMapIntensity={2.5} />
              </mesh>
            </>
          ) : (
            <>
              <mesh>
                <fluxGeometry args={[0]} />
                <meshPhysicalMaterial transparent color="#59616e" metalness={1} roughness={0.19}
                  clearcoat={0.8} clearcoatRoughness={0.13} envMapIntensity={2.2} />
              </mesh>
              <mesh>
                <fluxGeometry args={[1]} />
                <meshPhysicalMaterial transparent color="#3c4d68" metalness={1} roughness={0.23}
                  clearcoat={0.7} clearcoatRoughness={0.16} envMapIntensity={2.1} />
              </mesh>
            </>
          )}
        </group>
      </group>
    </group>
    <group ref={helixGroup}>
      <group scale={[1.25, 0.72, 1]}>
        <mesh geometry={helixGeometry[0].geometry}>
          <meshPhysicalMaterial transparent side={DoubleSide} color="#111a2c" metalness={0.78} roughness={0.08} clearcoat={1} clearcoatRoughness={0.025} envMapIntensity={3.25} emissive="#071225" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={helixGeometry[0].start}>
          <sphereGeometry args={[0.132, 18, 12]} />
          <meshPhysicalMaterial transparent side={DoubleSide} color="#111a2c" metalness={0.78} roughness={0.08} clearcoat={1} clearcoatRoughness={0.025} envMapIntensity={3.25} emissive="#071225" emissiveIntensity={0.12} />
        </mesh>
        <mesh position={helixGeometry[0].end}>
          <sphereGeometry args={[0.132, 18, 12]} />
          <meshPhysicalMaterial transparent side={DoubleSide} color="#111a2c" metalness={0.78} roughness={0.08} clearcoat={1} clearcoatRoughness={0.025} envMapIntensity={3.25} emissive="#071225" emissiveIntensity={0.12} />
        </mesh>
      </group>
      <group scale={[1.12, 0.66, 1]}>
        <mesh geometry={helixGeometry[1].geometry}>
          <meshPhysicalMaterial transparent side={DoubleSide} color="#253957" metalness={0.68} roughness={0.1} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={3.05} emissive="#0a172c" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={helixGeometry[1].start}>
          <sphereGeometry args={[0.132, 18, 12]} />
          <meshPhysicalMaterial transparent side={DoubleSide} color="#253957" metalness={0.68} roughness={0.1} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={3.05} emissive="#0a172c" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={helixGeometry[1].end}>
          <sphereGeometry args={[0.132, 18, 12]} />
          <meshPhysicalMaterial transparent side={DoubleSide} color="#253957" metalness={0.68} roughness={0.1} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={3.05} emissive="#0a172c" emissiveIntensity={0.1} />
        </mesh>
      </group>
    </group>
    </>
  )
}

// No positioning or expansion state here. Keep this component mounted and resize
// its parent window to transition to fullscreen; Fiber resizes the same renderer.
export default function SculptureScene({ pointerRef, controlRef }) {
  const animate = useSyncExternalStore(subscribeMotion, motionEnabled, () => false)
  return (
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6.7], fov: 36, near: 0.1, far: 30 }}
        style={{ position: 'absolute', left: '50%', top: '50%', width: '100vw', height: '100vh', transform: 'translate(-50%, -50%)' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        frameloop={animate ? 'always' : 'demand'}
        fallback={<span>3D preview unavailable</span>}>
        <StudioLighting />
        <FluxSculpture pointerRef={pointerRef} controlRef={controlRef} animate={animate} />
      </Canvas>
  )
}
