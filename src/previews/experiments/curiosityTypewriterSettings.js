export const CURIOSITY_TYPEWRITER_V1 = Object.freeze({
  name: 'Curiosity Typewriter — V1',
  comparison: 'typewriter',
  words: Object.freeze(['CURIOUS.', 'LEARNING.', 'EXPLORING.', 'CREATING.', 'QUESTIONING.']),
  speed: 75,
  deleteSpeed: 40,
  waitTime: 1500,
  curiousWaitTime: 2300,
  loop: true,
  pauseOnHover: false,
  cursorEnabled: true,
  cursorStyle: 'bar',
  cursorColor: '#526A90',
  cursorBlink: true,
  headlineScale: 1,
})

export const CURIOSITY_TYPEWRITER_V2 = Object.freeze({
  name: 'Curiosity Typewriter — V2 (Refined)',
  comparison: 'typewriter',
  words: Object.freeze(['CURIOUS.', 'LEARNING.', 'EXPLORING.', 'CREATING.', 'QUESTIONING.']),
  speed: 95,
  deleteSpeed: 50,
  waitTime: 1500,
  curiousWaitTime: 2500,
  loop: true,
  pauseOnHover: false,
  cursorEnabled: true,
  cursorStyle: 'underscore',
  cursorColor: '#000000',
  cursorBlink: true,
  headlineScale: 0.88,
})

export const CURIOSITY_TYPEWRITER_PRESETS = Object.freeze({
  v2: CURIOSITY_TYPEWRITER_V2,
  v1: CURIOSITY_TYPEWRITER_V1,
})

export const copyCuriosityPreset = preset => ({ ...preset, words: [...preset.words] })
export const copyCuriosityDefaults = () => copyCuriosityPreset(CURIOSITY_TYPEWRITER_V2)

// Bound editor input before it reaches typography measurements. Accepted words
// are still measured together and fitted uniformly to the available viewport.
export const validateCuriosityWord = value => {
  if (!value.trim()) return 'Enter a word before saving.'
  if (Array.from(value.trim()).length > 24) return 'Use at most 24 characters; longer phrases need a separate layout review.'
  if (/[\r\n]/.test(value)) return 'Each entry must stay on one line.'
  return ''
}
