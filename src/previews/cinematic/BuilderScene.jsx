import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './BuilderScene.module.css'
import { depthMaterialize } from './ContactHeadlinePresets'

const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)
const BUILDER_EXIT_START = 0.78
const StrokeText = lazy(() => import('../experiments/reactBits/components/typography/StrokeText/StrokeText'))
const BuilderExploringMontage = lazy(() => import('./BuilderExploringMontage'))
const measurePaintedTextWidth = element => {
  if (!element) return { width: 0, left: 0 }
  const text = element.textContent ?? ''
  const computed = window.getComputedStyle(element)
  const advanceWidth = element.getBoundingClientRect().width || element.offsetWidth
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const devicePixel = 1 / (window.devicePixelRatio || 1)
  const strokeWidth = parseFloat(computed.webkitTextStrokeWidth) || 0
  if (!context || !text) return {
    width: advanceWidth + strokeWidth + devicePixel,
    left: strokeWidth / 2,
    fontSize: parseFloat(computed.fontSize) || 128,
    fontWeight: computed.fontWeight || 800,
    fontFamily: computed.fontFamily || 'inherit',
    letterSpacing: parseFloat(computed.letterSpacing) || 0,
  }

  context.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
  if ('fontKerning' in context) context.fontKerning = computed.fontKerning
  const hasCanvasLetterSpacing = 'letterSpacing' in context
  if (hasCanvasLetterSpacing) context.letterSpacing = computed.letterSpacing
  const metrics = context.measureText(text)
  const tracking = hasCanvasLetterSpacing ? 0 : (parseFloat(computed.letterSpacing) || 0) * Math.max(0, Array.from(text).length - 1)
  const left = Math.max(0, metrics.actualBoundingBoxLeft || 0) + strokeWidth / 2 + devicePixel / 2
  const right = Math.max(0, (metrics.actualBoundingBoxRight || 0) + tracking) + strokeWidth / 2 + devicePixel / 2
  return {
    width: Math.max(advanceWidth + strokeWidth + devicePixel, left + right, metrics.width + tracking + strokeWidth + devicePixel),
    left,
    fontSize: parseFloat(computed.fontSize) || 128,
    fontWeight: computed.fontWeight || 800,
    fontFamily: computed.fontFamily || 'inherit',
    letterSpacing: parseFloat(computed.letterSpacing) || 0,
  }
}
const sameTextBounds = (current, next) => Boolean(current)
  && Math.abs(current.width - next.width) < 0.25
  && Math.abs(current.left - next.left) < 0.25
  && Math.abs(current.fontSize - next.fontSize) < 0.05
  && current.fontWeight === next.fontWeight
  && current.fontFamily === next.fontFamily
  && Math.abs(current.letterSpacing - next.letterSpacing) < 0.05
  && current.layoutHeight === next.layoutHeight
  && current.baseline === next.baseline
