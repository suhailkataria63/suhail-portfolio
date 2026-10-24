export const TOOLKIT_INDIGO_DROP_V1 = Object.freeze({
  name: 'Toolkit — Indigo Drop V1',
  comparison: 'experimental',
  headline: Object.freeze(['SCULPTING', 'RAW IDEAS', 'WITH']),
  rotating: Object.freeze({
    enabled: true,
    words: Object.freeze(['TOOLS', 'PYTHON', 'REACT', 'FASTAPI', 'NEXT.JS', 'AI / ML', 'RAG', 'APIs']),
    effect: 'drop',
    direction: 'up',
    highlight: true,
    highlightColor: '#3E40A0',
    staggerFrom: 'first',
    staggerDuration: 0.04,
    rotationInterval: 2000,
    splitBy: 'words',
    blur: 0,
    auto: true,
    loop: true,
    pauseOnHover: false,
  }),
  reaction: Object.freeze({
    enabled: true,
    nodeHighlighting: true,
    brightness: 1.7,
    glow: 0.3,
    labelBrightness: 1.2,
    duration: 450,
    color: '#506A90',
    toolsBehavior: 'sphere',
  }),
})

export const TOOLKIT_BLACK_BLUR_V2_FINAL = Object.freeze({
  name: 'Toolkit — Black Blur V2 (Final)',
  comparison: 'experimental',
  headline: Object.freeze(['SCULPTING', 'RAW IDEAS', 'WITH']),
  rotating: Object.freeze({
    enabled: true,
    words: Object.freeze(['TOOLS', 'PYTHON', 'REACT', 'FASTAPI', 'NEXT.JS', 'AI / ML', 'RAG', 'APIs']),
    effect: 'blur',
    direction: 'up',
    highlight: true,
    highlightColor: '#000000',
    staggerFrom: 'first',
    staggerDuration: 0.04,
    rotationInterval: 2000,
    splitBy: 'words',
    blur: 0,
    auto: true,
    loop: true,
    pauseOnHover: false,
  }),
  reaction: Object.freeze({
    enabled: true,
    nodeHighlighting: true,
    brightness: 2.05,
    glow: 0.46,
    labelBrightness: 1.85,
    duration: 700,
    color: '#424C5C',
    toolsBehavior: 'sphere',
  }),
})

export const TOOLKIT_ROTATING_PRESETS = Object.freeze({
  'black-blur-v2-final': TOOLKIT_BLACK_BLUR_V2_FINAL,
  'indigo-drop-v1': TOOLKIT_INDIGO_DROP_V1,
})

export const copyToolkitPreset = preset => ({
  ...preset,
  headline: [...preset.headline],
  rotating: { ...preset.rotating, words: [...preset.rotating.words] },
  reaction: { ...preset.reaction },
})

export const copyToolkitDefaults = () => copyToolkitPreset(TOOLKIT_BLACK_BLUR_V2_FINAL)

const aliases = Object.freeze({ PY: 'PYTHON', PYTHON3: 'PYTHON', REACTJS: 'REACT', NEXT: 'NEXTJS', AI: 'AIML', ML: 'AIML', API: 'APIS' })
export const normalizeToolkitWord = word => {
  const normalized = String(word ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return aliases[normalized] ?? normalized
}

export const readableToolkitColor = color => {
  const rgb = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255)
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  return luminance > 0.179 ? '#0B0B0C' : '#FFFFFF'
}
