import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'

const makeCurves = mode => {
  if (mode === 'progressive') {
    return [
      new CatmullRomCurve3([new Vector3(-0.74, 0.1, 0.04), new Vector3(-0.34, 0.28, 0.12), new Vector3(0.36, 0.26, 0.12), new Vector3(0.76, 0.04, 0.04)]),
      new CatmullRomCurve3([new Vector3(-0.54, -0.22, 0.12), new Vector3(-0.16, -0.4, 0.02), new Vector3(0.42, -0.28, -0.06), new Vector3(0.68, 0.08, -0.02)]),
      new CatmullRomCurve3([new Vector3(-0.42, 0.2, -0.12), new Vector3(-0.1, 0.02, -0.18), new Vector3(0.18, -0.1, 0.12), new Vector3(0.5, 0.2, 0.06)]),
    ]
  }
  if (mode === 'unified') {
    return [
      new CatmullRomCurve3([new Vector3(-0.28, 0.08, 0.12), new Vector3(-0.08, 0.2, 0.2), new Vector3(0.18, 0.08, 0.12), new Vector3(0.34, -0.02, 0.02)]),
      new CatmullRomCurve3([new Vector3(-0.2, -0.14, -0.06), new Vector3(0.02, -0.22, 0.04), new Vector3(0.2, -0.04, -0.08), new Vector3(0.08, 0.16, 0.12)]),
      new CatmullRomCurve3([new Vector3(-0.12, 0.02, 0.18), new Vector3(0.04, 0.12, -0.02), new Vector3(0.22, 0.02, 0.18), new Vector3(0.04, -0.12, 0.04)]),
    ]
  }
  return [
    new CatmullRomCurve3([new Vector3(-0.72, 0.08, 0.06), new Vector3(-0.34, 0.26, 0.14), new Vector3(0.22, 0.2, 0.1), new Vector3(0.72, -0.04, 0.04)]),
    new CatmullRomCurve3([new Vector3(-0.54, -0.24, -0.08), new Vector3(-0.18, -0.36, 0.06), new Vector3(0.38, -0.22, -0.04), new Vector3(0.64, 0.12, 0.08)]),
    new CatmullRomCurve3([new Vector3(-0.4, 0.18, -0.12), new Vector3(-0.1, -0.02, 0.12), new Vector3(0.2, 0.08, -0.1), new Vector3(0.48, 0.24, 0.04)]),
  ]
}

export default function FormationMorphGeometry({ lifecycleRef, mode }) {
  const materialsRef = useRef([])
  const geometries = useMemo(() => makeCurves(mode).map(curve => new TubeGeometry(curve, 64, mode === 'unified' ? 0.055 : 0.035, 8, false)), [mode])

  useEffect(() => () => geometries.forEach(geometry => geometry.dispose()), [geometries])

  useFrame(() => {
    const state = lifecycleRef.current
    const progress = Math.max(0, Math.min(1, state.morphProgress || 0))
    const active = state.formationMode === mode && progress > 0.001 && progress < 1.02
    const reveal = mode === 'bridge' || mode === 'progressive' || mode === 'unified' ? progress : 0
    geometries.forEach(geometry => {
      const count = geometry.index?.count || geometry.attributes.position.count
      geometry.setDrawRange(0, Math.max(0, Math.floor(count * reveal)))
    })
    materialsRef.current.forEach(material => {
      material.opacity = active ? Math.min(0.88, reveal * 1.25) * (state.morphOpacity ?? 1) : 0
      material.emissiveIntensity = mode === 'unified' ? 0.12 : 0.06
    })
  })

  if (!['bridge', 'progressive', 'unified'].includes(mode)) return null
  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <meshPhysicalMaterial ref={material => { materialsRef.current[index] = material }} transparent color={mode === 'unified' ? '#24354d' : '#536d8c'} metalness={0.82} roughness={0.12} clearcoat={0.85} clearcoatRoughness={0.08} envMapIntensity={2.1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
