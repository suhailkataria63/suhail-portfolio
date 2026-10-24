import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial, Vector3 } from 'three'
import { makeRibbonParticleData } from './particleRibbonGeometry'
import { makeParticleDesignData } from './particleDesignGeometry'
import {
  CODE_DURATION,
  CODE_START,
  FILL_DURATION,
  FILL_START,
  OPENING_EXIT_DURATION,
  OPENING_EXIT_START,
  SCENE3_PROGRESS_SCALE,
} from '../sceneThreeTiming'

const DESKTOP_COUNT = 30000
const MOBILE_COUNT = 7000
const DESIGN_PARTICLE_BUDGETS = {
  vortex: { desktop: 14500, mobile: 4800 },
  gyroscope: { desktop: 8200, mobile: 3000 },
  ethereal: { desktop: 13000, mobile: 4400 },
}
// Enable only while diagnosing screen-space alignment.  The instrumentation is
// intentionally dormant in the normal portfolio presentation.
const DEBUG_PARTICLE_ALIGNMENT = false

const vertexShader = `
  attribute vec3 aColor;
  attribute vec3 aSeed;
  attribute float aSize;
  attribute float aOpacity;
  attribute vec4 aSurface;
  attribute vec3 aSurfaceNormal;
  attribute vec3 aFlow;
  attribute vec2 aMotion;
  uniform float uProgress;
  uniform float uExit;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMobile;
  uniform vec2 uPointer;
  uniform vec3 uPointerDirection;
  uniform float uPointerStrength;
  uniform float uDesignMotion;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec4 vSurface;
  varying float vOpacity;
  varying float vDepth;

  vec3 rotateAxis(vec3 value, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return value * c + cross(axis, value) * s + axis * dot(axis, value) * (1.0 - c);
  }

  void main() {
    float reveal = smoothstep(0.0, 1.0, uProgress);
    vec3 target = position;
    // Manually tuned placement: keep these offsets and the DOM fit unchanged.
    target.x = 1.74 + (target.x - 1.50) * 1.25;
    target.y *= 1.16;
    vec3 dispersed = target + vec3(
      (aSeed.x - 0.5) * (uDesignMotion > 0.5 ? 0.3 : 2.25),
      (aSeed.y - 0.5) * (uDesignMotion > 0.5 ? 0.24 : 1.9),
      (aSeed.z - 0.5) * (uDesignMotion > 0.5 ? 0.18 : 1.5)
    );
    vec3 point = mix(dispersed, target, reveal);
    // Keep the established production ribbon's broad flow exactly as authored.
    // The three design studies instead move along their stored structural
    // tangents below, so the motion cannot wash narrow bands into a cloud.
    if (uDesignMotion < 0.5) {
      float flow = uTime * 0.34 + target.x * 1.6 + target.y * 0.7;
      point.y += sin(flow) * 0.035 * reveal;
      point.z += cos(flow * 0.8 + target.y * 1.8) * 0.045 * reveal;
    }

    // Pointer is supplied in the FINAL model-local space, after all shader
    // placement offsets. Uncompress it only for the mobile deformation pass.
    // Intersect the pointer ray at EACH particle's depth. A single z=0
    // intersection would visibly drift on the front/rear faces of this loop.
    vec2 pointer = uPointer + uPointerDirection.xy *
      (point.z * (uMobile > 0.5 ? 0.72 : 1.0) / uPointerDirection.z);
    if (uMobile > 0.5) {
      pointer.x = (pointer.x - 0.48) / 0.42 + 1.25;
      pointer.y = (pointer.y + 0.2) / 0.72;
    }
    vec2 delta = pointer - point.xy;
    float distanceToPointer = max(length(delta), 0.001);
    float influence = exp(-dot(delta, delta) * 3.8) * reveal * uPointerStrength;
    point.xy += (delta / distanceToPointer) * influence * 0.15;

    vec3 surfaceNormal = aSurfaceNormal;
    if (uDesignMotion > 0.5) {
      // Slow, deterministic track motion: the gyroscope's five encoded bands
      // move around different axes and the ethereal strands drift separately.
      // The vortex is one coherent sculptural current (track zero).
      float track = floor(aSeed.z * 8.0);
      // Vortex currents share one slow body rotation; gyroscope bands and
      // ethereal strands retain their independent, low-speed axes.
      vec3 axis = uDesignMotion < 1.5
        ? normalize(vec3(0.32, 0.72, 0.44))
        : normalize(vec3(0.32 + mod(track, 3.0) * 0.18, 0.72 - mod(track, 2.0) * 0.22, 0.44 + mod(track, 4.0) * 0.08));
      float speed = uDesignMotion < 1.5
        ? 0.02
        : uDesignMotion < 2.5
          ? 0.006 + track * 0.001
          : 0.009 + track * 0.002;
      float angle = uTime * speed;
      vec3 center = vec3(1.74, 0.0, 0.0);
      point = center + rotateAxis(point - center, axis, angle);
      vec3 flowDirection = rotateAxis(aFlow, axis, angle);
      float pathPhase = aMotion.x * 6.2831853 + track * 0.71 + aMotion.y * 2.4;
      float flowRate = uDesignMotion < 1.5
        ? 0.11 + mod(track, 6.0) * 0.012
        : uDesignMotion < 2.5 ? 0.035 : 0.055 + mod(track, 6.0) * 0.008;
      float flowAmplitude = uDesignMotion < 1.5
        ? 0.0045
        : uDesignMotion < 2.5 ? 0.001 : 0.004;
      point += normalize(flowDirection + vec3(0.00001))
        * sin(uTime * flowRate + pathPhase) * flowAmplitude;
      surfaceNormal = rotateAxis(surfaceNormal, axis, angle);
    }

    vec3 outward = vec3(point.x - 1.74, point.y * 0.7, point.z + 0.05);
    point += outward / max(length(outward), 0.001) * uExit * 0.34;
    point.y += uExit * (aSeed.y - 0.5) * 0.24;
    if (uMobile > 0.5) {
      point.x = 0.48 + (point.x - 1.25) * 0.42;
      point.y = point.y * 0.72 - 0.2;
      point.z *= 0.72;
      surfaceNormal /= vec3(0.42, 0.72, 0.72);
    }
    vec4 mvPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float depthValue = clamp((point.z + 0.72) / 1.5, 0.0, 1.0);
    // Diameter in CSS pixels at the existing camera's reference depth, then
    // convert with the ACTUAL drawing-buffer ratio, not a separate DPR cap.
    float diameter = aSize * (6.7 / max(1.0, -mvPosition.z));
    diameter *= mix(0.9, 1.06, depthValue);
    gl_PointSize = max(mix(1.05, 0.72, aSurface.y), diameter) * uPixelRatio;
    // Static grain variation follows each particle; no time-based sparkle.
    vColor = aColor * (0.96 + aSeed.x * 0.08);
    vNormal = normalize(normalMatrix * surfaceNormal);
    vView = -mvPosition.xyz;
    vSurface = aSurface;
    vDepth = depthValue;
    vOpacity = reveal * (1.0 - uExit) * aOpacity * mix(1.0, 0.38, aSurface.y);
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec4 vSurface;
  varying float vOpacity;
  varying float vDepth;
  uniform float uColorStrength;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    // Opaque grain core and a narrow antialiased rim, with no soft halo.
    float coverage = 1.0 - smoothstep(0.32, 0.5, radius);
    float alpha = coverage * vOpacity;
    // Cut only the geometric rim; a threshold on animated alpha would delay
    // the reveal and truncate its reversible fade window.
    if (coverage < 0.12 || vOpacity <= 0.0001) discard;
    vec3 viewDirection = normalize(vView);
    vec3 n = normalize(vNormal);
    if (dot(n, viewDirection) < 0.0) n = -n;
    vec3 light = normalize(vec3(-0.4, 0.7, 0.65));
    float diffuse = max(0.0, dot(n, light));
    float fresnel = pow(1.0 - max(0.0, dot(n, viewDirection)), 3.0);
    float specular = pow(max(0.0, dot(n, normalize(light + viewDirection))), 36.0);
    float recess = mix(1.0, 0.56, vSurface.z) * (1.0 - vSurface.w * 0.16);
    float depthShade = mix(0.72, 1.04, smoothstep(0.1, 0.9, vDepth));
    float lighting = (0.46 + diffuse * 0.46) * recess * depthShade;
    vec3 base = mix(vec3(0.055, 0.075, 0.11), vColor, uColorStrength);
    vec3 shaded = base * lighting;
    // Broad, restrained metallic reflections roll over the exposed surfaces;
    // recessed grains stay graphite instead of receiving the same blue lift.
    shaded += vec3(0.1, 0.14, 0.21) * (specular * 0.16 + fresnel * 0.045) * recess * uColorStrength;
    float edgeLight = vSurface.x * (0.58 + 0.24 * fresnel + 0.18 * diffuse) * uColorStrength;
    float edgePeak = pow(vSurface.x, 2.4) * uColorStrength;
    vec3 silverBlue = mix(vColor, vec3(0.66, 0.78, 0.94), 0.66);
    shaded = mix(shaded, silverBlue, edgeLight);
    // A fine silver catch inside the fading blue band, never a separate line.
    shaded += vec3(0.14, 0.18, 0.24) * edgePeak * (0.35 + specular * 0.65);
    gl_FragColor = vec4(shaded, alpha);
    #include <colorspace_fragment>
  }
`

