import { useEffect, useRef, useState } from 'react'
import styles from './SceneThree.module.css'

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

export default function SceneThree({ controlRef }) {
  const sceneRef = useRef(null)
  const moreRef = useRef(null)
  const justRef = useRef(null)
  const codeRef = useRef(null)
  const codeFillRef = useRef(null)
  const supportRef = useRef(null)
  const constellationRef = useRef(null)
  const compositionCopyRef = useRef(null)
  const compositionTitleRef = useRef(null)
  const compositionBodyRef = useRef(null)
  const orbitSystemRef = useRef(null)
  const sphereRef = useRef(null)
  const nodeRefs = useRef([])
  const lineRefs = useRef([])
  const orbitRefs = useRef([])
  const finalRef = useRef(null)
  const contactExitRef = useRef(0)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const interactionRef = useRef({ hovered: null, selected: null })

  useEffect(() => {
    if (!controlRef) return undefined
    controlRef.current = {
      setProgress: value => {
        const progress = clamp(value)
        const titleIn = ease(clamp(progress / 0.2))
        const fill = clamp((progress - 0.16) / 0.28)
        const constellation = ease(clamp((progress - 0.62) / 0.24))
        const arrangement = ease(clamp((progress - 0.72) / 0.2))
        const openingExit = ease(clamp((progress - 0.58) / 0.17))
        const finalReveal = ease(clamp((progress - 0.93) / 0.07)) * (1 - contactExitRef.current)
        if (sceneRef.current) sceneRef.current.style.opacity = progress > 0 ? `${1 - contactExitRef.current}` : '0'
        if (moreRef.current) {
          moreRef.current.style.opacity = `${titleIn * (1 - openingExit)}`
          moreRef.current.style.transform = `translate3d(0, ${(1 - titleIn) * 80 - openingExit * 65}px, 0)`
        }
        if (justRef.current) {
          const justIn = ease(clamp((progress - 0.06) / 0.18))
          justRef.current.style.opacity = `${justIn * (1 - openingExit)}`
          justRef.current.style.transform = `translate3d(0, ${(1 - justIn) * 80 - openingExit * 65}px, 0)`
        }
        if (codeRef.current) {
          const codeIn = ease(clamp((progress - 0.12) / 0.2))
          codeRef.current.style.opacity = `${codeIn * (1 - openingExit)}`
          codeRef.current.style.transform = `translate3d(0, ${(1 - codeIn) * 80 - openingExit * 65}px, 0)`
        }
        if (codeFillRef.current) codeFillRef.current.style.opacity = `${fill}`
        if (supportRef.current) {
          const supportIn = ease(clamp((progress - 0.34) / 0.16))
          supportRef.current.style.opacity = `${supportIn * (1 - openingExit)}`
          supportRef.current.style.transform = `translate3d(0, ${(1 - supportIn) * 22 - openingExit * 30}px, 0)`
        }
        if (constellationRef.current) {
          constellationRef.current.style.opacity = `${constellation * (1 - finalReveal)}`
          constellationRef.current.style.transform = `translate3d(0, ${constellation < 1 ? (1 - constellation) * 40 : -finalReveal * 80}px, 0) scale(${0.92 + constellation * 0.08})`
        }
        const compositionIn = ease(clamp((progress - 0.64) / 0.16))
        if (compositionCopyRef.current) compositionCopyRef.current.style.opacity = `${compositionIn * (1 - finalReveal)}`
        if (compositionTitleRef.current) compositionTitleRef.current.style.transform = `translate3d(0, ${(1 - compositionIn) * 24}px, 0)`
        if (compositionBodyRef.current) compositionBodyRef.current.style.transform = `translate3d(0, ${(1 - ease(clamp((progress - 0.69) / 0.14))) * 18}px, 0)`
        if (sphereRef.current) {
          sphereRef.current.style.opacity = `${constellation * (1 - finalReveal)}`
          sphereRef.current.style.transform = `translate(calc(-50% + var(--parallax-x, 0px)), calc(-50% + var(--parallax-y, 0px))) scale(${0.7 + constellation * 0.3})`
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
          const nodeReveal = ease(clamp((progress - 0.62 - index * 0.025) / 0.24))
          node.style.opacity = `${nodeReveal * (1 - finalReveal)}`
          node.style.pointerEvents = nodeReveal > 0.01 && finalReveal < 0.99 ? 'auto' : 'none'
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
          line.style.opacity = `${constellation * (1 - finalReveal) * (related ? 0.55 : 0.12)}`
        })
        orbitRefs.current.forEach((orbit, index) => {
          if (!orbit) return
          const length = orbit.dataset.length || orbit.getTotalLength()
          orbit.dataset.length = length
          orbit.style.strokeDasharray = length
          orbit.style.strokeDashoffset = length * (1 - constellation)
          orbit.style.opacity = `${constellation * (1 - finalReveal) * (index === 0 ? 0.72 : 0.46)}`
        })
        if (finalRef.current) {
          finalRef.current.style.opacity = `${finalReveal}`
          finalRef.current.style.transform = `translate3d(0, ${(1 - finalReveal) * 55}px, 0)`
        }
      },
      setContactExit: value => { contactExitRef.current = clamp(value) },
    }
    controlRef.current.setProgress(0)
    return () => { controlRef.current = null }
  }, [controlRef])

  const active = hovered ?? selected
  return (
    <section ref={sceneRef} className={styles.scene} data-scene-three aria-label="More than just code">
      <div className={styles.kinetic} aria-hidden="true">
        <span ref={moreRef}>MORE THAN</span>
        <span ref={justRef}>JUST</span>
        <span ref={codeRef} className={styles.code}>CODE.<span ref={codeFillRef}>CODE.</span></span>
        <p ref={supportRef}>The tools are only part of the story. It&apos;s the curiosity to explore, experiment, and create that drives everything I do.</p>
      </div>
      <div ref={constellationRef} className={styles.constellationStage}>
        <div ref={compositionCopyRef} className={styles.compositionCopy}>
          <span>03 / 03 — BEYOND THE CODE</span>
          <h2 ref={compositionTitleRef}>TOOLS TO<br />TURN IDEAS<br />INTO REALITY.</h2>
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
        <div ref={sphereRef} className={styles.sphere} aria-hidden="true" />
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
        <span>ALWAYS</span>
        <span>CURIOUS.</span>
        <p>Keep learning, keep asking better questions, and keep exploring what an idea can become.</p>
      </div>
    </section>
  )
}
