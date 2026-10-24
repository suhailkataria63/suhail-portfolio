# SUHAIL repository cleanup — 2026-10-24

Local maintenance only. No build, test, lint, browser session/automation, package-manager command, commit, push, or deployment was run. README.md was not edited. Runtime appearance and interactions require the manual checks below.

## Result

- Removed 130 obsolete files, including ignored Finder metadata and previously untracked experiments.
- Removed 45 explicit experimental URL paths and the legacy `/?preview=legacy` alternate renderer. `/` mounts the same approved cinematic portfolio configuration. Unknown paths now show a simple page-not-found link to `/`.
- Removed retired Hero Metallic/Ghost Fibers and ABOUT Decrypted Text integrations, the old DESIGNING font-cycle branch, retired EXPLORING MaskedHeading/boundary diagnostics, and project hit/tilt debug HUDs. Removed the `hover` and `aboutTransition` experiment query overrides; their previous normal defaults remain unchanged.
- No approved effect component, saved preset module, video, shader, shared scroll controller, navigation resolver, or loader timeline was changed.
- Kept production files under their existing `src/previews/cinematic/` and `src/previews/experiments/` paths. Their names do not indicate that they are disposable. No broad directory relocation was necessary.

## Files modified by this cleanup

Changes already present before this task are excluded from this list.

- `src/main.jsx`
- `src/previews/cinematic/AboutIntro.jsx`
- `src/previews/cinematic/BuilderScene.jsx`
- `src/previews/cinematic/BuilderScene.module.css`
- `src/previews/cinematic/CinematicPreview.jsx`
- `src/previews/cinematic/CinematicPreview.module.css`
- `src/previews/cinematic/ProjectShowcase.jsx`
- `src/previews/cinematic/ProjectShowcase.module.css`
- `docs/repository-cleanup-2026-10-24.md` — this report.

## Files removed

Every path below was audited against retained imports, configuration aliases, and public URL references before deletion. The three root project images were byte-identical to their retained copies under `public/projects/`.

