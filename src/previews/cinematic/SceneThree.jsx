import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './SceneThree.module.css'
import ToolkitRotatingHeading from '../experiments/ToolkitRotatingHeading'
import { normalizeToolkitWord } from '../experiments/toolkitRotatingSettings'
import {
  ARRANGEMENT_DURATION,
  ARRANGEMENT_START,
  COMPOSITION_BODY_DURATION,
  COMPOSITION_BODY_START,
  COMPOSITION_DURATION,
  COMPOSITION_START,
  CODE_DURATION,
  CODE_START,
  CONSTELLATION_DURATION,
  CONSTELLATION_START,
  FILL_DURATION,
  FILL_START,
  FINAL_REVEAL_DURATION,
  FINAL_REVEAL_START,
  JUST_DURATION,
  JUST_START,
  OPENING_EXIT_DURATION,
  OPENING_EXIT_START,
  SCENE3_PROGRESS_SCALE,
  SUPPORT_DURATION,
  SUPPORT_START,
  TITLE_DURATION,
} from './sceneThreeTiming'

const skills = [
  { name: 'Python', description: 'Clear logic, data workflows, and practical automation.', a: [22, 38], b: [18, 30], size: 'large' },
  { name: 'React', description: 'Interfaces that stay useful, expressive, and fast.', a: [67, 28], b: [76, 34], size: 'large' },
  { name: 'Next.js', description: 'Structured product surfaces with a sharp edge.', a: [82, 58], b: [72, 68], size: 'medium' },
  { name: 'FastAPI', description: 'Small, direct services for ambitious ideas.', a: [30, 73], b: [25, 63], size: 'medium' },
  { name: 'AI / ML', description: 'Models shaped around real decisions and outcomes.', a: [52, 18], b: [48, 26], size: 'large' },
  { name: 'RAG', description: 'Grounded retrieval for more capable systems.', a: [78, 78], b: [84, 72], size: 'small' },
  { name: 'APIs', description: 'Thoughtful connections between products and data.', a: [14, 58], b: [20, 70], size: 'small' },
  { name: 'Data Science', description: 'Finding signal, then turning it into direction.', a: [55, 84], b: [58, 76], size: 'medium' },
]
const links = [[0, 4], [1, 4], [1, 2], [2, 5], [3, 7], [0, 3], [4, 7], [6, 0]]
const orbitConfig = [
  { ring: 0, angle: -2.65 }, { ring: 1, angle: -1.95 }, { ring: 0, angle: -1.05 }, { ring: 1, angle: -0.35 },
  { ring: 0, angle: 0.1 }, { ring: 1, angle: 0.9 }, { ring: 0, angle: 1.95 }, { ring: 1, angle: 2.65 },
]
const clamp = value => Math.max(0, Math.min(1, value))
const ease = value => 1 - ((1 - value) ** 3)
const GradientText = lazy(() => import('../experiments/reactBits/components/typography/GradientText/GradientText'))
const CodeMetallicWord = lazy(() => import('../experiments/code-metallic/CodeMetallicWord'))
const CuriosityTypewriterLine = lazy(() => import('../experiments/CuriosityTypewriterLine'))

