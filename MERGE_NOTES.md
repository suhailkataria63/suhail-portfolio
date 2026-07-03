# Portfolio Background Merge Notes

Merged using `suhail-portfolio-main` as the base.

What changed:
- Added `src/components/HighEnd3DBackground.jsx` from `portfolio-3d`.
- Wired the animated wave/grid background into `src/App.jsx`.
- Added the `portfolio-3d` card/nav design hooks while keeping the main portfolio content, links, icons, and icon color classes.
- Updated `src/index.css` with the background/card/nav design layer and a safety override so SVG icons keep their original light/dark colors.

Run locally:
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```
