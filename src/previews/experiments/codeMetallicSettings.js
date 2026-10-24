import { APPROVED_CONTACT_METALLIC_SETTINGS } from './approvedPortfolioEffects'
import { DITHER_VEIL_COLOR_MATCH } from './beyondGradientTextSettings'

// Independent copies: changing CODE's controls cannot mutate CONTACT.
export const CODE_METALLIC_BASELINE = Object.freeze({
  ...APPROVED_CONTACT_METALLIC_SETTINGS,
  intro: false,
  metallicIntensity: 1,
  reflectionContrast: 1,
  saturation: 1,
  glow: 0,
})

export const DITHER_CHROME_V1 = Object.freeze({
  ...CODE_METALLIC_BASELINE,
  color: '#FFFFFF',
  metallicIntensity: 1,
  reflectionContrast: 1.3,
  speed: 0.4,
  saturation: 1.7,
  glow: 0.04,
})

export const DITHER_CHROME_V1_PRESET = Object.freeze({
  name: 'Dither Chrome — V1',
  material: DITHER_CHROME_V1,
  gradient: DITHER_VEIL_COLOR_MATCH,
})

// The approved production and preview configuration share this exact object.
// Keep every final material value explicit so future CONTACT presets cannot
// change CODE's appearance implicitly.
export const DITHER_CHROME_FINAL_V1 = Object.freeze({
  name: 'Dither Chrome — Final V1',
  enabled: true,
  mode: 'hybrid',
  paletteId: 'dither-match',
  paletteName: 'Dither Veil — Color Match',
  settings: Object.freeze({
    variant: 'flow',
    colors: Object.freeze(['#526897', '#835095', '#9A5782']),
    animationSpeed: 8,
    angle: 90,
    scale: 3,
    glow: 0,
    yoyo: false,
    followPointer: false,
    pauseOnHover: false,
    showBorder: false,
  }),
  hybridSettings: Object.freeze({
    color: '#FFFFFF',
    density: 1.9,
    softness: 0.17,
    dispersion: 0.32,
    distortion: 0.04,
    edgeBend: 0.6,
    angle: 70,
    scale: 0.6,
    rotation: 0,
    mouseTilt: 0.35,
    lightMode: false,
    intro: false,
    metallicIntensity: 0.65,
    reflectionContrast: 1.6,
    speed: 0.4,
    saturation: 1.7,
    glow: 0.04,
  }),
})

// The earlier Dither Chrome V1 retains DITHER_VEIL_COLOR_MATCH:
// #526897 → #835095 → #9A5782, 8 seconds, 90°, scale 3, yoyo.
// A cyan specular highlight (#84CBDD) was additionally sampled from the
// same 1400 × 1939 portrait at (996, 664); it does not replace that palette.
