import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import { FluxGeometry } from './FluxGeometry'
import { createStudioEnvironment } from './createStudioEnvironment'

extend({ FluxGeometry })

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
  const elapsed = useRef(0)
  const scrollProgress = useRef(0)
  const windowFit = useRef(0.14)
  const { invalidate } = useThree()

  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        // GSAP owns the progress value outside React. Always request a frame
        // after updating it so demand-mode roots cannot display a stale scene.
        setProgress: value => {
          scrollProgress.current = value
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
    // Frame-rate-independent damping keeps the interaction soft at any refresh rate.
    object.rotation.x = MathUtils.damp(object.rotation.x, 0.12 + pointer.y * 0.23 + progress * 0.22, 4, dt)
    object.rotation.y = MathUtils.damp(object.rotation.y, -0.42 + elapsed.current * 0.12 + pointer.x * 0.52 + progress * 0.5, 4, dt)
    object.rotation.z = MathUtils.damp(object.rotation.z, -0.25 + pointer.x * 0.06 - progress * 0.16, 4, dt)
    const parallax = 1 - progress
    object.position.x = MathUtils.damp(object.position.x, pointer.x * 0.10 * parallax, 3, dt)
    object.position.y = MathUtils.damp(object.position.y, pointer.y * 0.07 * parallax, 3, dt)
    object.position.z = MathUtils.damp(object.position.z, Math.abs(pointer.x) * 0.12 * parallax, 3, dt)
    // The canvas remains viewport-sized, so fit the sculpture to the animated
    // clipping window instead of relying on renderer resizing to magnify it.
    object.scale.setScalar(MathUtils.damp(object.scale.x, 0.72 * windowFit.current, 4, dt))
  })

  return (
    <group ref={sculpture} scale={[0.1, 0.1, 0.1]} rotation={[0.12, -0.42, -0.25]}>
      <mesh>
        <fluxGeometry args={[0]} />
        <meshPhysicalMaterial color="#59616e" metalness={1} roughness={0.19}
          clearcoat={0.8} clearcoatRoughness={0.13} envMapIntensity={2.2} />
      </mesh>
      <mesh>
        <fluxGeometry args={[1]} />
        <meshPhysicalMaterial color="#3c4d68" metalness={1} roughness={0.23}
          clearcoat={0.7} clearcoatRoughness={0.16} envMapIntensity={2.1} />
      </mesh>
    </group>
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