export default function BuilderScene({ controlRef, separateEntryFromFill = false, creativeTypeExperiment = null, strokeTextExperiment = null }) {
  const sceneRef = useRef(null)
  const statementDepthRef = useRef(null)
  const statementRef = useRef(null)
  const lineRefs = useRef([])
  const introRef = useRef(null)
  const designingMeasureRef = useRef(null)
  const designingBaselineRef = useRef(null)
  const exploringMeasureRef = useRef(null)
  const exploringAnchorTextRef = useRef(null)
  const experimentRef = useRef(creativeTypeExperiment)
  const strokeTextExperimentRef = useRef(strokeTextExperiment)
  const previousDesigningActiveRef = useRef(false)
  const previousSceneActiveRef = useRef(false)
  const [designingBounds, setDesigningBounds] = useState(null)
  const [exploringMetrics, setExploringMetrics] = useState(null)
  const [sceneActive, setSceneActive] = useState(false)
  const [designingRowActive, setDesigningRowActive] = useState(false)
  experimentRef.current = creativeTypeExperiment
  strokeTextExperimentRef.current = strokeTextExperiment

  useLayoutEffect(() => {
    const measure = () => {
      const designing = designingMeasureRef.current
      if (designing) {
        const next = measurePaintedTextWidth(designing)
        if (strokeTextExperimentRef.current && designingBaselineRef.current) {
          next.layoutHeight = parseFloat(window.getComputedStyle(designing).lineHeight)
          next.baseline = designingBaselineRef.current.offsetTop
        }
        setDesigningBounds(current => sameTextBounds(current, next) ? current : next)
      }
      const exploring = exploringMeasureRef.current
      if (!exploring) return
      const rect = exploring.getBoundingClientRect()
      const computed = window.getComputedStyle(exploring)
      const fontLayoutWidth = exploring.offsetWidth || rect.width
      const fontSize = parseFloat(computed.fontSize) || 1
      const lineHeight = parseFloat(computed.lineHeight)
      const letterSpacing = parseFloat(computed.letterSpacing) || 0
      const fontMetricsContext = document.createElement('canvas').getContext('2d')
      const baseline = (() => {
        if (!fontMetricsContext) return fontSize * 0.75
        fontMetricsContext.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
        const fontMetrics = fontMetricsContext.measureText('EXPLORING')
        const ascent = Number(fontMetrics.fontBoundingBoxAscent || fontMetrics.actualBoundingBoxAscent || fontSize * 0.72)
        const descent = Number(fontMetrics.fontBoundingBoxDescent || fontMetrics.actualBoundingBoxDescent || fontSize * 0.2)
        const lineHeightPx = Number.isFinite(lineHeight) ? lineHeight : fontSize * 0.82
        return (lineHeightPx - ascent - descent) / 2 + ascent
      })()
      const lineStyle = lineRefs.current[2] ? window.getComputedStyle(lineRefs.current[2]) : null
      const trailingReserveValue = lineStyle?.getPropertyValue('--outline-right-reserve').trim() || '0.06em'
      const trailingReserve = trailingReserveValue.endsWith('em')
        ? (parseFloat(trailingReserveValue) || 0) * fontSize
        : (parseFloat(trailingReserveValue) || 0)
      const wordAdvanceWidth = exploringAnchorTextRef.current?.getBoundingClientRect().width || fontLayoutWidth
      const layoutWidth = wordAdvanceWidth + trailingReserve
      const nextMetrics = {
        // Keep the original line's fixed advance-plus-outline-reserve as its
        // layout anchor. SVG paint bounds may extend the media viewport below.
        width: layoutWidth,
        layoutWidth,
        height: exploring.offsetHeight || rect.height,
        fontSize,
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        tracking: letterSpacing / fontSize,
        lineHeight: Number.isFinite(lineHeight) ? lineHeight / fontSize : 0.82,
        baseline,
      }
      setExploringMetrics(current => {
        if (!current) return nextMetrics
        const materiallyChanged = Math.abs(current.width - nextMetrics.width) >= 0.25
          || Math.abs(current.height - nextMetrics.height) >= 0.25
          || Math.abs(current.fontSize - nextMetrics.fontSize) >= 0.05
          || current.fontFamily !== nextMetrics.fontFamily
          || current.fontWeight !== nextMetrics.fontWeight
          || Math.abs(current.tracking - nextMetrics.tracking) >= 0.001
          || Math.abs(current.lineHeight - nextMetrics.lineHeight) >= 0.001
          || Math.abs(current.baseline - nextMetrics.baseline) >= 0.25
        return materiallyChanged ? nextMetrics : current
      })
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (designingMeasureRef.current) observer?.observe(designingMeasureRef.current)
    if (exploringMeasureRef.current) observer?.observe(exploringMeasureRef.current)
    if (lineRefs.current[2]) observer?.observe(lineRefs.current[2])
    window.addEventListener('resize', measure)
    let alive = true
    document.fonts?.ready?.then(() => { if (alive) measure() }).catch(() => {})
    return () => {
      alive = false
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [
    creativeTypeExperiment?.comparison,
    creativeTypeExperiment?.exploring?.enabled,
    strokeTextExperiment?.comparison,
    strokeTextExperiment?.enabled,
  ])

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: (value, choreography) => {
        const progress = clamp(value)
        // Reserve a short white handoff after the previous scene has faded.
        const local = clamp((progress - 0.18) / 0.82)
        const reveal = ease(clamp(local / 0.22))
        const fillStart = separateEntryFromFill ? 0.22 : 0.16
        const fill = clamp(choreography?.fill ?? (local - fillStart) / 0.32)
        const reposition = ease(clamp(choreography?.reposition ?? (local - 0.38) / 0.3))
        const exit = ease(clamp((local - BUILDER_EXIT_START) / (1 - BUILDER_EXIT_START)))
        const sceneOpacity = progress > 0 ? 1 - exit : 0
        const backgroundOpacity = Math.min(1, progress / 0.28)
        const sceneIsActive = Boolean(experimentRef.current || strokeTextExperimentRef.current) && local > 0 && exit < 1
        if (sceneIsActive !== previousSceneActiveRef.current) {
          previousSceneActiveRef.current = sceneIsActive
          setSceneActive(sceneIsActive)
        }

        if (sceneRef.current) {
          sceneRef.current.style.opacity = `${sceneOpacity}`
          sceneRef.current.style.setProperty('--builder-bg', `${backgroundOpacity}`)
        }
        lineRefs.current.forEach((line, index) => {
          if (!line) return
          const lineReveal = clamp((reveal - index * 0.08) / (separateEntryFromFill ? 1 - index * 0.08 : 0.92))
          line.style.opacity = `${lineReveal * (1 - exit)}`
          line.style.transform = `translate3d(0, ${(1 - lineReveal) * 105 - exit * 70}%, 0)`
          if (index === 1 && (experimentRef.current || strokeTextExperimentRef.current)) {
            const designingVisible = lineReveal > 0 && exit < 1
            const designingActive = designingVisible && sceneIsActive
            if (designingActive !== previousDesigningActiveRef.current) {
              previousDesigningActiveRef.current = designingActive
              setDesigningRowActive(designingActive)
            }
          }
        })
        if (statementRef.current) {
          statementRef.current.style.transform = `translate3d(${reposition * -2}vw, ${reposition * -4}vh, 0) scale(${1 - reposition * 0.14})`
          statementRef.current.style.opacity = `${1 - exit}`
        }
        if (statementDepthRef.current) {
          const material = depthMaterialize(1 - exit, 0, 1)
          statementDepthRef.current.style.opacity = `${material.opacity}`
          statementDepthRef.current.style.filter = material.filter
          statementDepthRef.current.style.transform = material.transform
        }
        lineRefs.current.slice(1, 3).forEach(line => {
          if (line) line.style.color = `rgba(16, 23, 34, ${fill})`
        })
        if (introRef.current) {
          introRef.current.style.opacity = `${reposition * (1 - exit)}`
          introRef.current.style.transform = `translate3d(${(1 - reposition) * 3}vw, ${exit * -2}vh, 0)`
        }
        // The Threads preview keeps this white cover transparent to its
        // background, but still needs its original occlusion of the Orbit.
        return sceneOpacity * backgroundOpacity
      },
    }
    controlRef.current.setProgress(0)
    return () => { controlRef.current = null }
  }, [controlRef])

  const isExperimental = creativeTypeExperiment?.comparison === 'experimental'
  const isStrokeTextExperimental = strokeTextExperiment?.comparison === 'experimental'
  const showStrokeText = isStrokeTextExperimental && strokeTextExperiment.enabled
  const maskExploring = isExperimental && creativeTypeExperiment?.exploring?.enabled
  const exploring = creativeTypeExperiment?.exploring ?? {}
  const montageSources = (exploring.montageSources ?? []).map(source => source.trim()).filter(Boolean)
  const exploringMaskWidth = exploringMetrics?.width ?? 0
  const exploringAnchorHeight = exploringMetrics
    ? (strokeTextExperiment ? exploringMetrics.lineHeight * exploringMetrics.fontSize : exploringMetrics.height)
    : 0
  const maskStyle = exploringMetrics ? {
    position: 'absolute',
    width: `${exploringMaskWidth}px`,
    height: `${exploringMetrics.height}px`,
    // The in-flow anchor starts at the line's origin. Keep positioning rooted
    // there; only the visual viewport expands to the right for SVG paint.
    left: '0px',
    top: '0px',
    display: 'inline-block',
    verticalAlign: 'baseline',
    fontFamily: exploringMetrics.fontFamily,
    WebkitTextStroke: '0 transparent',
    pointerEvents: sceneActive ? 'auto' : 'none',
  } : undefined
  const maskViewportStyle = exploringMetrics ? {
    width: `${exploringMaskWidth}px`,
    height: `${exploringMetrics.height}px`,
    pointerEvents: sceneActive ? 'auto' : 'none',
  } : undefined
  const maskLineStyle = maskExploring && exploringMetrics
    ? { '--mask-paint-overflow': `${Math.max(0, exploringMaskWidth - exploringMetrics.layoutWidth)}px` }
    : undefined

  return (
    <section ref={sceneRef} className={`${styles.scene} ${creativeTypeExperiment ? styles.creativeTypeScene : ''} ${strokeTextExperiment ? styles.strokeTextScene : ''}`} data-builder-scene aria-label="About — The Builder">
      <div ref={statementDepthRef} className={styles.statementDepth}>
        <div ref={statementRef} className={styles.statement}>
          <span ref={element => { lineRefs.current[0] = element }} className={`${styles.line} ${styles.solid}`}>I LIKE</span>
          <span ref={element => { lineRefs.current[1] = element }} className={`${styles.line} ${styles.outline}`}>
            {showStrokeText ? (
              <>
                <span ref={designingMeasureRef} className={styles.designingAnchor} aria-hidden="true">DESIGNING<i ref={designingBaselineRef} className={styles.baselineMeasure} /></span>
                {designingBounds?.width ? (
                  <Suspense fallback={null}>
                    <StrokeText
                      className={styles.strokeTextVisual}
                      style={{ width: `${designingBounds.width}px`, color: '#101722' }}
                      text="DESIGNING"
                      trigger={strokeTextExperiment.loop ? 'loop' : 'mount'}
                      fillDuration={1.2}
                      active={designingRowActive}
                      replayKey={strokeTextExperiment.replayKey ?? 0}
                      fontSize={designingBounds.fontSize}
                      fontWeight={designingBounds.fontWeight}
                      fontFamily={designingBounds.fontFamily}
                      letterSpacing={designingBounds.letterSpacing}
                      layoutWidth={designingBounds.width}
                      layoutHeight={designingBounds.layoutHeight}
                      layoutBaseline={designingBounds.baseline}
                    />
                  </Suspense>
                ) : null}
              </>
            ) : 'DESIGNING'}
          </span>
          <span ref={element => { lineRefs.current[2] = element }} className={`${styles.line} ${styles.outline} ${maskExploring ? styles.maskedLine : ''}`} style={maskLineStyle}>
            {maskExploring ? (
              <>
                <span ref={exploringMeasureRef} className={styles.wordMeasure} aria-hidden="true">EXPLORING</span>
                <span
                  className={styles.exploringWordAnchor}
                  style={exploringMetrics ? { width: `${exploringMetrics.layoutWidth}px`, height: `${exploringAnchorHeight}px` } : undefined}
                >
                  <span ref={exploringAnchorTextRef} className={styles.exploringAnchorText} aria-hidden="true">EXPLORING</span>
                {exploringMetrics?.width > 0 ? (
                  <span
                    className={styles.maskViewport}
                    role={strokeTextExperiment ? 'img' : undefined}
                    aria-label={strokeTextExperiment ? 'EXPLORING' : undefined}
                    style={maskViewportStyle}
                  >
                    <Suspense fallback={<span className={styles.maskFallback} style={maskStyle}>EXPLORING</span>}>
                        <BuilderExploringMontage
                          sources={montageSources}
                          width={exploringMetrics.layoutWidth}
                          height={exploringAnchorHeight}
                          baseline={exploringMetrics.baseline}
                          fontFamily={exploringMetrics.fontFamily}
                          fontSize={exploringMetrics.fontSize}
                          fontWeight={exploringMetrics.fontWeight}
                          letterSpacing={exploringMetrics.tracking * exploringMetrics.fontSize}
                          clipDuration={exploring.clipDuration ?? 3}
                          crossfadeDuration={exploring.crossfadeDuration ?? 0.5}
                          playing={exploring.montagePlaying ?? true}
                          paused={!sceneActive}
                          fillScale={exploring.fillScale ?? 1.25}
                          brightness={exploring.brightness ?? 1}
                          saturation={exploring.saturation ?? 0.85}
                        />
                    </Suspense>
                  </span>
                ) : <span className={styles.maskFallback}>EXPLORING</span>}
                </span>
              </>
            ) : 'EXPLORING'}
          </span>
          <span ref={element => { lineRefs.current[3] = element }} className={`${styles.line} ${styles.solid} ${styles.building}`}>BUILDING <em>— THINGS THAT MATTER.</em></span>
        </div>
      </div>
      <div ref={introRef} className={styles.intro}>
        <span className={styles.eyebrow}>ABOUT / THE BUILDER</span>
        <p>I&apos;m a developer who enjoys turning ideas into useful products. I love building AI-powered web applications, exploring new technologies, and creating software that solves real problems.</p>
      </div>
    </section>
  )
}
