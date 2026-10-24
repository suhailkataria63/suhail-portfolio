import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import approvedScrollProfile from './previews/cinematic/approvedScrollProfile.js'
import { APPROVED_PROJECT_CIRCULAR_TEXT_SETTINGS, APPROVED_PROJECT_TILT_SETTINGS } from './previews/experiments/projectTiltSettings.js'
import { APPROVED_HERO_TECH_TEXT_SETTINGS } from './previews/experiments/heroTechTextSettings.js'
import { APPROVED_ABOUT_THREADS_SETTINGS, APPROVED_CONTACT_METALLIC_SETTINGS } from './previews/experiments/approvedPortfolioEffects.js'
import { DITHER_VEIL_SOURCE_IMAGE, DITHER_VEIL_SUHAIL_V3 } from './previews/experiments/ditherVeilSettings.js'
import { ABOUT_HIGHLIGHTER_ELECTRIC_BLUE_V3 } from './previews/experiments/aboutHighlighterSettings.js'
import { DITHER_CHROME_FINAL_V1 } from './previews/experiments/codeMetallicSettings.js'
import { TOOLKIT_BLACK_BLUR_V2_FINAL } from './previews/experiments/toolkitRotatingSettings.js'
import { CURIOSITY_TYPEWRITER_V2 } from './previews/experiments/curiosityTypewriterSettings.js'

const CinematicPreview = lazy(() => import('./previews/cinematic/CinematicPreview.jsx'))

const { backgroundMode: ditherBackgroundMode, ...ditherV3ShaderSettings } = DITHER_VEIL_SUHAIL_V3
const beyondDitherTransitionSettings = Object.freeze({
  ...ditherV3ShaderSettings,
  transparentBackground: ditherBackgroundMode === 'transparent',
})
const beyondDitherExperiment = Object.freeze({
  mode: 'dither',
  src: DITHER_VEIL_SOURCE_IMAGE,
  settings: beyondDitherTransitionSettings,
})
const APPROVED_BUILDER_EXPLORING_SETTINGS = Object.freeze({
  comparison: 'experimental',
  designing: Object.freeze({ enabled: false }),
  exploring: Object.freeze({
    enabled: true,
    montageEnabled: true,
    montageSources: Object.freeze([
      '/videos/exploring/space.mp4',
      '/videos/exploring/mountain.mp4',
      '/videos/exploring/ocean.mp4',
      '/videos/exploring/earth.mp4',
    ]),
    clipDuration: 3,
    crossfadeDuration: 0.5,
    montagePlaying: true,
    montageRestartKey: 0,
    videoSource: '',
    posterSource: '',
    fillScale: 1.25,
    parallax: 12,
    drift: 8,
    reveal: 'none',
    brightness: 1.05,
    saturation: 1.5,
    tintEnabled: false,
    tintColor: '#506A90',
    spotlight: false,
    outline: false,
  }),
})
const APPROVED_BUILDER_STROKE_TEXT_SETTINGS = Object.freeze({
  comparison: 'experimental',
  enabled: true,
  loop: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname === '/' ? (
      <Suspense fallback={null}>
        <CinematicPreview
          {...approvedScrollProfile}
          particleShape="infinity"
          showCv
          enableCustomCursor
          customCursorVariant="corrected-axis"
          customCursorFinish="navy-chrome"
          cleanHomepageIdentity
          loaderOrbitVariant="perspective-ellipse"
          loaderBeamClusterRatio={1.125}
          readyIndicatorMode="dot"
          enableLiquidInk={false}
          projectTiltExperiment={APPROVED_PROJECT_TILT_SETTINGS}
          projectCircularTextExperiment={APPROVED_PROJECT_CIRCULAR_TEXT_SETTINGS}
          heroTechTextExperiment={APPROVED_HERO_TECH_TEXT_SETTINGS}
          aboutThreadsEnabled
          aboutThreadsExperiment={{ mode: 'reactive', settings: APPROVED_ABOUT_THREADS_SETTINGS }}
          aboutHighlighterExperiment={{ settings: ABOUT_HIGHLIGHTER_ELECTRIC_BLUE_V3 }}
          aboutCreativeTypeExperiment={APPROVED_BUILDER_EXPLORING_SETTINGS}
          aboutStrokeTextExperiment={APPROVED_BUILDER_STROKE_TEXT_SETTINGS}
          ditherVeilExperiment={beyondDitherExperiment}
          ditherVeilProduction
          beyondGradientTextExperiment={DITHER_CHROME_FINAL_V1}
          beyondToolkitExperiment={TOOLKIT_BLACK_BLUR_V2_FINAL}
          beyondCuriosityExperiment={CURIOSITY_TYPEWRITER_V2}
          contactMetallicTextExperiment={{ variant: 'silver', settings: APPROVED_CONTACT_METALLIC_SETTINGS }}
        />
      </Suspense>
    ) : <main><h1>Page not found</h1><a href="/">Return to SUHAIL</a></main>}
  </StrictMode>,
)
