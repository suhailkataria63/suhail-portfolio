import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import TiltedCard from '../cinematic/tilt/TiltedCard'
import CircularText from './CircularText'
import styles from './ProjectTiltCard.module.css'

const ProjectTiltCard = forwardRef(function ProjectTiltCard({ project, liveUrl, media, tilt, circularText = null }, ref) {
  const [active, setActive] = useState(false)
  const [pointerHovered, setPointerHovered] = useState(false)
  const activeRef = useRef(false)
  const spotlightSurfaceRef = useRef(null)
  const circularTextActive = circularText && circularText.variant !== 'original'
  const circularTextSize = circularText?.responsiveToBadge
    ? `min(${circularText.ringDiameter}px, calc(var(--project-badge-size) + 12px))`
    : circularText?.ringDiameter
  const circularTextRingInset = circularText?.responsiveToBadge
    ? '5px'
    : Math.max(0, (circularText?.ringDiameter - circularText?.badgeDiameter - 2) / 2)
  const circularTextGlyphRadius = circularText?.responsiveToBadge
    ? `calc(50% - ${6 + circularText.fontSize / 2 + 4}px)`
    : Math.max(0, circularText?.badgeDiameter / 2 - circularText?.fontSize / 2 - 4)

  useImperativeHandle(ref, () => ({
    setActive(next) {
      const value = Boolean(next)
      if (activeRef.current === value) return
      activeRef.current = value
      setActive(value)
      if (!value) setPointerHovered(false)
    },
  }), [])

  return (
    <a
      className={styles.liveImageLink}
      href={liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      aria-label={`View ${project.title} live project`}
      onPointerEnter={circularTextActive ? event => { if (event.pointerType !== 'touch') setPointerHovered(true) } : undefined}
      onPointerLeave={circularTextActive ? () => setPointerHovered(false) : undefined}
    >
      <TiltedCard
        active={active}
        enabled={tilt?.enabled !== false}
        rotateAmplitude={tilt?.maxTilt ?? 9}
        scaleOnHover={tilt?.hoverScale ?? 1.03}
        springResponsiveness={tilt?.springResponsiveness ?? 0.58}
        spotlightTargetRef={spotlightSurfaceRef}
        spotlightEnabled={tilt?.spotlightEnabled !== false}
        spotlightIntensity={tilt?.spotlightIntensity ?? 0.16}
        spotlightSize={tilt?.spotlightSize ?? 220}
        spotlightColor={tilt?.spotlightColor ?? '#e6efff'}
        className={styles.tiltCard}
      >
        <div
          ref={spotlightSurfaceRef}
          className={styles.mediaSurface}
        >
          {media}
          <span
            className={styles.spotlight}
            style={{
              '--spotlight-color': tilt?.spotlightColor ?? '#e6efff',
              '--spotlight-intensity': tilt?.spotlightIntensity ?? 0.16,
              '--spotlight-size': `${tilt?.spotlightSize ?? 220}px`,
            }}
            aria-hidden="true"
          />
        </div>
        {circularText && (
          <span className={styles.visitProject} aria-hidden="true">
            {circularTextActive ? (
              <CircularText
                text={`VIEW PROJECT ${circularText.separator === 'dash' ? '—' : circularText.separator === 'middot' ? '·' : '•'} `}
                spinDuration={circularText.rotationDuration}
                direction={circularText.direction}
                size={circularTextSize}
                fontSize={circularText.fontSize}
                fontWeight={circularText.fontWeight}
                color={circularText.textColor}
                fill
                repeat={2}
                ring={circularText.ringOutline}
                ringColor={circularText.textColor}
                ringInset={circularTextRingInset}
                glyphRadius={circularTextGlyphRadius}
                tilt={0}
                hoverTilt={0}
                draggable={false}
                mode={circularText.variant === 'continuous' ? 'continuous' : 'hover'}
                hovered={pointerHovered}
                hoverAcceleration={circularText.hoverAcceleration}
                continuousHoverAcceleration={circularText.continuousHoverAcceleration}
              >
                <span className={styles.visitArrow}>↗</span>
              </CircularText>
            ) : <span className={styles.visitArrow}>↗</span>}
          </span>
        )}
      </TiltedCard>
    </a>
  )
})

export default ProjectTiltCard
