import { Profiler, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { addAfterEffect, Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, DoubleSide, Euler, MathUtils, Quaternion, TubeGeometry, Vector3 } from 'three'
import { FluxGeometry, OrbitBandGeometry } from './FluxGeometry'
import { createStudioEnvironment } from './createStudioEnvironment'
import ParticleSculpture from './ParticleSculpture'
import RefinedMinimalSculpture from './RefinedMinimalSculpture'
import LoadingSculpture from './LoadingSculpture'
import FormationMorphGeometry from './FormationMorphGeometry'
import { fitProjectedSculpture, projectedSculptureBounds } from './loaderChoreography'
import { horizontalScanSource, useHorizontalScan } from './useHorizontalScan'
import { HANDOFF_PERFORMANCE_DEBUG, createHandoffPerformanceRecorder } from './handoffPerformance'
import { prepareOrbitHandoff } from './prepareOrbitHandoff'

// Development-only experiment switch. Keep exactly one expensive sculpture mounted.
const BEYOND_VISUAL = 'particle'

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

function FluxSculpture({ pointerRef, controlRef, animate, loaderPreview = false, lifecycleRef, loaderFormation = null, productionLoader = false, onCanvasReady, particleShape = 'ribbon', particleRevealRange = null, loaderOrbitVariant = 'original', orbitDiagnostics = null, ditherVeilReplaceParticle = false }) {
  const { invalidate, camera, size, gl, scene } = useThree()
  const sculpture = useRef(null)
  const scanMode = loaderFormation === 'scan'
  const performanceRef = useRef(null)
  if (import.meta.env.DEV && HANDOFF_PERFORMANCE_DEBUG && scanMode
    && !lifecycleRef?.current?.noHandoff && !performanceRef.current) {
    performanceRef.current = createHandoffPerformanceRecorder()
  }
  useEffect(() => {
    const recorder = performanceRef.current
    if (!recorder) return undefined
    window.__orbitHandoffPerformance = recorder
    lifecycleRef.current.handoffPerformance = recorder
    const contextLost = () => recorder.note('WebGL context lost', lifecycleRef.current)
    const contextRestored = () => recorder.note('WebGL context restored', lifecycleRef.current)
    const visibilityChanged = () => recorder.note('document visibility changed', lifecycleRef.current, { documentHidden: document.hidden })
    gl.domElement.addEventListener('webglcontextlost', contextLost)
    gl.domElement.addEventListener('webglcontextrestored', contextRestored)
    document.addEventListener('visibilitychange', visibilityChanged)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', contextLost)
      gl.domElement.removeEventListener('webglcontextrestored', contextRestored)
      document.removeEventListener('visibilitychange', visibilityChanged)
      if (window.__orbitHandoffPerformance === recorder) delete window.__orbitHandoffPerformance
      if (lifecycleRef.current.handoffPerformance === recorder) delete lifecycleRef.current.handoffPerformance
    }
  }, [gl, lifecycleRef])
  useEffect(() => {
    performanceRef.current?.note('React commit effect', lifecycleRef?.current)
  })
  const updateScan = useHorizontalScan(sculpture, scanMode, lifecycleRef, 1, loaderOrbitVariant === 'perspective-ellipse')
  const scanFit = useRef({ key: '' })
  const revealGroup = useRef(null)
  const floatGroup = useRef(null)
  const outerPivot = useRef(null)
  const middlePivot = useRef(null)
  const innerPivot = useRef(null)
  const elapsed = useRef(0)
  // Production Formation I holds the child pivots at their authored poses.
  // Anchor the animated Euler channels to the last held pose when handoff
  // first takes ownership; retain this anchor when normal scrolling resumes.
  const orbitBandContinuity = useRef(null)
  const scrollProgress = useRef(0)
  const projectProgress = useRef(0)
  const aboutProgress = useRef(0)
  const aboutExit = useRef(0)
  const sceneThreeProgress = useRef(0)
  // Optional preview channels; ordinary callers keep the original shared
  // progress. Geometry, rendering and the loader ownership are unchanged.
  const particleProgress = useRef(0)
  const helixLayoutProgress = useRef(null)
  const contactProgress = useRef(0)
  const helixGroup = useRef(null)
  const windowFit = useRef(0.14)
  const orbitMaterialState = useRef(new Map())
  const loaderFit = useRef({ key: '', scale: 0.35 })
  // Captures the exact pose produced by the Formation-I scan. The loader
  // wrapper moves to the Hero window at the same time, so the Orbit itself
  // must interpolate from this pose instead of being reset when ownership
  // changes from the scan branch to the handoff branch.
  const handoffPose = useRef(null)
  const finalLoaderFrame = useRef(false)
  const productionScene = useRef(productionLoader)
  const diagnosticVector = useRef(new Vector3())
  const priorLoaderPreview = useRef(loaderPreview)
  const normalHeroFrameCount = useRef(0)
  useEffect(() => {
    if (priorLoaderPreview.current && !loaderPreview) {
      normalHeroFrameCount.current = 0
      orbitDiagnostics?.note('loader post-commit; R3F changed to normal Hero owner', { loaderPreview, previousLoaderPreview: true })
    }
    if (loaderPreview) normalHeroFrameCount.current = 0
    priorLoaderPreview.current = loaderPreview
  }, [loaderPreview, orbitDiagnostics])
  const publishOrbitDiagnostic = () => {
    if (!orbitDiagnostics?.enabled || !sculpture.current) return
    const object = sculpture.current
    object.updateWorldMatrix(true, true)
    const worldPosition = object.getWorldPosition(new Vector3())
    const projected = diagnosticVector.current.copy(worldPosition).project(camera)
    const canvas = gl.domElement.getBoundingClientRect()
    const wrapper = gl.domElement.closest('[data-sculpture-window]')
    const wrapperRect = wrapper?.getBoundingClientRect()
    orbitDiagnostics.updateOrbit({
      source: 'R3F useFrame · live Orbit world transform projected by active camera',
      worldPosition: object.getWorldPosition(new Vector3()).toArray(),
      worldQuaternion: object.getWorldQuaternion(new Quaternion()).toArray(),
      worldScale: object.getWorldScale(new Vector3()).toArray(),
      projectedCenter: { x: canvas.left + ((projected.x + 1) / 2) * canvas.width, y: canvas.top + ((1 - projected.y) / 2) * canvas.height, ndc: projected.toArray() },
      camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect, near: camera.near, far: camera.far, projection: camera.projectionMatrix.toArray() },
      canvasRect: { left: canvas.left, top: canvas.top, width: canvas.width, height: canvas.height },
      clippingWindowRect: wrapperRect ? { left: wrapperRect.left, top: wrapperRect.top, width: wrapperRect.width, height: wrapperRect.height, right: wrapperRect.right, bottom: wrapperRect.bottom } : null,
      visible: object.visible,
      loader: lifecycleRef?.current ? { phase: lifecycleRef.current.phase, handoff: lifecycleRef.current.handoff, committed: lifecycleRef.current.handoffCommitted, scanProgress: lifecycleRef.current.scanProgress } : null,
      scroll: { progress: scrollProgress.current, projects: projectProgress.current, about: aboutProgress.current, sceneThree: sceneThreeProgress.current, windowFit: windowFit.current },
      wrapperCss: wrapper ? { sculptureX: wrapper.style.getPropertyValue('--sculpture-x'), sculptureY: wrapper.style.getPropertyValue('--sculpture-y'), sculptureWidth: wrapper.style.getPropertyValue('--sculpture-width'), sculptureHeight: wrapper.style.getPropertyValue('--sculpture-height'), loaderLeft: wrapper.style.getPropertyValue('--loader-left'), loaderTop: wrapper.style.getPropertyValue('--loader-top'), loaderCanvasX: wrapper.style.getPropertyValue('--loader-canvas-x'), loaderCanvasY: wrapper.style.getPropertyValue('--loader-canvas-y') } : null,
    })
  }
  useEffect(() => {
    if (!productionLoader || !scanMode || !sculpture.current) return undefined
    // Lighting and private environments have mounted before this passive
    // effect. Readiness starts the unchanged timeline only after preparation.
    // All temporary material/renderer edits are restored synchronously.
    try {
      prepareOrbitHandoff(gl, scene, camera, sculpture.current, performanceRef.current, lifecycleRef.current)
    } catch (error) {
      performanceRef.current?.note('handoff preparation failed', lifecycleRef.current, { message: String(error) })
      // Preserve the existing drawable-Canvas/error fallback if warmup fails.
    }
    const frame = requestAnimationFrame(() => onCanvasReady?.())
    return () => cancelAnimationFrame(frame)
  }, [productionLoader, scanMode, gl, scene, camera, lifecycleRef, onCanvasReady])
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
          lifecycleRef?.current?.handoffDebug?.record('scroll.setProgress', value)
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
        setSceneThreeProgress: (value, particleValue = value) => {
          sceneThreeProgress.current = Math.max(0, Math.min(1, value))
          particleProgress.current = Math.max(0, Math.min(1, particleValue))
          invalidate()
        },
        setContactProgress: (value, layoutValue = null) => {
          contactProgress.current = Math.max(0, Math.min(1, value))
          helixLayoutProgress.current = layoutValue
          invalidate()
        },
        setViewport: (width, height) => {
          lifecycleRef?.current?.handoffDebug?.record('scroll.setViewport', { width, height })
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
    if (!animate && !loaderPreview && sculpture.current) {
      sculpture.current.rotation.set(0.12, -0.42, -0.25)
      sculpture.current.position.set(0, 0, 0)
      invalidate()
    }
    return () => {
      if (controlRef) controlRef.current = null
    }
  }, [animate, controlRef, invalidate, loaderPreview])

  // Keep each independent motion function, but apply its change since the
  // ownership boundary to the actual held pose: theta(t) = thetaHeld +
  // f(t) - f(t0). At t0 the change is exactly zero, including the sine channels.
  // No single elapsed-time value can reproduce all three authored ring poses.
  const updateOrbitBands = time => {
    if (!orbitV2) return
    const anchor = orbitBandContinuity.current
    if (outerPivot.current) {
      outerPivot.current.rotation.y = anchor
        ? anchor.outer.y + (time - anchor.time) * 0.075
        : time * 0.075
      outerPivot.current.rotation.x = anchor
        ? anchor.outer.x + (Math.sin(time * 0.17) - Math.sin(anchor.time * 0.17)) * 0.035
        : Math.sin(time * 0.17) * 0.035
    }
    if (middlePivot.current) {
      middlePivot.current.rotation.x = anchor
        ? anchor.middle.x - (time - anchor.time) * 0.125
        : -time * 0.125
      middlePivot.current.rotation.z = anchor
        ? anchor.middle.z + (Math.sin(time * 0.21 + 1.1) - Math.sin(anchor.time * 0.21 + 1.1)) * 0.06
        : Math.sin(time * 0.21 + 1.1) * 0.06
    }
    if (innerPivot.current) {
      innerPivot.current.rotation.z = anchor
        ? anchor.inner.z + (time - anchor.time) * 0.19
        : time * 0.19
      innerPivot.current.rotation.y = anchor
        ? anchor.inner.y + (Math.sin(time * 0.13 + 2.2) - Math.sin(anchor.time * 0.13 + 2.2)) * 0.1
        : Math.sin(time * 0.13 + 2.2) * 0.1
    }
  }

  useFrame((_, delta) => {
    if (performanceRef.current && lifecycleRef?.current) {
      performanceRef.current.sample(delta, lifecycleRef.current, gl, camera, scene)
    }
    const inspection = lifecycleRef?.current?.handoffDebug
    if (inspection?.frozen && inspection.pending !== 'SCAN_COMPLETE') return
    if (loaderPreview && scanMode && sculpture.current
      && lifecycleRef?.current?.phase !== 'handoff'
      && lifecycleRef?.current?.phase !== 'settling') {
      const state = lifecycleRef.current
      const object = sculpture.current
      const box = state.scanBounds
      object.visible = Boolean(box)
      // No growth or pose changes during the scan. The material mask is the
      // sole visibility owner, and this branch alone owns the Orbit transform.
      if (box) {
        const key = `${size.width}:${size.height}:${box.width}:${box.height}`
        if (scanFit.current.key !== key) {
          object.position.set(0, 0, 0)
          object.rotation.set(0.12, -0.42, -0.25)
          const widthFit = fitProjectedSculpture(object, camera, size.width, size.height, box.width)
          object.scale.setScalar(widthFit)
          let bounds = projectedSculptureBounds(object, camera, size.width, size.height)
          // Uniform fit preserves the original Orbit proportions. Match its
          // projected bounding center and fit within the cluster's envelope.
          object.scale.multiplyScalar(Math.min(1, box.height / bounds.height))
          bounds = projectedSculptureBounds(object, camera, size.width, size.height)
          const depth = new Vector3(0, 0, 0).project(camera).z
          const from = new Vector3((bounds.left + bounds.width / 2) / size.width * 2 - 1, 1 - (bounds.top + bounds.height / 2) / size.height * 2, depth).unproject(camera)
          const to = new Vector3((box.left + box.width / 2) / size.width * 2 - 1, 1 - (box.top + box.height / 2) / size.height * 2, depth).unproject(camera)
          object.position.copy(to.sub(from))
          scanFit.current.key = key
        }
        object.rotation.y = -0.42 + (state.reducedMotion ? 0 : state.scanTurn)
      }
      updateScan(size.height, gl.domElement.getBoundingClientRect())
      if (helixGroup.current) helixGroup.current.visible = false
      publishOrbitDiagnostic()
      return
    }
    if (loaderPreview) {
      const state = lifecycleRef.current
      const completed = state.phase === 'complete'
      const reveal = completed ? 1 : state.orbitReveal
      const travel = completed && !state.noHandoff ? 1 : state.handoff
      // Isolated experiments with noHandoff remain on their existing centered
      // presentation; only production's Hero transfer captures this pose.
      const handingOff = state.phase === 'handoff' || state.phase === 'settling' || (completed && !state.noHandoff)
      let inspectPreCommit = false
      if (animate && reveal > 0) elapsed.current += Math.min(delta, 0.05)
      const debug = state.handoffDebug
      const captureFirstBandWrite = debug?.enabled && handingOff && !debug.bandUpdate
      const readBandRotations = () => [outerPivot, middlePivot, innerPivot].flatMap(ref => ref.current ? [{
        name: ref.current.name, quaternion: ref.current.quaternion.toArray(), euler: ref.current.rotation.toArray(),
      }] : [])
      const beforeBandWrite = captureFirstBandWrite ? readBandRotations() : null
      if (scanMode && handingOff && !state.noHandoff && orbitV2 && !orbitBandContinuity.current
        && outerPivot.current && middlePivot.current && innerPivot.current) {
        // Capture before the first band write, after the existing shared clock
        // update. Both this first call and later normal Hero calls use the same
        // clock and anchor; changing loaderPreview never resets either one.
        orbitBandContinuity.current = {
          time: elapsed.current,
          outer: outerPivot.current.rotation.clone(),
          middle: middlePivot.current.rotation.clone(),
          inner: innerPivot.current.rotation.clone(),
        }
      }
      updateOrbitBands(elapsed.current)
      if (captureFirstBandWrite) {
        debug.captureBandWrite(beforeBandWrite, readBandRotations(), elapsed.current)
        debug.request('HANDOFF_FIRST_UPDATE')
      }
      if (sculpture.current) {
        const object = sculpture.current
        object.visible = reveal > 0.001
        // The scan branch owns the final formation pose. Capture it on the
        // first handoff frame before writing anything, then interpolate to
        // the normal Hero pose while the clipping window travels home. The
        // previous implementation reset position/rotation/scale here, which
        // created the visible "second Orbit" snap.
        if (handingOff && !handoffPose.current) {
          handoffPose.current = {
            position: object.position.clone(),
            quaternion: object.quaternion.clone(),
            scale: object.scale.clone(),
            targetQuaternion: new Quaternion(),
          }
        }
        const targetEuler = new Euler(0.12, -0.42 + elapsed.current * 0.12, -0.25)
        const targetQuaternion = handoffPose.current?.targetQuaternion
        if (targetQuaternion) targetQuaternion.setFromEuler(targetEuler)
        const fitKey = `${size.width}:${size.height}:${state.clusterPixels}`
        // Handoff uses the captured scan scale and measured Hero scale below.
        // Its first frame does not need the legacy loader fit's twelve
        // projected-bounds traversals (their result is unused during travel).
        if (!(scanMode && handingOff) && loaderFit.current.key !== fitKey) {
          loaderFit.current.key = fitKey
          loaderFit.current.scale = fitProjectedSculpture(
            object, camera, size.width, size.height,
            Math.min(state.clusterPixels || 340, size.width * 0.82),
          )
        }
        const target = state.heroTarget
        const heroFit = target
          ? Math.min(target.width / Math.max(window.innerWidth, 1), target.height / Math.max(window.innerHeight, 1))
          : windowFit.current
        // Exactly the normal Hero expression (no old minimum-scale clamp).
        const heroScale = 0.72 * heroFit
        if (handingOff && handoffPose.current && targetQuaternion) {
          const handoffStart = handoffPose.current
          const handoffT = MathUtils.clamp(travel, 0, 1)
          if (state.handoffCommitted) object.position.set(0, 0, 0)
          // Screen travel belongs to the Canvas CSS origin (SculptureWindow).
          // Converge only to the normal Hero local origin here. Translating
          // the Canvas moves every projected vertex equally, at every depth.
          else object.position.copy(handoffStart.position).multiplyScalar(1 - handoffT)
          object.quaternion.slerpQuaternions(handoffStart.quaternion, targetQuaternion, handoffT)
          if (!state.handoffCommitted && handoffT >= 0.999999) {
            if (state.handoffDebug?.enabled && !state.handoffDebug.seen.has('HANDOFF_PRE_COMMIT')) {
              state.handoffDebug.request('HANDOFF_PRE_COMMIT')
              inspectPreCommit = true
            } else {
              // At t=1 the local origin is already zero. The wrapper takes
              // over exactly the Canvas translation before this frame draws.
              object.position.set(0, 0, 0)
              state.commitHandoff?.()
              state.handoffDebug?.request('HANDOFF_POST_COMMIT')
            }
          }
        } else {
          object.position.set(0, 0, 0)
          object.rotation.copy(targetEuler)
        }
        // Formation starts with an Orbit silhouette roughly matching the
        // gathered five-form footprint. The showcase tween then grows it to
        // the measured loader size before the clipping window travels home.
        const orbitScaleProgress = MathUtils.clamp(state.orbitScale ?? 0, 0, 1)
        const compactFactor = state.formationMode === 'fusion'
          ? 0.42 + 0.58 * orbitScaleProgress
          : 0.56 + 0.44 * orbitScaleProgress
        const compactOrbitScale = loaderFit.current.scale * compactFactor
        const loaderPresentationScale = MathUtils.lerp(compactOrbitScale, loaderFit.current.scale, orbitScaleProgress)
        if (handingOff && handoffPose.current) {
          object.scale.setScalar(MathUtils.lerp(handoffPose.current.scale.x, heroScale, MathUtils.clamp(travel, 0, 1)))
        } else {
          object.scale.setScalar(MathUtils.lerp(loaderPresentationScale, heroScale, travel))
        }
        if (travel === 1) windowFit.current = heroFit
        object.traverse(child => {
          if (!child.material) return
          const material = child.material
          // Tested Version B: production scan copies stay non-transmissive
          // throughout travel and settling. After landing, useHorizontalScan
          // restores the untouched original Hero materials in layout cleanup.
          // Isolated experiments retain their existing transmission behavior.
          const scanSource = scanMode && handingOff ? horizontalScanSource(material) : null
          if (scanSource && 'transmission' in material) {
            const transmission = productionLoader
              ? 0
              : MathUtils.lerp(0, scanSource.transmission, MathUtils.clamp(travel, 0, 1))
            if ((material.transmission > 0) !== (transmission > 0)) {
              performanceRef.current?.note('transmission shader/pass transition', state, {
                material: material.uuid, from: material.transmission, to: transmission,
              })
              material.needsUpdate = true
            }
            material.transmission = transmission
          }
          if (!orbitMaterialState.current.has(material)) {
            orbitMaterialState.current.set(material, {
              transparent: material.transparent, depthWrite: material.depthWrite, opacity: material.opacity,
            })
          }
          const original = orbitMaterialState.current.get(material)
          if (!material.transparent) {
            performanceRef.current?.note('transparent program transition', state, { material: material.uuid })
            material.transparent = true
            material.needsUpdate = true
          }
          const bandOrder = state.formationMode === 'fusion' || state.formationMode === 'progressive'
            ? { orbitInner: 0, orbitMiddle: 1, orbitOuter: 2 }
            : { orbitOuter: 0, orbitMiddle: 1, orbitInner: 2 }
          const bandIndex = bandOrder[child.parent?.name]
          const constructionReveal = (state.formationMode === 'ring' || state.formationMode === 'fusion' || state.formationMode === 'progressive') && Number.isFinite(bandIndex)
            ? MathUtils.clamp((reveal - bandIndex * 0.18) * 1.9, 0, 1)
            : 1
          material.opacity = original.opacity * reveal * constructionReveal
          material.depthWrite = original.depthWrite && reveal > 0.98 && constructionReveal > 0.98
        })
      }
      if (helixGroup.current) helixGroup.current.visible = false
      // Record the final loader pose; original Hero materials return only
      // after movement finishes and loader ownership is released.
      if (inspectPreCommit) return
      if (state.phase === 'settling') {
        if (finalLoaderFrame.current) {
          const complete = state.onHandoffRendered
          state.onHandoffRendered = null
          complete?.()
        } else finalLoaderFrame.current = true
      } else finalLoaderFrame.current = false
      return
    }
    if (orbitMaterialState.current.size) {
      orbitMaterialState.current.forEach((state, material) => {
        if (material.transparent !== state.transparent) material.needsUpdate = true
        material.transparent = state.transparent
        material.depthWrite = state.depthWrite
        material.opacity = state.opacity
      })
      orbitMaterialState.current.clear()
    }
    if (!animate && helixGroup.current) helixGroup.current.visible = false
    if (!animate || !sculpture.current) return
    const dt = Math.min(delta, 0.05)
    elapsed.current += dt
    const object = sculpture.current
    const pointer = pointerRef.current
    const progress = scrollProgress.current
    const project = projectProgress.current
    const about = aboutProgress.current
    const builder = aboutExit.current
    const cardsProgress = sceneThreeProgress.current
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
    // Each band keeps its distinct period and axis, including through loading.
    updateOrbitBands(elapsed.current)
    if (helixGroup.current) {
      const entrance = MathUtils.smoothstep(Math.max(0, Math.min((contact - 0.16) / 0.32, 1)), 0.02, 0.92)
      helixGroup.current.visible = entrance > 0.001
      const contactLayout = MathUtils.smoothstep(helixLayoutProgress.current ?? contact, 0.86, 0.98)
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
    // SceneThree is an opaque DOM layer above the persistent canvas. During
    // its card window the canvas is promoted above that layer by the scroll
    // controller, so keep the underlying Orbit mesh out of that composition.
    const cardsActive = cardsProgress > 0.001 && cardsProgress < 0.999
    const fluxVisible = fluxOpacity > 0.001 && !cardsActive
    object.visible = fluxVisible
    object.traverse(child => {
      if (child.material) {
        child.material.opacity = fluxOpacity
        child.material.depthWrite = fluxVisible
      }
    })
    publishOrbitDiagnostic()
    if (!loaderPreview && normalHeroFrameCount.current < 8) {
      normalHeroFrameCount.current += 1
      orbitDiagnostics?.note(`first normal Hero frame ${normalHeroFrameCount.current}`, { progress: scrollProgress.current, objectPosition: sculpture.current?.position.toArray() })
    }
  })

  // Capture after this root has actually rendered. The previous rAF sampler
  // could leave a pending capture waiting on another browser callback while
  // the buttons silently refused to advance. The R3F hook also avoids reading
  // a pose from a different frame than the one presented by the renderer.
  useEffect(() => {
    const debug = lifecycleRef?.current?.handoffDebug
    if (!debug) return undefined
    debug.wake = invalidate
    const removeAfterRender = addAfterEffect(() => {
      if (!debug.enabled || !debug.pending || !sculpture.current) return
      const state = lifecycleRef.current
      const owner = !loaderPreview ? 'NORMAL_SCROLL' : state.phase === 'handoff' || state.phase === 'settling'
        ? 'HERO_HANDOFF' : state.scanProgress >= 1 ? 'ORBIT_HOLD' : 'FORMATION_I'
      debug.capture(sculpture.current, camera, gl, state, owner, elapsed.current, {
        progress: scrollProgress.current, windowFit: windowFit.current,
        about: aboutProgress.current, sceneThree: sceneThreeProgress.current,
      })
    })
    return () => {
      removeAfterRender()
      if (debug.wake === invalidate) debug.wake = null
    }
  }, [camera, gl, invalidate, lifecycleRef, loaderPreview])
  useFrame(() => {
    const debug = lifecycleRef?.current?.handoffDebug
    if (!debug?.enabled || !sculpture.current) return
    if (!loaderPreview && debug.seen.has('HANDOFF_POST_COMMIT') && !debug.seen.has('HERO_NORMAL')) {
      debug.request('HERO_NORMAL')
    }
  })

  return (
    <>
    <group ref={sculpture} visible={!loaderPreview} scale={[0.1, 0.1, 0.1]} rotation={[0.12, -0.42, -0.25]}>
      <group ref={revealGroup}>
        <group ref={floatGroup}>
          {orbitV2 ? (
            <>
              <group ref={outerPivot} name="orbitOuter" rotation={[0.12, -0.18, 0.08]}>
                <mesh>
                  <orbitBandGeometry args={[1.36, 1.72, 0.24, 0.072, 0.34]} />
                  <meshPhysicalMaterial transparent color="#091326" metalness={0.5} roughness={0.052}
                    clearcoat={1} clearcoatRoughness={0.022} transmission={0.22} thickness={0.3}
                    ior={1.54} envMapIntensity={2.65} />
                </mesh>
              </group>
              <group ref={middlePivot} name="orbitMiddle" position={[0.22, 0.02, 0.2]} rotation={[0.74, -0.38, 0.92]}>
                <mesh>
                  <orbitBandGeometry args={[1.02, 1.02, 0.2, 0.066, -0.48]} />
                  <meshPhysicalMaterial transparent color="#101d37" metalness={0.43} roughness={0.06}
                    clearcoat={1} clearcoatRoughness={0.028} transmission={0.29} thickness={0.27}
                    ior={1.56} envMapIntensity={2.45} />
                </mesh>
              </group>
              <group ref={innerPivot} name="orbitInner" position={[-0.32, -0.04, -0.16]} rotation={[-0.6, 0.62, -0.56]}>
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
    {loaderPreview
      ? <><LoadingSculpture animate={animate} lifecycleRef={lifecycleRef} scanMode={scanMode} orbitVariant={loaderOrbitVariant} />
          {['bridge', 'progressive', 'unified'].includes(loaderFormation)
            ? <FormationMorphGeometry lifecycleRef={lifecycleRef} mode={loaderFormation} />
            : null}
        </>
      : !productionScene.current && BEYOND_VISUAL === 'particle'
      ? (ditherVeilReplaceParticle ? null : <ParticleSculpture progressRef={particleProgress} animate={animate} shape={particleShape} revealRange={particleRevealRange} />)
      : !productionScene.current ? <RefinedMinimalSculpture progressRef={sceneThreeProgress} animate={animate} /> : null}
    {/* Production mounts the eventual scene once, before loader readiness.
        Avoid generating/sorting 30k particles in the completion React commit.
        This parent remains invisible and its pointer input stays disabled
        throughout loading; later scenes retain their original component. */}
    {productionScene.current && <Profiler id="production-particle-scene" onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
      performanceRef.current?.note('React particle commit', lifecycleRef.current, { reactPhase: phase, actualDuration, baseDuration, startTime, commitTime })
    }}><group visible={!loaderPreview}>
      {BEYOND_VISUAL === 'particle'
        ? (ditherVeilReplaceParticle ? null : <ParticleSculpture progressRef={particleProgress} animate={animate && !loaderPreview} suspended={loaderPreview} shape={particleShape} revealRange={particleRevealRange} />)
        : <RefinedMinimalSculpture progressRef={sceneThreeProgress} animate={animate && !loaderPreview} />}
    </group></Profiler>}
    <group ref={helixGroup} visible={!loaderPreview}>
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
export default function SculptureScene({ pointerRef, controlRef, loaderPreview = false, lifecycleRef, onCanvasReady, loaderFormation = null, productionLoader = false, particleShape = 'ribbon', particleRevealRange = null, loaderOrbitVariant = 'original', orbitDiagnostics = null, ditherVeilReplaceParticle = false }) {
  const animate = useSyncExternalStore(subscribeMotion, motionEnabled, () => false)
  // Preserve the Canvas placement used in the tested B run: the production
  // handoff translates its existing transform without changing layout bounds.
  const canvasPlacement = productionLoader
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%) translate(var(--loader-canvas-x, 0px), var(--loader-canvas-y, 0px))' }
    : { left: 'calc(50% + var(--loader-canvas-x, 0px))', top: 'calc(50% + var(--loader-canvas-y, 0px))', transform: 'translate(-50%, -50%)' }
  return (
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6.7], fov: 36, near: 0.1, far: 30 }}
        style={{ position: 'absolute', width: '100vw', height: '100vh', ...canvasPlacement }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          // Wait for one browser frame so readiness reflects a mounted,
          // drawable Canvas rather than only renderer construction.
          if (!productionLoader) requestAnimationFrame(() => onCanvasReady?.())
        }}
        frameloop={loaderPreview || animate ? 'always' : 'demand'}
        fallback={<span>3D preview unavailable</span>}>
        <StudioLighting />
        <FluxSculpture pointerRef={pointerRef} controlRef={controlRef} animate={animate} loaderPreview={loaderPreview} lifecycleRef={lifecycleRef} loaderFormation={loaderFormation} productionLoader={productionLoader} onCanvasReady={onCanvasReady} particleShape={particleShape} particleRevealRange={particleRevealRange} loaderOrbitVariant={loaderOrbitVariant} orbitDiagnostics={orbitDiagnostics} ditherVeilReplaceParticle={ditherVeilReplaceParticle} />
      </Canvas>
  )
}