// Preserve the prior sampled envelope as placement metadata only. It no longer
// supplies rendered geometry; keeping it deterministic protects manual tuning.
function makePlacementReference(count) {
  const positions = new Float32Array(count * 3)
  let state = 0x51f15e
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  for (let index = 0; index < count; index += 1) {
    const strandCount = 96
    const strand = index % strandCount
    const t = (Math.floor(index / strandCount) + random() * 0.92) / Math.ceil(count / strandCount)
    const phase = (strand / strandCount) * Math.PI * 2
    const wave = Math.sin(t * Math.PI * 2.35 + phase * 0.7)
    const fold = Math.cos(t * Math.PI * 3.4 + phase) * 0.14
    const strandRatio = strand / (strandCount - 1)
    const region = random()
    const atmospheric = region > 0.92
    const internal = region < 0.22
    const edgeCandidate = strandRatio < 0.16 || strandRatio > 0.84
    if (!atmospheric && edgeCandidate) random()
    let ribbonWidth = (strandRatio - 0.5) * 0.34
    // Keep most grains on the designed ribbon surfaces. Internal grains form
    // darker folded layers; dust is sparse and remains within the silhouette.
    if (internal) ribbonWidth *= 0.58
    if (atmospheric) ribbonWidth += (random() - 0.5) * 0.12
    const widthNoise = (random() - 0.5) * 0.07
    const thickness = (random() - 0.5) * (atmospheric ? 0.4 : internal ? 0.26 : 0.16)
    const x = 1.22 + t * 1.92 + fold * 0.18 + widthNoise * Math.sin(phase)
    const y = 0.2 + wave * 0.62 + (ribbonWidth + widthNoise) * Math.cos(t * Math.PI * 2.2) + thickness * 0.16
    const z = Math.sin(t * Math.PI * 2.8 + phase * 0.45) * 0.34 + (ribbonWidth + widthNoise) * 0.8 + thickness
    const offset = index * 3
    positions[offset] = x
    positions[offset + 1] = y
    positions[offset + 2] = z
    // Consume the original seed/color/size draws to retain the exact sampled
    // envelope. Only the resulting positions are used as layout metadata.
    random()
    random()
    random()
    random()
    random()
  }
  return { positions }
}

