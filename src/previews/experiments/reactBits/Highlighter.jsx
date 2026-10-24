'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { annotate } from 'rough-notation'

export function Highlighter({
  children,
  action = 'highlight',
  color = '#ffd1dc',
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  show = true,
  replayKey = 0,
}) {
  const elementRef = useRef(null)
  const isInView = useInView(elementRef, { once: true, margin: '-10%' })
  const shouldShow = show && (!isView || isInView)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  )

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return undefined
    const update = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  useLayoutEffect(() => {
    const element = elementRef.current
    let annotation = null
    let resizeObserver = null

    if (shouldShow && element) {
      annotation = annotate(element, {
        type: action,
        color,
        strokeWidth,
        animationDuration: reducedMotion ? 0 : animationDuration,
        iterations,
        padding,
        multiline,
      })
      annotation.show()

      if (typeof ResizeObserver !== 'undefined') {
        const readSize = () => {
          const rect = element.getBoundingClientRect()
          return [rect.width, rect.height, document.body.clientWidth, document.body.clientHeight]
            .map(value => Math.round(value * 100) / 100)
            .join(':')
        }
        let lastSize = readSize()
        resizeObserver = new ResizeObserver(() => {
          const nextSize = readSize()
          if (nextSize === lastSize) return
          lastSize = nextSize
          annotation?.hide()
          annotation?.show()
        })
        resizeObserver.observe(element)
        resizeObserver.observe(document.body)
      }
    }

    return () => {
      annotation?.remove()
      resizeObserver?.disconnect()
    }
  }, [shouldShow, action, color, strokeWidth, animationDuration, iterations, padding, multiline, replayKey, reducedMotion])

  return <span ref={elementRef} className="relative inline-block bg-transparent">{children}</span>
}
