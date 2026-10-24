import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import TechText from './reactBits/components/typography/TechText/TechText'
import { measureHeroTextLine } from './heroTextLineGeometry'

function TechTextLine({ targetRef, text, settings, onCanvasReady, onCanvasError, visible, presentationReady, presentationRef, lifecycleRef, orbitDiagnostics }) {
  const [font, setFont] = useState(null)
  const measureContextRef = useRef(null)
  const portalRef = useRef(null)
  const presentationControlRef = useRef(null)
  const syncPresentationRef = useRef(null)
  const visibleRef = useRef(visible)
  visibleRef.current = visible

  useLayoutEffect(() => {
    const target = targetRef.current
    if (!target) return undefined
    let scrollFrame = 0
    const updateFont = reason => {
      const computed = getComputedStyle(target)
      const fontSize = Number.parseFloat(computed.fontSize) || 16
      const letterSpacing = Number.parseFloat(computed.letterSpacing)
      const rect = target.getBoundingClientRect()
      const computedLineHeight = Number.parseFloat(computed.lineHeight)
      const lineBoxHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : target.offsetHeight
      const scaleX = rect.width / Math.max(target.offsetWidth, 1) || 1
      const scaleY = rect.height / Math.max(lineBoxHeight, 1) || 1
      const lineMeasurement = measureHeroTextLine(target)
      measureContextRef.current ??= document.createElement('canvas').getContext('2d')
      const measureContext = measureContextRef.current
      if (measureContext) measureContext.font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`
      const fontMetrics = measureContext?.measureText(target.textContent || text)
      const ascent = fontMetrics?.fontBoundingBoxAscent || fontMetrics?.actualBoundingBoxAscent || fontSize * 0.8
      const descent = fontMetrics?.fontBoundingBoxDescent || fontMetrics?.actualBoundingBoxDescent || fontSize * 0.2
      const glyphPositions = lineMeasurement?.glyphPositions || {}
      presentationRef?.current?.entranceDiagnostics?.write('HeroTechTextLayer.updateFont() → React font/layout state', {
        line: text, reason: typeof reason === 'string' ? reason : reason?.type || 'ResizeObserver',
        originX: rect.left, originY: rect.top, width: rect.width, height: rect.height, fontSize, scaleX, scaleY,
      })
      setFont({
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        fontSize,
        letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing / fontSize : 0,
        originX: rect.left,
        originY: rect.top,
        scaleX,
        scaleY,
        hitWidth: rect.width,
        hitHeight: rect.height,
        baselineY: (lineBoxHeight - ascent - descent) / 2 + ascent,
        glyphPositions,
      })
    }
    const scheduleMeasure = () => {
      if (scrollFrame) return
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0
        updateFont('scroll measurement rAF')
      })
    }
    updateFont('initial layout effect')
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateFont) : null
    observer?.observe(target)
    document.fonts?.addEventListener?.('loadingdone', updateFont)
    window.addEventListener('resize', updateFont, { passive: true })
    window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true })
    return () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      observer?.disconnect()
      document.fonts?.removeEventListener?.('loadingdone', updateFont)
      window.removeEventListener('resize', updateFont)
      window.removeEventListener('scroll', scheduleMeasure, true)
    }
  }, [targetRef, text, orbitDiagnostics, presentationRef])

  const hasFont = Boolean(font)
  useLayoutEffect(() => {
    const target = targetRef.current
    const portal = portalRef.current
    if (!target || !portal || !hasFont) return undefined
    const section = target.closest('section')
    const diagnostics = presentationRef?.current?.entranceDiagnostics
    const unregister = diagnostics?.registerLine(text, {
      native: target, portal, renderer: portal.querySelector('.tech-text'), canvas: portal.querySelector('canvas'),
    })
    const syncPresentation = () => {
      // The loader's existing GSAP tween owns the section's opacity, translate
      // and blur. Portals escape that DOM ancestry, so mirror its actual state.
      const presentation = getComputedStyle(section || target)
      portal.style.opacity = visibleRef.current ? presentation.opacity : '0'
      portal.style.filter = presentation.filter
      const rect = target.getBoundingClientRect()
      diagnostics?.write('HeroTechTextLayer.syncPresentation() → outer portal style and bitmap origin', {
        line: text, permitted: visibleRef.current, opacity: portal.style.opacity, filter: portal.style.filter,
        nativeX: rect.left, nativeY: rect.top, controllerMounted: Boolean(presentationControlRef.current),
      })
      presentationControlRef.current?.setOrigin(rect.left, rect.top)
    }
    syncPresentationRef.current = syncPresentation
    const listeners = presentationRef?.current?.presentationListeners
    listeners?.add(syncPresentation)
    syncPresentation()
    return () => {
      listeners?.delete(syncPresentation)
      syncPresentationRef.current = null
      unregister?.()
    }
  }, [hasFont, targetRef, presentationRef, text])

  useLayoutEffect(() => {
    presentationRef?.current?.entranceDiagnostics?.write('HeroTechTextLayer React layout commit', {
      line: text, variant: settings.variant, hasFont, canvasesReady: visible, presentationReady, preparing: !presentationReady,
    })
    syncPresentationRef.current?.()
  })

  if (!font) return null

  const overlay = (
    <div
      ref={portalRef}
      className="hero-tech-text-portal"
      style={{ position: 'fixed', inset: 0, zIndex: 24, pointerEvents: 'none', opacity: 0 }}
      inert={!visible || !presentationReady}
      aria-hidden="true"
    >
      <TechText
        as="span"
        className="hero-tech-text-overlay"
        style={{ left: 0, top: 0, width: '100%', height: '100%', position: 'absolute', zIndex: 1, pointerEvents: 'none' }}
        text={text}
        heroLifecycleRef={lifecycleRef}
        fontFamily={font.fontFamily}
        fontWeight={font.fontWeight}
        fontSize={font.fontSize}
        letterSpacing={font.letterSpacing}
        color={settings.baseColor}
        accentColor={settings.accentColor}
        align="left"
        reach={settings.reach}
        softness={settings.softness}
        dashLength={settings.dashLength}
        dashGap={settings.dashGap}
        strokeWidth={settings.strokeWidth}
        lineStyle={settings.lineStyle}
        reveal={settings.reveal}
        specks={settings.specks}
        selection={settings.selection}
        labels={settings.labels}
        draggable={settings.draggable}
        clickKick={settings.clickKick}
        bounce={settings.bounce}
        sweep={settings.sweepEnabled && presentationReady}
        speed={settings.speed}
        intro={presentationReady ? settings.intro : 'none'}
        introDuration={settings.introDuration}
        guides={settings.guides}
        ariaHidden
        heroLayout
        viewportOverlay
        viewportTargetRef={targetRef}
        originX={font.originX}
        originY={font.originY}
        scaleX={font.scaleX}
        scaleY={font.scaleY}
        hitWidth={font.hitWidth}
        hitHeight={font.hitHeight}
        baselineY={font.baselineY}
        glyphPositions={font.glyphPositions}
        presentationControlRef={presentationControlRef}
        prepareOnly={!presentationReady}
        interactionEnabled={presentationReady}
        onCanvasReady={onCanvasReady}
        onCanvasError={onCanvasError}
        onDiagnosticFrame={text === 'BUILDING' ? orbitDiagnostics?.updateCanvas : undefined}
      />
    </div>
  )
  return createPortal(overlay, document.body)
}

export default function HeroTechTextLayer({ firstLineRef, secondLineRef, settings, onReady, onUnavailable, presentationReady = false, presentationRef, lifecycleRef, orbitDiagnostics = null }) {
  const lineStates = useRef({ first: 'pending', second: 'pending', reported: false })
  const [canvasesReady, setCanvasesReady] = useState(false)
  const [inert, setInert] = useState(() => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || window.matchMedia('(hover: none), (pointer: coarse)').matches
  ))
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setInert(reduced.matches || coarse.matches)
    update()
    reduced.addEventListener('change', update)
    coarse.addEventListener('change', update)
    return () => {
      reduced.removeEventListener('change', update)
      coarse.removeEventListener('change', update)
    }
  }, [])

  if (inert || !settings || settings.variant === 'solid') return null

  const settleLine = (line, status, error = null) => {
    if (lineStates.current[line] !== 'pending' || lineStates.current.reported) return
    presentationRef?.current?.entranceDiagnostics?.write('HeroTechTextLayer.settleLine() → canvas readiness', { line, status, error: error?.message })
    lineStates.current[line] = status
    if (status === 'failed') {
      lineStates.current.reported = true
      onUnavailable?.(error)
      return
    }
    if (lineStates.current.first === 'ready' && lineStates.current.second === 'ready') {
      lineStates.current.reported = true
      setCanvasesReady(true)
      onReady?.()
    }
  }

  return (
    <>
      <TechTextLine targetRef={firstLineRef} text="BUILDING" settings={settings} onCanvasReady={() => settleLine('first', 'ready')} onCanvasError={error => settleLine('first', 'failed', error)} visible={canvasesReady} presentationReady={presentationReady} presentationRef={presentationRef} lifecycleRef={lifecycleRef} orbitDiagnostics={orbitDiagnostics} />
      <TechTextLine targetRef={secondLineRef} text="WHAT'S NEXT." settings={settings} onCanvasReady={() => settleLine('second', 'ready')} onCanvasError={error => settleLine('second', 'failed', error)} visible={canvasesReady} presentationReady={presentationReady} presentationRef={presentationRef} lifecycleRef={lifecycleRef} orbitDiagnostics={orbitDiagnostics} />
    </>
  )
}