export default function ParticleSculpture({ progressRef, animate, suspended = false, shape = 'ribbon', revealRange = null }) {
  const { camera, gl } = useThree()
  const groupRef = useRef(null)
  const pointsRef = useRef(null)
  const elapsedRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const pointerWorldRef = useRef(new Vector3())
  const pointerRayRef = useRef(new Vector3())
  const pointerDirectionRef = useRef(new Vector3())
  const layoutRayRef = useRef(new Vector3())
  const layoutDirectionRef = useRef(new Vector3())
  const layoutWorldRef = useRef(new Vector3())
  const renderedCenterRef = useRef(new Vector3())
  const debugStateRef = useRef({ dom: null, desired: null, cursor: null, shader: null, world: null, lastLog: 0 })
  const debugMarkersRef = useRef(null)
  const mobile = typeof window !== 'undefined' && window.innerWidth < 700
  const isDesignShape = Object.prototype.hasOwnProperty.call(DESIGN_PARTICLE_BUDGETS, shape)
  const count = isDesignShape
    ? DESIGN_PARTICLE_BUDGETS[shape][mobile ? 'mobile' : 'desktop']
    : mobile ? MOBILE_COUNT : DESKTOP_COUNT
  const data = useMemo(() => isDesignShape
    ? makeParticleDesignData(shape, count)
    : makeRibbonParticleData(count, makePlacementReference(count).positions, shape), [count, isDesignShape, shape])
  const particleBounds = useMemo(() => {
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity }
    for (let index = 0; index < data.positions.length; index += 3) {
      const xCenter = isDesignShape ? 1.5 : 2.08
      const x = 1.74 + (data.positions[index] - xCenter) * 1.25
      const y = data.positions[index + 1] * 1.16
      const z = data.positions[index + 2]
      bounds.minX = Math.min(bounds.minX, x)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxY = Math.max(bounds.maxY, y)
      bounds.minZ = Math.min(bounds.minZ, z)
      bounds.maxZ = Math.max(bounds.maxZ, z)
    }
    return bounds
  }, [data, isDesignShape])
  const geometry = useMemo(() => {
    const next = new BufferGeometry()
    next.setAttribute('position', new BufferAttribute(data.positions, 3))
    next.setAttribute('aColor', new BufferAttribute(data.colors, 3))
    next.setAttribute('aSeed', new BufferAttribute(data.seeds, 3))
    next.setAttribute('aSize', new BufferAttribute(data.sizes, 1))
    next.setAttribute('aOpacity', new BufferAttribute(data.opacities ?? new Float32Array(data.sizes.length).fill(1), 1))
    next.setAttribute('aSurfaceNormal', new BufferAttribute(data.normals, 3))
    next.setAttribute('aFlow', new BufferAttribute(data.flows ?? new Float32Array(data.sizes.length * 3), 3))
    next.setAttribute('aMotion', new BufferAttribute(data.motions ?? new Float32Array(data.sizes.length * 2), 2))
    next.setAttribute('aSurface', new BufferAttribute(data.surfaceData, 4))
    return next
  }, [data])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
    premultipliedAlpha: false,
    blending: NormalBlending,
    uniforms: {
      uProgress: { value: 0 },
      uColorStrength: { value: 0 },
      uExit: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: gl.getPixelRatio() },
      uMobile: { value: mobile ? 1 : 0 },
      uPointer: { value: [0, 0] },
      uPointerDirection: { value: new Vector3(0, 0, -1) },
      uPointerStrength: { value: 0 },
      uDesignMotion: { value: shape === 'vortex' ? 1 : shape === 'gyroscope' ? 2 : shape === 'ethereal' ? 3 : 0 },
    },
  }), [mobile, gl, isDesignShape, shape])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useEffect(() => {
    if (!animate) return undefined
    const onPointerMove = event => {
      if (event.pointerType === 'touch') return
      pointerRef.current.x = event.clientX
      pointerRef.current.y = event.clientY
      pointerRef.current.active = true
      if (DEBUG_PARTICLE_ALIGNMENT) debugStateRef.current.cursor = { x: event.clientX, y: event.clientY }
    }
    const reset = () => { pointerRef.current.active = false }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', reset)
    document.documentElement.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', reset)
      document.documentElement.removeEventListener('pointerleave', reset)
    }
  }, [animate])

  useEffect(() => {
    if (!DEBUG_PARTICLE_ALIGNMENT) return undefined
    const colors = ['#ff3b81', '#2a7fff', '#19a974', '#ff9f1c']
    const labels = ['desired DOM center', 'projected particle center', 'shader cursor', 'browser cursor']
    const layer = document.createElement('div')
    layer.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;font:10px/1.2 ui-monospace,monospace;'
    const markers = labels.map((label, index) => {
      const marker = document.createElement('span')
      marker.textContent = ` ${label}`
      marker.style.cssText = `position:fixed;width:8px;height:8px;border:1px solid ${colors[index]};border-radius:50%;color:${colors[index]};transform:translate(-50%,-50%);`
      layer.appendChild(marker)
      return marker
    })
    const log = document.createElement('pre')
    log.style.cssText = 'position:fixed;left:8px;bottom:8px;margin:0;padding:8px;background:#071120e8;color:#fff;white-space:pre-wrap;'
    layer.appendChild(log)
    document.body.appendChild(layer)
    debugMarkersRef.current = { markers, log }
    return () => {
      debugMarkersRef.current = null
      layer.remove()
    }
  }, [])

  useEffect(() => {
    let frame = 0
    let attempts = 0
    const measureLayout = () => {
      const kinetic = document.querySelector('[data-scene-three] [data-scene-layout]')
      const more = document.querySelector('[data-scene-three] [data-scene-more]')
      const than = document.querySelector('[data-scene-three] [data-scene-than]')
      const code = document.querySelector('[data-scene-three] [data-scene-code]')
      if (!kinetic || !more || !than || !code || !groupRef.current) {
        if (attempts < 8) {
          attempts += 1
          frame = requestAnimationFrame(measureLayout)
        }
        return
      }
      const width = Math.max(window.innerWidth, 1)
      const height = Math.max(window.innerHeight, 1)
      const mobileLayout = width < 700
      // Child spans receive scroll-driven transforms during the reveal. Use
      // their layout boxes for the anchor so a measurement made while the
      // scene is entering cannot bake the temporary translateY into the
      // sculpture position. The parent rect still includes the stable,
      // responsive scene centering transform.
      const moreRect = more.getBoundingClientRect()
      const thanRect = than.getBoundingClientRect()
      const codeRect = code.getBoundingClientRect()
      const layoutCodeRight = kinetic.getBoundingClientRect().left + code.offsetLeft + code.offsetWidth
      const codeTransform = getComputedStyle(code).transform
      const codeTransformValues = codeTransform.match(/matrix3d?\(([^)]+)\)/)?.[1]?.split(',').map(Number)
      const animatedCodeY = codeTransformValues?.length === 16
        ? codeTransformValues[13]
        : codeTransformValues?.length === 6
          ? codeTransformValues[5]
          : 0
      const codeCenterY = codeRect.top + codeRect.height * 0.5 - (Number.isFinite(animatedCodeY) ? animatedCodeY : 0)
      const screenFromWorld = world => {
        const projected = world.clone().project(camera)
        return { x: (projected.x * 0.5 + 0.5) * width, y: (-projected.y * 0.5 + 0.5) * height }
      }
      const worldFromScreen = (x, y) => {
        const ndcX = (x / width) * 2 - 1
        const ndcY = -(y / height) * 2 + 1
        layoutRayRef.current.set(ndcX, ndcY, 0.5).unproject(camera)
        layoutDirectionRef.current.copy(layoutRayRef.current).sub(camera.position).normalize()
        const distance = -camera.position.z / layoutDirectionRef.current.z
        return layoutWorldRef.current.copy(camera.position).add(layoutDirectionRef.current.multiplyScalar(distance))
      }
      const localCorners = [
        new Vector3(particleBounds.minX, particleBounds.minY, particleBounds.minZ),
        new Vector3(particleBounds.minX, particleBounds.minY, particleBounds.maxZ),
        new Vector3(particleBounds.minX, particleBounds.maxY, particleBounds.minZ),
        new Vector3(particleBounds.minX, particleBounds.maxY, particleBounds.maxZ),
        new Vector3(particleBounds.maxX, particleBounds.minY, particleBounds.minZ),
        new Vector3(particleBounds.maxX, particleBounds.minY, particleBounds.maxZ),
        new Vector3(particleBounds.maxX, particleBounds.maxY, particleBounds.minZ),
        new Vector3(particleBounds.maxX, particleBounds.maxY, particleBounds.maxZ),
      ].map(point => mobileLayout
        ? new Vector3(0.48 + (point.x - 1.25) * 0.42, point.y * 0.72 - 0.2, point.z * 0.72)
        : point)
      const localCenter = localCorners.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(1 / localCorners.length)
      renderedCenterRef.current.copy(localCenter)
      const projectedBounds = localCorners.map(screenFromWorld)
      const currentWidth = Math.max(...projectedBounds.map(point => point.x)) - Math.min(...projectedBounds.map(point => point.x))
      const currentHeight = Math.max(...projectedBounds.map(point => point.y)) - Math.min(...projectedBounds.map(point => point.y))
      // Place the *rendered particle bounds* in the open space to the right of
      // CODE and below THAN.  The DOM spans provide the composition anchors;
      // the projected bounds provide the actual footprint that must fit.
      const minInset = mobileLayout ? 20 : 42
      const left = mobileLayout ? width * 0.1 : layoutCodeRight + 42
      const minCenterX = currentWidth * 0.5 + minInset
      const maxCenterX = width - currentWidth * 0.5 - minInset
      const minCenterY = currentHeight * 0.5 + minInset
      const maxCenterY = height - currentHeight * 0.5 - minInset
      const targetX = Math.max(minCenterX, Math.min(maxCenterX, left + currentWidth * 0.5))
      // Keep the sculpture's visual center aligned with CODE's stable layout
      // center. Only clamp when the rendered bounds would otherwise clip the
      // viewport; the horizontal target remains unchanged.
      const targetY = Math.max(minCenterY, Math.min(maxCenterY, codeCenterY))
      const desiredWorld = worldFromScreen(targetX, targetY)
      // The shader expands the nominal ribbon around this local center.
      groupRef.current.position.set(desiredWorld.x - localCenter.x, desiredWorld.y - localCenter.y, 0)
      if (DEBUG_PARTICLE_ALIGNMENT) {
        const rect = kinetic.getBoundingClientRect()
        debugStateRef.current.dom = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, more: moreRect, than: thanRect, code: codeRect }
        debugStateRef.current.desired = { x: targetX, y: targetY }
        debugStateRef.current.world = { x: desiredWorld.x, y: desiredWorld.y, z: desiredWorld.z }
      }
    }
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measureLayout)
    }
    scheduleMeasure()
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    document.fonts?.ready.then(scheduleMeasure)
    document.fonts?.addEventListener?.('loadingdone', scheduleMeasure)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null
    const scene = document.querySelector('[data-scene-three]')
    if (scene && observer) observer.observe(scene)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', scheduleMeasure)
      document.fonts?.removeEventListener?.('loadingdone', scheduleMeasure)
      observer?.disconnect()
    }
  }, [camera, particleBounds])

  useFrame((_, delta) => {
    if (suspended) return
    if (!pointsRef.current) return
    elapsedRef.current += Math.min(delta, 0.05)
    const progress = progressRef.current
    const phase = progress * SCENE3_PROGRESS_SCALE
    const revealStart = revealRange?.startPhase ?? CODE_START
    const revealDuration = revealRange?.duration ?? CODE_DURATION
    const fillStart = revealRange?.fillStartPhase ?? FILL_START
    const reveal = Math.max(0, Math.min(1, (phase - revealStart) / revealDuration))
    const fill = Math.max(0, Math.min(1, (phase - fillStart) / FILL_DURATION))
    // Match SceneThree's coordinated Beyond exit window so the particle
    // ribbon clears with the headline before the constellation enters.
    const exit = Math.max(0, Math.min(1, (phase - OPENING_EXIT_START) / OPENING_EXIT_DURATION))
    material.uniforms.uProgress.value = reveal
    material.uniforms.uColorStrength.value = fill
    material.uniforms.uExit.value = exit
    material.uniforms.uTime.value = animate ? elapsedRef.current : 0
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    material.uniforms.uPointerStrength.value += ((pointerRef.current.active && animate ? 1 : 0) - material.uniforms.uPointerStrength.value) * (1 - Math.exp(-delta * 12))
    if (pointerRef.current.active) {
      const ndcX = (pointerRef.current.x / Math.max(window.innerWidth, 1)) * 2 - 1
      const ndcY = -(pointerRef.current.y / Math.max(window.innerHeight, 1)) * 2 + 1
      pointerRayRef.current.set(ndcX, ndcY, 0.5).unproject(camera)
      pointerDirectionRef.current.copy(pointerRayRef.current).sub(camera.position).normalize()
      const distance = -camera.position.z / pointerDirectionRef.current.z
      pointerWorldRef.current.copy(camera.position).add(pointerDirectionRef.current.multiplyScalar(distance))
      // World-to-local once: geometry's manually tuned shader offsets already
      // exist in the rendered particles and must not be applied to the cursor.
      groupRef.current.updateWorldMatrix(true, false)
      groupRef.current.worldToLocal(pointerWorldRef.current)
      const targetPointerX = pointerWorldRef.current.x
      const targetPointerY = pointerWorldRef.current.y
      // The target follows the real cursor immediately; the shader's soft
      // distance field provides the smooth particle response.
      material.uniforms.uPointer.value[0] = targetPointerX
      material.uniforms.uPointer.value[1] = targetPointerY
      material.uniforms.uPointerDirection.value.copy(pointerDirectionRef.current)
      if (DEBUG_PARTICLE_ALIGNMENT) {
        debugStateRef.current.shader = {
          x: material.uniforms.uPointer.value[0],
          y: material.uniforms.uPointer.value[1],
        }
      }
    }
    pointsRef.current.visible = reveal > 0.001 && exit < 0.999
    if (DEBUG_PARTICLE_ALIGNMENT && debugMarkersRef.current && progress > 0.001) {
      const projected = new Vector3(
        renderedCenterRef.current.x,
        renderedCenterRef.current.y,
        renderedCenterRef.current.z,
      ).add(groupRef.current.position).project(camera)
      const actual = { x: (projected.x * 0.5 + 0.5) * window.innerWidth, y: (-projected.y * 0.5 + 0.5) * window.innerHeight }
      const shader = debugStateRef.current.shader
      const shaderWorld = shader
        ? new Vector3(shader.x, shader.y, 0).add(groupRef.current.position).project(camera)
        : null
      const shaderScreen = shaderWorld
        ? { x: (shaderWorld.x * 0.5 + 0.5) * window.innerWidth, y: (-shaderWorld.y * 0.5 + 0.5) * window.innerHeight }
        : null
      const values = [debugStateRef.current.desired, actual, shaderScreen, debugStateRef.current.cursor]
      values.forEach((value, index) => {
        if (!value) return
        debugMarkersRef.current.markers[index].style.left = `${value.x}px`
        debugMarkersRef.current.markers[index].style.top = `${value.y}px`
      })
      if (performance.now() - debugStateRef.current.lastLog > 500) {
        debugStateRef.current.lastLog = performance.now()
        debugMarkersRef.current.log.textContent = JSON.stringify({
          domElementFound: Boolean(debugStateRef.current.dom),
          dom: debugStateRef.current.dom,
          desiredScreen: debugStateRef.current.desired,
          projectedScreen: actual,
          world: debugStateRef.current.world,
          groupPosition: { x: groupRef.current.position.x, y: groupRef.current.position.y, z: groupRef.current.position.z },
          cursorScreen: debugStateRef.current.cursor,
          shaderCursor: debugStateRef.current.shader,
          sceneProgress: progress,
        }, null, 2)
      }
    }
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