export default function SceneThree({ controlRef, fillStartPhase = FILL_START, background = null, backgroundLifecycleRef = null, ditherVisual = null, ditherVeilPreview = false, gradientTextExperiment = null, toolkitExperiment = null, curiosityExperiment = null }) {
  const sceneRef = useRef(null)
  const sectionLabelRef = useRef(null)
  const moreRef = useRef(null)
  const justRef = useRef(null)
  const codeRef = useRef(null)
  const codeFillRef = useRef(null)
  const codeOpacityRef = useRef(0)
  const codeFillOpacityRef = useRef(0)
  const gradientEnabled = Boolean(gradientTextExperiment?.enabled)
  const gradientEnabledRef = useRef(gradientEnabled)
  const gradientActiveRef = useRef(false)
  const [gradientActive, setGradientActive] = useState(false)
  gradientEnabledRef.current = gradientEnabled
  const supportRef = useRef(null)
  const constellationRef = useRef(null)
  const compositionCopyRef = useRef(null)
  const compositionTitleRef = useRef(null)
  const compositionBodyRef = useRef(null)
  const toolkitExperimentRef = useRef(toolkitExperiment)
  const toolkitActiveRef = useRef(false)
  const [toolkitActive, setToolkitActive] = useState(false)
  const [toolkitWord, setToolkitWord] = useState('TOOLS')
  toolkitExperimentRef.current = toolkitExperiment
  const orbitSystemRef = useRef(null)
  const sphereRef = useRef(null)
  const nodeRefs = useRef([])
  const lineRefs = useRef([])
  const orbitRefs = useRef([])
  const finalRef = useRef(null)
  const curiosityExperimentRef = useRef(curiosityExperiment)
  curiosityExperimentRef.current = curiosityExperiment
  // Publish only actual activity edges. An entry counter preserves a fast
  // exit/re-entry even when React batches both notifications into one render.
  const curiosityLifecycleRef = useRef({ snapshot: { active: false, entry: 0 }, listeners: new Set() })
  const ditherVisualRef = useRef(null)
  const ditherOpacityRef = useRef(0)
  const contactExitRef = useRef(0)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const interactionRef = useRef({ hovered: null, selected: null })

  useEffect(() => {
    if (!controlRef) return undefined
    const publishCuriosity = active => {
      const lifecycle = curiosityLifecycleRef.current
      if (lifecycle.snapshot.active === active) return
      lifecycle.snapshot = { active, entry: lifecycle.snapshot.entry + (active ? 1 : 0) }
      lifecycle.listeners.forEach(update => update())
    }
    const publishBackground = (opacity, active = opacity > 0) => {
      if (!backgroundLifecycleRef) return
      const lifecycle = backgroundLifecycleRef.current
      lifecycle.opacity = opacity
      lifecycle.active = active
      lifecycle.listeners.forEach(update => update())
    }
    controlRef.current = {
      setProgress: (value, choreography) => {
        const progress = clamp(value)
        const phase = progress * SCENE3_PROGRESS_SCALE
        const titleIn = ease(clamp(phase / TITLE_DURATION))
        const fill = clamp(choreography?.fill ?? (phase - fillStartPhase) / FILL_DURATION)
        const constellation = ease(clamp((phase - CONSTELLATION_START) / CONSTELLATION_DURATION))
        const arrangement = ease(clamp(choreography?.arrangement ?? (phase - ARRANGEMENT_START) / ARRANGEMENT_DURATION))
        const openingExit = ease(clamp((phase - OPENING_EXIT_START) / OPENING_EXIT_DURATION))
        const finalEntrance = ease(clamp((phase - FINAL_REVEAL_START) / FINAL_REVEAL_DURATION))
        const finalReveal = finalEntrance * (1 - contactExitRef.current)
        // Use the authored final-scene entrance and completed Contact exit,
        // rather than treating an eased opacity sample as a timer lifecycle.
        publishCuriosity(Boolean(curiosityExperimentRef.current)
          && phase > FINAL_REVEAL_START && contactExitRef.current < 1)
        const constellationFade = choreography ? ease(clamp(choreography.constellationExit)) : finalReveal
        // Reuse the authored Beyond entrance. The scene's existing opacity
        // supplies the Curious-to-Contact fade, so the background has no
        // internal fade at the opening/Toolkit/Curious boundaries.
        const beyondVisible = progress > 0 && titleIn > 0
        publishBackground(beyondVisible ? titleIn : 0,
          beyondVisible && contactExitRef.current < 1)
        if (sceneRef.current) sceneRef.current.style.opacity = progress > 0 ? `${1 - contactExitRef.current}` : '0'
        if (moreRef.current) {
          moreRef.current.style.opacity = `${titleIn * (1 - openingExit)}`
          moreRef.current.style.transform = `translate3d(0, ${(1 - titleIn) * 80 - openingExit * 65}px, 0)`
        }
        if (sectionLabelRef.current) {
          sectionLabelRef.current.style.opacity = `${titleIn * (1 - openingExit)}`
          sectionLabelRef.current.style.transform = `translate3d(0, ${(1 - titleIn) * 80 - openingExit * 65}px, 0)`
        }
        if (justRef.current) {
          const justIn = ease(clamp((phase - JUST_START) / JUST_DURATION))
          justRef.current.style.opacity = `${justIn * (1 - openingExit)}`
          justRef.current.style.transform = `translate3d(0, ${(1 - justIn) * 80 - openingExit * 65}px, 0)`
        }
        if (codeRef.current) {
          const codeIn = ease(clamp((phase - CODE_START) / CODE_DURATION))
          const codeOpacity = codeIn * (1 - openingExit)
          codeOpacityRef.current = codeOpacity
          codeRef.current.style.opacity = `${codeOpacity}`
          codeRef.current.style.transform = `translate3d(0, ${(1 - codeIn) * 80 - openingExit * 65}px, 0)`
          const active = gradientEnabledRef.current && codeOpacity > 0 && contactExitRef.current < 1
          if (active !== gradientActiveRef.current) {
            gradientActiveRef.current = active
            setGradientActive(active)
          }
          if (ditherVisualRef.current) {
            const ditherOpacity = codeIn * (1 - openingExit)
            ditherOpacityRef.current = ditherOpacity
            ditherVisualRef.current.style.display = ditherOpacity > 0.001 ? 'block' : 'none'
            ditherVisualRef.current.style.opacity = `${ditherOpacity}`
            ditherVisualRef.current.style.pointerEvents = ditherOpacity > 0.01 ? 'auto' : 'none'
          }
        }
        codeFillOpacityRef.current = fill
        if (codeFillRef.current) codeFillRef.current.style.opacity = `${fill}`
        if (supportRef.current) {
          const supportIn = ease(clamp(choreography?.support ?? (phase - SUPPORT_START) / SUPPORT_DURATION))
          supportRef.current.style.opacity = `${supportIn * (1 - openingExit)}`
          supportRef.current.style.transform = `translate3d(0, ${(1 - supportIn) * 22 - openingExit * 30}px, 0)`
        }
        if (constellationRef.current) {
          constellationRef.current.style.opacity = `${constellation * (1 - constellationFade)}`
          constellationRef.current.style.transform = `translate3d(0, ${constellation < 1 ? (1 - constellation) * 40 : -constellationFade * 80}px, 0) scale(${0.92 + constellation * 0.08})`
        }
        const compositionIn = ease(clamp((phase - COMPOSITION_START) / COMPOSITION_DURATION))
        // The same authored heading and constellation visibility envelopes
        // gate React Bits' sole word timer; this adds no timeline or threshold.
        const toolkitVisible = Boolean(toolkitExperimentRef.current) && compositionIn > 0 && constellation > 0 && constellationFade < 1 && contactExitRef.current < 1
        if (toolkitVisible !== toolkitActiveRef.current) {
          toolkitActiveRef.current = toolkitVisible
          setToolkitActive(toolkitVisible)
        }
        if (compositionCopyRef.current) compositionCopyRef.current.style.opacity = `${compositionIn * (1 - constellationFade)}`
        if (compositionTitleRef.current) compositionTitleRef.current.style.transform = `translate3d(0, ${(1 - compositionIn) * 24}px, 0)`
        if (compositionBodyRef.current) compositionBodyRef.current.style.transform = `translate3d(0, ${(1 - ease(clamp((phase - COMPOSITION_BODY_START) / COMPOSITION_BODY_DURATION))) * 18}px, 0)`
        if (sphereRef.current) {
          sphereRef.current.style.opacity = `${constellation * (1 - constellationFade)}`
          sphereRef.current.style.transform = `translate(calc(-50% + var(--parallax-x, 0px)), calc(-50% + var(--parallax-y, 0px))) scale(${0.7 + (choreography ? arrangement : constellation) * 0.3})`
        }
        nodeRefs.current.forEach((node, index) => {
          if (!node) return
          const config = orbitConfig[index]
          const radiusX = config.ring === 0 ? 35 : 27
          const radiusY = config.ring === 0 ? 28 : 20
          const angle = config.angle + arrangement * (config.ring === 0 ? 0.72 : -0.9)
          const x = 50 + Math.cos(angle) * radiusX
          const y = 50 + Math.sin(angle) * radiusY
          node.style.left = `${x}%`
          node.style.top = `${y}%`
          const nodePhase = choreography
            ? CONSTELLATION_START + choreography.constellationEntry * (CONSTELLATION_DURATION + (orbitConfig.length - 1) * 0.025)
            : phase
          const nodeReveal = ease(clamp((nodePhase - CONSTELLATION_START - index * 0.025) / CONSTELLATION_DURATION))
          node.style.opacity = `${nodeReveal * (1 - constellationFade)}`
          node.style.pointerEvents = nodeReveal > 0.01 && constellationFade < 0.99 ? 'auto' : 'none'
          node.style.setProperty('--depth', `${(index % 3 - 1) * 18}px`)
          node.style.transform = `translate(calc(-50% + var(--parallax-x, 0px)), calc(-50% + var(--parallax-y, 0px))) translateZ(var(--depth)) scale(${0.7 + constellation * 0.3})`
        })
        lineRefs.current.forEach((line, index) => {
          if (!line) return
          const [from, to] = links[index]
          const getPoint = indexValue => {
            const config = orbitConfig[indexValue]
            const angle = config.angle + arrangement * (config.ring === 0 ? 0.72 : -0.9)
            return [50 + Math.cos(angle) * (config.ring === 0 ? 35 : 27), 50 + Math.sin(angle) * (config.ring === 0 ? 28 : 20)]
          }
          const [x1, y1] = getPoint(from)
          const [x2, y2] = getPoint(to)
          const curveX = (x1 + x2) / 2 + (index % 2 === 0 ? 4 : -4)
          const curveY = (y1 + y2) / 2 + (index % 2 === 0 ? -6 : 6)
          line.setAttribute('d', `M ${x1} ${y1} Q ${curveX} ${curveY} ${x2} ${y2}`)
          const length = line.dataset.length || line.getTotalLength()
          line.dataset.length = length
          line.style.strokeDasharray = length
          line.style.strokeDashoffset = length * (1 - constellation)
          const focusedSkill = interactionRef.current.hovered ?? interactionRef.current.selected
          const related = focusedSkill === null || links[index].includes(focusedSkill)
          line.style.opacity = `${constellation * (1 - constellationFade) * (related ? 0.55 : 0.12)}`
        })
        orbitRefs.current.forEach((orbit, index) => {
          if (!orbit) return
          const length = orbit.dataset.length || orbit.getTotalLength()
          orbit.dataset.length = length
          orbit.style.strokeDasharray = length
          orbit.style.strokeDashoffset = length * (1 - constellation)
          orbit.style.opacity = `${constellation * (1 - constellationFade) * (index === 0 ? 0.72 : 0.46)}`
        })
        if (finalRef.current) {
          finalRef.current.style.opacity = `${finalReveal}`
          finalRef.current.style.transform = `translate3d(0, ${(1 - finalReveal) * 55}px, 0)`
        }
      },
      setContactExit: value => {
        contactExitRef.current = clamp(value)
        if (contactExitRef.current === 1) publishCuriosity(false)
      },
    }
    controlRef.current.setProgress(0)
    return () => {
      publishCuriosity(false)
      publishBackground(0)
      controlRef.current = null
    }
  }, [controlRef, fillStartPhase, backgroundLifecycleRef])

  useLayoutEffect(() => {
    const layer = ditherVisualRef.current
    if (!layer) return
    const opacity = ditherOpacityRef.current
    layer.style.display = opacity > 0.001 ? 'block' : 'none'
    layer.style.opacity = `${opacity}`
    layer.style.pointerEvents = opacity > 0.01 ? 'auto' : 'none'
  }, [ditherVisual])

  useLayoutEffect(() => {
    const active = gradientEnabled && codeOpacityRef.current > 0 && contactExitRef.current < 1
    if (active !== gradientActiveRef.current) {
      gradientActiveRef.current = active
      setGradientActive(active)
    }
    if (codeFillRef.current) codeFillRef.current.style.opacity = `${codeFillOpacityRef.current}`
  }, [gradientEnabled])

  const active = hovered ?? selected
  const toolkitExperimental = toolkitExperiment?.comparison === 'experimental'
  const reaction = toolkitExperiment?.reaction ?? {}
  const reactive = toolkitExperimental && reaction.enabled && toolkitActive
  const normalizedWord = normalizeToolkitWord(toolkitWord)
  const toolkitNode = skills.findIndex(skill => normalizeToolkitWord(skill.name) === normalizedWord)
  const toolsAll = normalizedWord === 'TOOLS' && reaction.toolsBehavior === 'all'
  const toolsSphere = reactive && normalizedWord === 'TOOLS' && reaction.toolsBehavior === 'sphere'
  return (
    <section
      ref={sceneRef}
      className={`${styles.scene} ${toolkitExperimental ? styles.toolkitTypeScene : ''} ${toolkitExperimental && reaction.enabled ? styles.toolkitReactive : ''}`}
      style={toolkitExperimental ? {
        '--toolkit-node-brightness': reaction.brightness,
        '--toolkit-glow': reaction.glow,
        '--toolkit-label-brightness': reaction.labelBrightness,
        '--toolkit-highlight-duration': `${reaction.duration}ms`,
        '--toolkit-highlight-color': reaction.color,
      } : undefined}
      data-scene-three
      data-dither-veil-active={ditherVeilPreview ? 'true' : undefined}
      data-ghost-fibers={backgroundLifecycleRef ? 'enabled' : undefined}
      aria-label="More than just code"
    >
      {background}
      {ditherVisual && <div ref={ditherVisualRef} className={styles.ditherVisual} aria-hidden="true">{ditherVisual}</div>}
      <div className={styles.kinetic} data-scene-layout aria-hidden="true">
        <span ref={sectionLabelRef} className={styles.sectionLabel}>BEYOND / EXPLORATIONS</span>
        <span ref={moreRef} data-scene-more>MORE <span data-scene-than>THAN</span></span>
        <span ref={justRef}>JUST</span>
        <span ref={codeRef} className={`${styles.code} ${gradientEnabled ? styles.gradientCode : ''}`} data-scene-code>
          {gradientEnabled ? <><Suspense fallback="CODE">{gradientTextExperiment.mode && gradientTextExperiment.mode !== 'gradient' ? <CodeMetallicWord
            mode={gradientTextExperiment.mode}
            settings={gradientTextExperiment.mode === 'hybrid' ? gradientTextExperiment.hybridSettings : gradientTextExperiment.metallicSettings}
            gradient={gradientTextExperiment.settings}
            active={gradientActive}
            className={styles.metallicWord}
            onStatus={gradientTextExperiment.onStatus}
          /> : <GradientText
            {...gradientTextExperiment.settings}
            active={gradientActive}
            className={styles.gradientWord}
            style={{ pointerEvents: gradientActive && (gradientTextExperiment.settings.followPointer || gradientTextExperiment.settings.pauseOnHover) ? 'auto' : 'none' }}
          >CODE</GradientText>}</Suspense>.</> : <>CODE.<span ref={codeFillRef}>CODE.</span></>}
        </span>
        <p ref={supportRef}>The tools are only part of the story. It&apos;s the curiosity to explore, experiment, and create that drives everything I do.</p>
      </div>
      <div ref={constellationRef} className={styles.constellationStage}>
        <div ref={compositionCopyRef} className={styles.compositionCopy}>
          <span>BEYOND / THE TOOLKIT</span>
          <h2 ref={compositionTitleRef}>{toolkitExperimental ? <ToolkitRotatingHeading
            key={toolkitExperiment.resetKey ?? 0}
            settings={toolkitExperiment}
            active={toolkitActive}
            replayKey={toolkitExperiment.replayKey ?? 0}
            onWordChange={setToolkitWord}
          /> : <>TOOLS TO<br />TURN IDEAS<br />INTO REALITY.</>}</h2>
          <p ref={compositionBodyRef}>From AI-powered applications to thoughtful web experiences, I enjoy combining different technologies to build things that are genuinely useful.</p>
        </div>
      <div
        ref={orbitSystemRef}
        className={styles.constellation}
        onPointerMove={event => {
          if (event.pointerType === 'touch') return
          const rect = event.currentTarget.getBoundingClientRect()
          pointerRef.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
          pointerRef.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
          nodeRefs.current.forEach(node => {
            if (!node) return
            node.style.setProperty('--parallax-x', `${pointerRef.current.x * 8}px`)
            node.style.setProperty('--parallax-y', `${pointerRef.current.y * 6}px`)
          })
          if (sphereRef.current) {
            sphereRef.current.style.setProperty('--parallax-x', `${pointerRef.current.x * 5}px`)
            sphereRef.current.style.setProperty('--parallax-y', `${pointerRef.current.y * 4}px`)
          }
        }}
        onPointerLeave={() => {
          nodeRefs.current.forEach(node => {
            if (!node) return
            node.style.setProperty('--parallax-x', '0px')
            node.style.setProperty('--parallax-y', '0px')
          })
          if (sphereRef.current) {
            sphereRef.current.style.setProperty('--parallax-x', '0px')
            sphereRef.current.style.setProperty('--parallax-y', '0px')
          }
        }}
      >
        <div className={styles.orbitSystem}>
        <svg className={styles.connections} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <ellipse className={styles.foregroundOrbit} ref={element => { orbitRefs.current[0] = element }} cx="50" cy="50" rx="35" ry="28" transform="rotate(-12 50 50)" />
          <ellipse className={styles.backgroundOrbit} ref={element => { orbitRefs.current[1] = element }} cx="50" cy="50" rx="27" ry="20" transform="rotate(22 50 50)" />
          <ellipse className={styles.thirdOrbit} cx="50" cy="50" rx="31" ry="14" transform="rotate(66 50 50)" />
          {links.map((_, index) => <path key={index} ref={element => { lineRefs.current[index] = element }} d="M 50 50 Q 50 50 50 50" />)}
        </svg>
        <div ref={sphereRef} className={styles.sphere} data-toolkit-lit={toolsSphere ? 'true' : undefined} aria-hidden="true" />
        {skills.map((skill, index) => (
          <button
            key={skill.name}
            ref={element => { nodeRefs.current[index] = element }}
            className={`${styles.node} ${styles[skill.size]} ${active === index ? styles.focused : ''}`}
            type="button"
            onMouseEnter={() => { interactionRef.current.hovered = index; setHovered(index) }}
            onMouseLeave={() => { interactionRef.current.hovered = null; setHovered(null) }}
            onFocus={() => { interactionRef.current.hovered = index; setHovered(index) }}
            onBlur={() => { interactionRef.current.hovered = null; setHovered(null) }}
            onClick={() => { const next = selected === index ? null : index; interactionRef.current.selected = next; setSelected(next) }}
            aria-label={`${skill.name}: ${skill.description}`}
            aria-pressed={selected === index}
            data-toolkit-lit={reactive && reaction.nodeHighlighting && (toolsAll || toolkitNode === index) ? 'true' : undefined}
          >
            <i aria-hidden="true" />
            <span>{skill.name}</span>
          </button>
        ))}
        </div>
        {selected !== null && <div className={styles.skillNote} role="status">{skills[selected].description}</div>}
      </div>
      </div>
      <div ref={finalRef} className={styles.finalStatement}>
        {curiosityExperiment?.comparison === 'typewriter' ? (
          <span className={styles.curiosityAlways}>
            <span className={styles.curiosityAlwaysAnchor} aria-hidden="true">ALWAYS</span>
            <span className={styles.curiosityAlwaysVisual} style={{ fontSize: `${curiosityExperiment.headlineScale ?? 1}em` }}>ALWAYS</span>
          </span>
        ) : <span>ALWAYS</span>}
        {curiosityExperiment?.comparison === 'typewriter' ? (
          <Suspense fallback={<span style={{ visibility: 'hidden' }}>CURIOUS.</span>}>
            <CuriosityTypewriterLine settings={curiosityExperiment} lifecycleRef={curiosityLifecycleRef} replayKey={curiosityExperiment.replayKey ?? 0} />
          </Suspense>
        ) : <span>CURIOUS.</span>}
        <p>Keep learning, keep asking better questions, and keep exploring what an idea can become.</p>
      </div>
    </section>
  )
}
