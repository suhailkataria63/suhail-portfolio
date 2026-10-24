const INITIAL_ANIMATION = Object.freeze({
  variant: 'linear',
  animationSpeed: 8,
  angle: 90,
  scale: 3,
  yoyo: true,
  glow: 0,
  showBorder: false,
  pauseOnHover: false,
  followPointer: false,
})

// Sampled from the exact Dither Veil source photograph (1400 × 1939):
// blue at (456, 459), violet at (1059, 894), pink at (924, 1692).
// Use the deeper metallic highlights so CODE retains contrast on white.
export const DITHER_VEIL_COLOR_MATCH = Object.freeze({
  ...INITIAL_ANIMATION,
  colors: Object.freeze(['#526897', '#835095', '#9A5782']),
})

export const REACT_BITS_ORIGINAL_GRADIENT = Object.freeze({
  ...INITIAL_ANIMATION,
  colors: Object.freeze(['#5227FF', '#FF9FFC', '#B497CF']),
})

export const BEYOND_GRADIENT_PRESETS = Object.freeze({
  'dither-match': Object.freeze({ name: 'Dither Veil — Color Match', settings: DITHER_VEIL_COLOR_MATCH }),
  'react-bits-original': Object.freeze({ name: 'React Bits Original', settings: REACT_BITS_ORIGINAL_GRADIENT }),
})
