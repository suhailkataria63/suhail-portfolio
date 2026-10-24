import { measureHeroTextLine } from './heroTextLineGeometry'

// Preview-only proportions, relative to the selected capital's visible width.
// The measured rectangle is the complete black Hero window. The existing
// handoff derives one uniform Orbit scale from this rectangle.
const DOT_TO_LETTER_WIDTH = 0.95
const GAP_TO_DOT_SIZE = 0.3
let fontContext

export function measureOrbitIDotLanding({ heroBox, title }) {
  const line = title?.firstElementChild
  const text = line?.firstChild
  if (!text || text.nodeType !== Node.TEXT_NODE) return null
  // Dedicated DOM range for the second I: B U I L D [I] N G. A range
  // anchors this exact character without inserting a typography-changing span.
  const firstI = text.textContent.indexOf('I')
  const index = firstI < 0 ? -1 : text.textContent.indexOf('I', firstI + 1)
  if (index < 0) return null
  const measured = measureHeroTextLine(line)
  const letter = measured?.glyphRects[index]
  const ink = measured?.glyphInk[index]
  const lineBox = measured?.rect
  if (!letter?.width || !letter.height || !ink) return null

  // Read the existing type without adding a span or changing shaping,
  // tracking, line breaks, font size, or any of the visible headline markup.
  const style = getComputedStyle(line)
  const section = title.closest('section')
  const sectionStyle = section ? getComputedStyle(section) : null
  const sectionBox = section?.getBoundingClientRect()
  const sectionMatrix = sectionStyle?.transform && sectionStyle.transform !== 'none'
    ? new DOMMatrixReadOnly(sectionStyle.transform)
    : new DOMMatrixReadOnly()
  const transformOrigin = (sectionStyle?.transformOrigin || '0px 0px').split(' ').map(value => Number.parseFloat(value) || 0)
  const matrixScaleX = Math.abs(sectionMatrix.a) > 0.001 ? sectionMatrix.a : 1
  const matrixScaleY = Math.abs(sectionMatrix.d) > 0.001 ? sectionMatrix.d : 1
  const layoutSectionLeft = sectionBox
    ? sectionBox.left - transformOrigin[0] * (1 - matrixScaleX) - sectionMatrix.e
    : heroBox.left
  const layoutSectionTop = sectionBox
    ? sectionBox.top - transformOrigin[1] * (1 - matrixScaleY) - sectionMatrix.f
    : heroBox.top
  // Width is kept in the same untransformed line-local units used by the
  // sculpture's CSS handoff rectangle; only the measured center is viewport
  // space and is inverted through the existing Hero transform below.
  let inkWidth = ink.width
  let inkCenterX = ink.screenCenterX
  let inkTop = lineBox.top
  {
    fontContext ??= document.createElement('canvas').getContext('2d')
    if (fontContext) fontContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const metrics = fontContext?.measureText('I') || ink.metrics
    // The canvas renderer's shared ink box is authoritative for horizontal
    // alignment. The DOM Range center describes its advance box and can differ
    // substantially for narrow glyphs with a signed side bearing.
    // A Range's vertical rectangle is a line-fragment box, not the ink top.
    // Reconstruct the line baseline from the loaded font metrics and CSS line
    // box, then use the capital's visible ascent for its actual top edge.
    const lineHeight = Number.parseFloat(style.lineHeight) || line.offsetHeight
    const fontAscent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent
    const fontDescent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent
    const actualAscent = metrics.actualBoundingBoxAscent
    const baselineFromLineTop = (lineHeight - fontAscent - fontDescent) / 2 + fontAscent
    const scaleY = lineBox.height / Math.max(line.offsetHeight, 1)
    inkTop = lineBox.top + (baselineFromLineTop - actualAscent) * scaleY
  }

  // Convert the measured, transformed glyph point back through the Hero
  // section's current translate/scale before caching its layout destination.
  // This keeps the landing stable during the entrance and on responsive resize.
  const untransformedX = sectionBox
    ? layoutSectionLeft + (inkCenterX - sectionBox.left) / matrixScaleX
    : inkCenterX
  const untransformedY = sectionBox
    ? layoutSectionTop + (inkTop - sectionBox.top) / matrixScaleY
    : inkTop
  const centerX = untransformedX - heroBox.left
  const topOfLetter = untransformedY - heroBox.top
  const width = inkWidth * DOT_TO_LETTER_WIDTH
  const height = width * 0.78
  return {
    left: centerX - width / 2,
    top: topOfLetter - width * GAP_TO_DOT_SIZE - height,
    width,
    height,
  }
}
