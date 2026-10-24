// Match the Hero Tech Text renderer's glyph box. In viewport-overlay mode it
// treats the DOM range start as the ink-box left edge, then uses Canvas
// TextMetrics for the box width. Keep the Orbit anchor on this same geometry.
export function heroCanvasGlyphBounds(start, metrics) {
  const left = Number(start) || 0
  const inkWidth = (metrics?.actualBoundingBoxLeft || 0) + (metrics?.actualBoundingBoxRight || 0)
  return {
    originX: left + (metrics?.actualBoundingBoxLeft || 0),
    x1: left,
    x2: left + inkWidth,
    centerX: left + inkWidth / 2,
    width: inkWidth,
  }
}

// Shared DOM measurement for the native Hero line. The Tech Text canvas and
// the orbital landing target use this same line box, glyph ranges and scales.
export function measureHeroTextLine(target) {
  if (!target) return null
  const textNode = target.firstChild
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null

  const style = getComputedStyle(target)
  const rect = target.getBoundingClientRect()
  const fontSize = Number.parseFloat(style.fontSize) || 16
  const lineHeightValue = Number.parseFloat(style.lineHeight)
  const lineBoxHeight = Number.isFinite(lineHeightValue) ? lineHeightValue : target.offsetHeight
  const scaleX = rect.width / Math.max(target.offsetWidth, 1) || 1
  const scaleY = rect.height / Math.max(lineBoxHeight, 1) || 1
  const context = document.createElement('canvas').getContext('2d')
  if (context) context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  const letterSpacing = Number.parseFloat(style.letterSpacing) || 0
  if (context && 'letterSpacing' in context) context.letterSpacing = `${letterSpacing}px`
  const metrics = context?.measureText(textNode.textContent || '')
  const ascent = metrics?.fontBoundingBoxAscent || metrics?.actualBoundingBoxAscent || fontSize * 0.8
  const descent = metrics?.fontBoundingBoxDescent || metrics?.actualBoundingBoxDescent || fontSize * 0.2
  const glyphRects = {}
  const glyphPositions = {}
  const glyphInk = {}
  const range = document.createRange()
  let offset = 0
  for (const character of textNode.textContent) {
    range.setStart(textNode, offset)
    range.setEnd(textNode, offset + character.length)
    const glyphRect = range.getBoundingClientRect()
    glyphRects[offset] = glyphRect
    glyphPositions[offset] = Math.round(((glyphRect.left - rect.left) / scaleX) * 1000) / 1000
    const glyphMetrics = context?.measureText(character)
    if (glyphMetrics) {
      const bounds = heroCanvasGlyphBounds(glyphPositions[offset], glyphMetrics)
      glyphInk[offset] = {
        ...bounds,
        screenCenterX: rect.left + bounds.centerX * scaleX,
        screenWidth: bounds.width * scaleX,
        metrics: glyphMetrics,
      }
    }
    offset += character.length
  }

  return {
    style,
    rect,
    lineBoxHeight,
    scaleX,
    scaleY,
    fontSize,
    metrics,
    letterSpacing,
    baselineY: (lineBoxHeight - ascent - descent) / 2 + ascent,
    glyphRects,
    glyphPositions,
    glyphInk,
  }
}