| Path | Reason |
| --- | --- |
| `.DS_Store` | macOS Finder metadata. |
| `public/.DS_Store` | macOS Finder metadata. |
| `public/Project 1 - Cynbit AI.png` | Unreferenced root duplicate; byte-identical production image remains in public/projects/. |
| `public/Project 2 - InternAI.png` | Unreferenced root duplicate; byte-identical production image remains in public/projects/. |
| `public/Project 3 -Phishing.png` | Unreferenced root duplicate; byte-identical production image remains in public/projects/. |
| `public/icons.svg` | SVG sprite used only by the deleted legacy portfolio. |
| `public/masked-heading-placeholder.svg` | Fallback asset for the retired MaskedHeading experiment, unused by the approved montage. |
| `public/videos/.DS_Store` | macOS Finder metadata. |
| `src/.DS_Store` | macOS Finder metadata. |
| `src/App-backup.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/App.css` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/App.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/assets/.DS_Store` | macOS Finder metadata. |
| `src/assets/hero.png` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/assets/react.svg` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/assets/vite.svg` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/components/.DS_Store` | macOS Finder metadata. |
| `src/components/HighEnd3DBackground.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/components/WelcomeIntro.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/components/ui/button.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/components/ui/card.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/previews/experiments/AboutCreativeTypePreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutCreativeTypePreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutDecryptedTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutDecryptedTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutHighlighterPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutHighlighterPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutStrokeTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutStrokeTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutThreadsPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/AboutThreadsPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondCuriosityTypewriterPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondDitherVeilPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondDitherVeilPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondGhostFibersLayer.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondGhostFibersLayer.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondGradientTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondGradientTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondToolkitRotatingPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/BeyondToolkitRotatingPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ContactMetallicTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ContactMetallicTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/CustomCursorComparisonPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/CustomCursorComparisonPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/CustomCursorPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/CustomCursorStylePreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/CustomCursorStylePreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/FormationExperiment.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/FormationExperiment.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/GhostFibersPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/GhostFibersPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroMetallicLayer.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroMetallicLayer.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroMetallicPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroMetallicPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroShortScrollPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroTechTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/HeroTechTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/LoaderRefinementBalancedPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/LoaderRefinementPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ObjectStudio.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ObjectStudio.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ObjectWorkshop.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ObjectWorkshop.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/OrbitIDotPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ParticleDesignPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ParticleInfinityPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ProjectSpinningTextPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ProjectSpinningTextPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ProjectTiltPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ProjectTiltPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ScrollChoreographyPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ScrollStagesPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ShortScrollPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/ghostFibersSettings.js` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/heroEntranceDiagnostics.js` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/heroOrbitDiagnostics.js` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/DecryptedText.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/ReactBitsPreview.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/ReactBitsPreview.module.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/DarkVeil/DarkVeil.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/DarkVeil/DarkVeil.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/FloatingLines/FloatingLines.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/FloatingLines/FloatingLines.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/GhostFibers/GhostFibers.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/GhostFibers/GhostFibers.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/LineWaves/LineWaves.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/LineWaves/LineWaves.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/LiquidChrome/LiquidChrome.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/LiquidChrome/LiquidChrome.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Particles/Particles.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Particles/Particles.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Silk/Silk.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Silk/Silk.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Waves/Waves.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/backgrounds/Waves/Waves.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/interactions/GlareHover/GlareHover.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/interactions/GlareHover/GlareHover.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/interactions/Magnet/Magnet.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/BlurText/BlurText.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/MaskedHeading/MaskedHeading.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/MaskedHeading/MaskedHeading.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/ScrollReveal/ScrollReveal.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/ScrollReveal/ScrollReveal.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/ShinyText/ShinyText.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/ShinyText/ShinyText.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/SplitText/SplitText.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/VariableProximity/VariableProximity.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/typography/VariableProximity/VariableProximity.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/AnimatedContent/AnimatedContent.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/FadeContent/FadeContent.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/MagicRings/MagicRings.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/MagicRings/MagicRings.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/MetallicPaint/MetallicPaint.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/MetallicPaint/MetallicPaint.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/PixelTransition/PixelTransition.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/PixelTransition/PixelTransition.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/Ribbons/Ribbons.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/Ribbons/Ribbons.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/Strands/Strands.css` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/reactBits/components/visual/Strands/Strands.jsx` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/previews/experiments/scroll-choreography.md` | Obsolete experiment route/editor or renderer outside the retained production and tooling import graph. |
| `src/sections/ContactSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/EducationSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/ExperienceSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/HeroSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/ProjectsSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/SectionTitle.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/SkillsSection.jsx` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |
| `src/sections/shared.js` | Retired legacy portfolio/component/asset; unreachable after removing the legacy route. |

## Routes removed

- `/experiments/object-studio`
- `/experiments/objects`
- `/preview/about-creative-type`
- `/preview/about-decrypted-text`
- `/preview/about-highlighter`
- `/preview/about-stroke-text`
- `/preview/about-threads`
- `/preview/beyond-curiosity-typewriter`
- `/preview/beyond-dither-transition`
- `/preview/beyond-dither-veil`
- `/preview/beyond-gradient-text`
- `/preview/beyond-toolkit-rotating`
- `/preview/contact-metallic-text`
- `/preview/custom-cursor`
- `/preview/custom-cursor-comparison`
- `/preview/custom-cursor-style`
- `/preview/ghost-fibers`
- `/preview/hero-metallic`
- `/preview/hero-short-scroll`
- `/preview/hero-tech-text`
- `/preview/loader-ready-dot`
- `/preview/loader-ready-line`
- `/preview/loader-refinement`
- `/preview/loader-refinement-balanced`
- `/preview/orbit-i-dot`
- `/preview/particle-ethereal`
- `/preview/particle-gyroscope`
- `/preview/particle-infinity`
- `/preview/particle-vortex`
- `/preview/project-spinning-text`
- `/preview/project-tilt`
- `/preview/react-bits`
- `/preview/scroll-choreography`
- `/preview/scroll-stages`
- `/preview/short-scroll`
- `/experiments/formation-a`
- `/experiments/formation-b`
- `/experiments/formation-c`
- `/experiments/formation-d`
- `/experiments/formation-e`
- `/experiments/formation-f`
- `/experiments/formation-g`
- `/experiments/formation-h`
- `/experiments/formation-i`
- `/experiments/formation-ab`
- `/?preview=legacy`

## Important files retained

| Production responsibility | Retained implementation |
| --- | --- |
| Cinematic scenes, navigation, and scroll choreography | `src/previews/cinematic/CinematicPreview.jsx`, `useCinematicScroll.js`, `createScrollStageController.js`, timing modules, `CinematicNav.jsx`, `JourneyScene.jsx`, `SceneThree.jsx`, `ContactScene.jsx` and associated styles |
| Loader, Hero Orbit, lighting, handoff, geometry | `src/previews/cinematic/sculpture/` and its transitive helpers |
| Working project links, tilt, spotlight, circular text | `src/previews/experiments/ProjectTiltCard.jsx`, `CircularText.jsx`, `projectTiltSettings.js`, `src/previews/cinematic/tilt/`, `ProjectShowcase.jsx` |
| Hero Tech Text | `HeroTechTextLayer.jsx`, `heroTechTextSettings.js`, `heroTextLineGeometry.js`, `orbitIDotLanding.js`, React Bits `TechText/` |
| ABOUT Threads and electric-blue underline | `AboutThreadsLayer.jsx`, `approvedPortfolioEffects.js`, `aboutHighlighterSettings.js`, React Bits `Threads/`, `Highlighter.jsx` |
| ABOUT DESIGNING and EXPLORING | `BuilderScene.jsx`, `BuilderExploringMontage.jsx`, associated styles, React Bits `StrokeText/` |
| Transparent Dither Veil V3 | `ditherVeilSettings.js`, `dither-veil/DitherVeil.jsx` and CSS |
| Iridescent CODE Final V1 | `codeMetallicSettings.js`, `beyondGradientTextSettings.js`, `code-metallic/`, React Bits `GradientText/` |
| Black Blur V2 reactive TOOLKIT | `ToolkitRotatingHeading.jsx`, `toolkitRotatingSettings.js`, React Bits `RotatingText/` |
| Curiosity Typewriter V2 lifecycle | `CuriosityTypewriterLine.jsx`, CSS, `curiosityTypewriterSettings.js` |
| CONTACT Metallic Paint | React Bits `ContactMetallicPaint/`, `approvedPortfolioEffects.js`, CONTACT scene/style/timing modules |
| Component tooling and attribution | `components.json`, `src/lib/utils.js` (the configured shadcn utility alias), React Bits `LICENSE.md` and `NOTICE.md` |

Preserved public resources:

- `public/Suhail_Kataria_Resume.pdf`
- `public/favicon.svg`
- `public/og-image.png`
- `public/projects/Project 1 - Cynbit AI.png`
- `public/projects/Project 2 - InternAI.png`
- `public/projects/Project 3 - Phishing.png`
- `public/videos/exploring/earth.mp4`
- `public/videos/exploring/mountain.mp4`
- `public/videos/exploring/ocean.mp4`
- `public/videos/exploring/space.mp4`

The Dither Veil portrait retains its exact existing remote Unsplash URL. Generated text masks, metallic textures, environment maps, and geometry remain in their existing runtime code. The Inter font still comes from `@fontsource-variable/inter`. No retained asset was recompressed, regenerated, replaced, or renamed.

## Dependencies

No dependency was added, removed, upgraded, or reinstalled. `package.json` and `package-lock.json` are byte-identical to the pre-cleanup snapshot; their existing Git modifications predate this task. This keeps the lockfile consistent without prohibited package-management commands.

Confirmed runtime/tooling uses include React/React DOM, Three.js, React Three Fiber, OGL, GSAP/ScrollTrigger, Motion and Framer Motion, rough-notation, lucide-react, Inter, Vite/React/Tailwind plugins, Tailwind CSS, shadcn CSS, tw-animate-css, and ESLint tooling. `clsx` and `tailwind-merge` remain used by the utility alias retained for component development.

Later dependency-pruning candidates: `class-variance-authority`, `radix-ui`, `react-icons`, and `vite-tsconfig-paths`. No direct retained source/config import was found for these. They remain installed and declared because dependency/peer/CLI resolution and a consistent lockfile removal were not exercised. Review them in a separately authorized dependency-maintenance pass.

## Conservative retentions and limitations

- `src/previews/cinematic/sculpture/handoffInspection.jsx` and `handoffPerformance.js` remain because the production loader/renderer imports and references their handoff interfaces. Inspection/timing recording defaults remain disabled. Removing their call sites would expand this cleanup into loader lifecycle and rendering code changes.
- Original sculpture variants, `ProjectHoverEffect.jsx`, `useLiquidInk.js`/`inkRenderer.js`, and source-level effect comparison/fallback branches still reached by shared modules remain. Not all are active under the homepage preset. Safely removing them would require specializing shared renderer/controller code; their transitive imports are intentionally preserved.
- Existing saved preset versions remain in shared settings modules; their editor pages are gone. This preserves final values, defaults, aliases, and useful configuration history without importing any editor.
- `src/index.css` includes older selectors as well as production-wide cascade rules. It is unchanged because proving every selector inert without rendering would be less safe than retaining it.
- `README.md`, `MERGE_NOTES.md`, component tooling/configuration, ignored `node_modules/`, and the pre-existing ignored `dist/` were retained. The local `dist/` is stale generated output, not the cleaned source and not part of the Git update. No build was performed.
- No runtime or visual verification was performed, as requested. No claim of pixel-identical rendered output is made.

## Source-level integrity evidence

- Parsed retained JavaScript/JSX for static imports, lazy/dynamic literal imports, and re-exports; followed CSS imports/URLs and the shadcn utility alias. The resulting 102-file production/tooling graph has zero unresolved local imports.
- Compared production JSX props with the snapshot, resolving the original `isProductionHome` branch: every `CinematicPreview` production prop matches. `StrokeText` and `BuilderExploringMontage` props also match the previous production branch exactly.
- Reviewed dynamic/string public URLs separately from imports, including project image names containing spaces, the resume link, four montage URLs, and the absolute social-image URL in `index.html`.
- All retained public asset hashes match the pre-cleanup snapshot. The final effect presets, shader files, video lifecycle implementations, global scroll controller, scene timing modules, loader, nav resolver, and project link component also remain byte-identical to that snapshot.
- No retired preview route registration or EXPLORING Boundary Debug/MaskedHeading/Decrypted Text/Ghost Fibers source reference remains under `src/`. The remaining `CinematicPreview.jsx` import is the actual production application.
- Existing uncommitted work was preserved. A separate pre-cleanup source/status snapshot was recorded outside the repository; no Git reset, checkout, history rewrite, or branch deletion occurred.

## Git status

Current status includes the substantial unfinished Git staging state from before this maintenance task. Nothing was staged or committed.

- Modified tracked files: 21 (all were already modified before cleanup; this task changed 8 of them).
- Deleted tracked files: 22.
- Untracked files: 78, including this report and retained approved production components/media.
- Cleanup removals include 130 files in total; most experiment files were untracked/ignored, so they do not appear as tracked Git deletions.
- Cleanup added only this report. The exact cleanup edits are listed above; package/lockfile and other pre-existing modifications were not authored by this task.

## Manual verification before the GitHub update

1. Fresh load and reload: metallic loader objects, 0→100 progress, synchronized dot convergence, shortened centered transition line, and Hero entrance.
2. Hero typography, Tech Text readiness, Orbit, cursor, pointer/touch behavior, and responsive composition.
3. All three Selected Work images: tilt, spotlight, circular VIEW PROJECT, clicks across the image/circle, keyboard focus and activation, touch, correct destinations.
4. ABOUT introduction: Threads, metallic Orbit, Highlighter on every entry; Builder: full DESIGNING stroke/fill/reverse loop, complete EXPLORING G, all four montage clips, no seams, stable paragraph and adjacent labels.
5. JOURNEY content and transitions; JOURNEY navbar lands on readable 2021.
6. BEYOND navbar lands on settled MORE THAN JUST CODE; CODE material/period, Dither transparency and colorful cursor reveal; clean transition into TOOLKIT.
7. TOOLKIT black Blur text, correct active-node highlights and fades; Typewriter V2 starts CURIOUS. on every fresh entry, stops on exit, and resets correctly in both directions.
8. Transition to CONTACT, unchanged metallic typography and helix, contact links, navigation indicators, smooth scrolling.
9. Repeat key checks on smaller viewports, touch, keyboard, reduced motion, rapid scrolling, and reverse scrolling; check the console for runtime errors.
10. Former experimental URLs show the page-not-found link; `/` works without experiment query parameters. Review all pre-existing untracked production files and approved media when preparing the later GitHub update.
