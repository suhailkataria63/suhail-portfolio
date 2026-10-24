import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, CylinderGeometry, MeshPhysicalMaterial, TubeGeometry, Vector3 } from 'three'

const clamp = value => Math.max(0, Math.min(1, value))

export default function RefinedMinimalSculpture({ progressRef, animate }) {
  const { camera } = useThree()
  const groupRef = useRef(null)
  const glassRef = useRef(null)
  const arcRef = useRef(null)
  const glassMaterialRef = useRef(null)
  const arcMaterialRef = useRef(null)
  const elapsedRef = useRef(0)

  const glassGeometry = useMemo(() => new CylinderGeometry(1, 1, 0.14, 96, 4, false), [])
  const arcGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(-1.18, -0.56, 0.16),
      new Vector3(-0.68, -0.72, 0.24),
      new Vector3(0.02, -0.34, 0.12),
      new Vector3(0.82, 0.3, -0.02),
      new Vector3(1.18, 0.68, -0.12),
    ])
    return new TubeGeometry(curve, 96, 0.024, 12, false)
  }, [])

  const glassMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: '#8fa9c3',
    transparent: true,
    opacity: 0.02,
    transmission: 0.22,
    thickness: 0.16,
    roughness: 0.14,
    metalness: 0.08,
    ior: 1.45,
    clearcoat: 0.38,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.7,
    depthWrite: false,
  }), [])
  const arcMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: '#2e496b',
    metalness: 0.92,
    roughness: 0.16,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.3,
    transparent: true,
    opacity: 0,
  }), [])

  useEffect(() => {
    glassMaterialRef.current = glassMaterial
    arcMaterialRef.current = arcMaterial
    return () => {
      glassGeometry.dispose()
      arcGeometry.dispose()
      glassMaterial.dispose()
      arcMaterial.dispose()
    }
  }, [arcGeometry, arcMaterial, glassGeometry, glassMaterial])

  useEffect(() => {
    let frame = 0
    const measure = () => {
      const code = document.querySelector('[data-scene-three] [data-scene-code]')
      if (!code || !groupRef.current) return
      const width = Math.max(window.innerWidth, 1)
      const height = Math.max(window.innerHeight, 1)
      const codeRect = code.getBoundingClientRect()
      const screenFromWorld = world => {
        const projected = world.clone().project(camera)
        return { x: (projected.x * 0.5 + 0.5) * width, y: (-projected.y * 0.5 + 0.5) * height }
      }
      const worldFromScreen = (x, y) => {
        const ray = new Vector3((x / width) * 2 - 1, -(y / height) * 2 + 1, 0.5).unproject(camera)
        const direction = ray.sub(camera.position).normalize()
        return camera.position.clone().add(direction.multiplyScalar(-camera.position.z / direction.z))
      }
      const localCorners = [
        new Vector3(-1.34, -0.84, -0.12), new Vector3(-1.34, 0.84, 0.12),
        new Vector3(1.34, -0.84, -0.12), new Vector3(1.34, 0.84, 0.12),
      ]
      const bounds = localCorners.map(screenFromWorld)
      const currentWidth = Math.max(...bounds.map(point => point.x)) - Math.min(...bounds.map(point => point.x))
      const currentHeight = Math.max(...bounds.map(point => point.y)) - Math.min(...bounds.map(point => point.y))
      const left = width < 700 ? width * 0.14 : codeRect.right + 42
      const targetX = Math.max(currentWidth * 0.5 + 24, Math.min(width - currentWidth * 0.5 - 24, left + currentWidth * 0.5))
      const targetY = Math.max(currentHeight * 0.5 + 24, Math.min(height - currentHeight * 0.5 - 24, codeRect.top + codeRect.height * 0.5))
      const desired = worldFromScreen(targetX, targetY)
      groupRef.current.position.set(desired.x, desired.y, 0)
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    schedule()
    window.addEventListener('resize', schedule, { passive: true })
    document.fonts?.ready.then(schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
    }
  }, [camera])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    elapsedRef.current += Math.min(delta, 0.05)
    const progress = progressRef.current
    const reveal = clamp((progress - 0.12) / 0.2)
    const fill = clamp((progress - 0.16) / 0.28)
    const exit = clamp((progress - 0.58) / 0.17)
    const idle = animate ? elapsedRef.current : 0
    const entryRotation = (1 - fill) * 0.2
    const departure = exit * 0.16
    groupRef.current.rotation.x = entryRotation + Math.sin(idle * 0.24) * 0.012 * fill
    groupRef.current.rotation.y = -entryRotation * 0.65 + Math.cos(idle * 0.2) * 0.018 * fill
    groupRef.current.rotation.z = -0.18 + Math.sin(idle * 0.16) * 0.01 - departure
    groupRef.current.position.z = -departure * 0.7
    groupRef.current.scale.setScalar(0.9 + fill * 0.1 - exit * 0.06)
    const visibility = reveal * (1 - exit)
    if (glassMaterialRef.current) {
      glassMaterialRef.current.opacity = visibility * (0.32 + fill * 0.2)
      glassMaterialRef.current.color.setRGB(0.34 + fill * 0.08, 0.5 + fill * 0.08, 0.68 + fill * 0.1)
    }
    if (arcMaterialRef.current) {
      arcMaterialRef.current.opacity = visibility * (0.42 + fill * 0.32)
      arcMaterialRef.current.emissive?.setRGB(0.015, 0.035, 0.08)
      arcMaterialRef.current.emissiveIntensity = 0.2 + fill * 0.16
    }
    groupRef.current.visible = visibility > 0.001
  })

  return (
    <group ref={groupRef}>
      <mesh ref={glassRef} geometry={glassGeometry} rotation={[Math.PI / 2, 0, 0]} scale={[1.22, 0.82, 1]} material={glassMaterial} />
      <mesh ref={arcRef} geometry={arcGeometry} material={arcMaterial} />
    </group>
  )
}
