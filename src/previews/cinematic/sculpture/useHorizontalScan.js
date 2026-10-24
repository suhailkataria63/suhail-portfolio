import { useLayoutEffect, useRef } from 'react'

// Temporary, opt-in diagnostics for the isolated scan presentation. Keep off
// by default so no console work is added to normal experiment playback.
export const DEBUG_HORIZONTAL_SCAN = false
const SCAN_BEAM_HEIGHT_PX = 22

// Renderer-owned scan copies retain a link to their unmodified PBR source so
// production can restore transmission continuously before releasing ownership.
const scanSources = new WeakMap()
export const horizontalScanSource = material => scanSources.get(material)

// Route-I-only material copies. Clip in projected coordinates rather than
// world Y or framebuffer pixels (the transmission pass has its own size).
export function useHorizontalScan(groupRef, enabled, lifecycleRef, role, centerTravelOnBounds = false) {
  const uniformsRef = useRef({ scanBoundary: { value: 1.1 }, scanRole: { value: role } })
  useLayoutEffect(() => {
    if (!enabled || !groupRef.current) return undefined
    // Both visual states reference one uniform object. A resize measurement
    // late in the frame therefore cannot leave their masks one frame apart.
    lifecycleRef.current.scanBoundaryUniform ??= { value: 1.1 }
    uniformsRef.current.scanBoundary = lifecycleRef.current.scanBoundaryUniform
    const originals = []
    groupRef.current.traverse(mesh => {
      if (!mesh.isMesh || !mesh.material) return
      const original = mesh.material
      const copyMaterial = source => {
        const material = source.clone()
        scanSources.set(material, source)
        material.transparent = false
        material.opacity = 1
        material.depthTest = true
        material.depthWrite = true
        // An opaque cut prevents refraction sampling the other visual state
        // across the boundary. All reflective PBR finish settings are kept.
        if ('transmission' in material) material.transmission = 0
        material.onBeforeCompile = shader => {
          Object.assign(shader.uniforms, uniformsRef.current)
          shader.vertexShader = 'varying vec4 vScanClip;\n' + shader.vertexShader.replace(
            '#include <project_vertex>', '#include <project_vertex>\nvScanClip = gl_Position;',
          )
          shader.fragmentShader = 'varying vec4 vScanClip;\nuniform float scanBoundary;\nuniform float scanRole;\n' + shader.fragmentShader.replace(
            '#include <clipping_planes_fragment>',
            `#include <clipping_planes_fragment>
             float scanY = vScanClip.y / vScanClip.w;
             if (scanRole > 0.0 ? scanY < scanBoundary : scanY >= scanBoundary) discard;`,
          ).replace('#include <opaque_fragment>', `
             float scanEdge = 1.0 - smoothstep(0.0, 0.006, abs(scanY - scanBoundary));
             outgoingLight = mix(outgoingLight, vec3(0.48, 0.65, 0.83), scanEdge * 0.5);
             #include <opaque_fragment>`)
        }
        material.customProgramCacheKey = () => 'formation-i-screen-cut'
        return material
      }
      mesh.material = Array.isArray(original) ? original.map(copyMaterial) : copyMaterial(original)
      originals.push({ mesh, original, copies: Array.isArray(mesh.material) ? mesh.material : [mesh.material] })
    })
    return () => {
      const recorder = lifecycleRef.current.handoffPerformance
      const started = recorder ? performance.now() : 0
      recorder?.note('scan material cleanup start', lifecycleRef.current, { role, meshes: originals.length })
      originals.forEach(({ mesh, original, copies }) => {
        mesh.material = original
        copies.forEach(material => { scanSources.delete(material); material.dispose() })
      })
      recorder?.note('scan material cleanup end', lifecycleRef.current, { role, durationMs: performance.now() - started })
    }
  }, [enabled, groupRef, lifecycleRef, role])
  return (height, canvasRect) => {
    if (!enabled) return
    const state = lifecycleRef.current
    const box = state.scanBounds
    const p = state.scanProgress || 0
    const rect = canvasRect || { top: 0, height }
    const canvasHeight = Math.max(rect.height || height, 1)
    // The approved ellipse preview scans symmetrically around the settled
    // projected sculpture bounds. Production retains its authored end near
    // the loading label.
    const centerY = box ? box.top + box.height * 0.5 : canvasHeight * 0.5
    const margin = centerTravelOnBounds && box
      ? Math.min(64, Math.max(36, box.height * 0.12))
      : Math.min(120, Math.max(80, canvasHeight * 0.1))
    const scanStart = centerTravelOnBounds && box
      ? centerY - (box.height * 0.5 + margin)
      : box ? box.top - margin : 0
    const scanEnd = centerTravelOnBounds && box
      ? centerY + (box.height * 0.5 + margin)
      : Math.max(0, canvasHeight - Math.max(90, canvasHeight * 0.12))
    const y = box ? scanStart + (scanEnd - scanStart) * p : 0
    const shaderBoundaryForProjection = 1 - 2 * y / canvasHeight
    const shaderBoundary = p <= 0 ? 1.1 : p >= 1 ? -1.1 : shaderBoundaryForProjection
    uniformsRef.current.scanBoundary.value = shaderBoundary
    const boundaryCssY = (rect.top || 0) + y
    state.scanBoundaryCssY = boundaryCssY
    if (centerTravelOnBounds && box) {
      state.scanCompositionCenterCssY = (rect.top || 0) + centerY
      state.scanStartCssY = (rect.top || 0) + scanStart
      state.scanEndCssY = (rect.top || 0) + scanEnd
    }
    // Convert the shader's NDC boundary back through the real canvas rect.
    // This is the value used for diagnostics and should equal boundaryCssY.
    state.scanShaderBoundaryCssY = (rect.top || 0) + (1 - shaderBoundaryForProjection) * canvasHeight * 0.5
    // Update the CSS marker from the same projected measurement/uniform path,
    // including when resized while the master timeline is paused.
    const lines = [state.scanLineElement, state.scanDiagnosticElement].filter(Boolean)
    lines.forEach(line => {
      // The beam is a CSS layer, but its center is computed from the exact
      // same projected scan position as the shader boundary. Production may
      // opt into a cached settled-cluster width; previews keep their original
      // viewport span. Expansion/contraction still uses the same channel.
      const expand = DEBUG_HORIZONTAL_SCAN ? 1 : (state.scanBeamExpand || 0)
      const isDiagnostic = line === state.scanDiagnosticElement
      const scanActive = state.phase === 'scanning' && p < 1
      line.style.opacity = DEBUG_HORIZONTAL_SCAN ? '1' : (isDiagnostic ? (scanActive ? '1' : '0') : String(state.scanBeamOpacity || 0))
      line.style.visibility = DEBUG_HORIZONTAL_SCAN || !isDiagnostic || scanActive ? 'visible' : 'hidden'
      if (!isDiagnostic) line.style.setProperty('--beam-expand', String(expand))
      // Keep the point legible during ignition and shutdown, then let the
      // expanded beam carry the scan without a second bright focal point.
      if (!isDiagnostic) line.style.setProperty('--beam-dot', String(Math.max(0, 1 - expand * 4)))
      const viewportWidth = window.innerWidth
      const clusterRatio = Number(line.dataset.clusterWidthRatio)
      const maximumWidth = clusterRatio > 0 && box?.visibleClusterWidth > 0
        ? box.visibleClusterWidth * clusterRatio
        : viewportWidth * 0.72
      line.style.left = '50%'
      line.style.width = `${Math.min(maximumWidth, viewportWidth - 32)}px`
      if (isDiagnostic) line.style.transform = 'translateX(-50%)'
      const desiredLineCenterY = DEBUG_HORIZONTAL_SCAN ? window.innerHeight * 0.5 : boundaryCssY
      const lineTop = isDiagnostic || !centerTravelOnBounds
        ? desiredLineCenterY
        : desiredLineCenterY - SCAN_BEAM_HEIGHT_PX * 0.5
      line.style.top = `${lineTop}px`
      if (DEBUG_HORIZONTAL_SCAN) {
        const now = performance.now()
        if (!line.__lastScanDebug || now - line.__lastScanDebug > 250) {
          line.__lastScanDebug = now
          const lineRect = line.getBoundingClientRect()
          console.info('[formation-i beam]', {
            opacity: getComputedStyle(line).opacity,
            visibility: getComputedStyle(line).visibility,
            zIndex: getComputedStyle(line).zIndex,
            rect: { left: lineRect.left, top: lineRect.top, width: lineRect.width, height: lineRect.height },
            scanProgress: p,
            timelineProgress: state.scanTimelineProgress || 0,
            boundaryY: boundaryCssY,
            shaderBoundaryY: state.scanShaderBoundaryCssY,
            canvas: { top: canvasRect?.top || 0, height: canvasHeight, dpr: window.devicePixelRatio || 1 },
            difference: boundaryCssY - state.scanShaderBoundaryCssY,
          })
        }
      }
    })
  }
}
