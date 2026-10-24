// Adapted from React Bits Tech Text, by David Haz:
// https://reactbits.dev/text-animations/tech-text
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { heroCanvasGlyphBounds } from '../../../../heroTextLineGeometry';

import './TechText.css';

const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const PREVIEW_LABEL_FONT = '600 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FALLOFF_STEPS = 8;
const SPRING = 320;
const INHERIT = /^(currentcolor|inherit)$/i;
const INTRO_DELAY = 0.15;
const KICK_DECAY = 0.62;

const approach = (current, target, dt, seconds) => current + (target - current) * (1 - Math.exp(-dt / seconds));

const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const noise = (...values) => {
  let h = 2166136261;
  for (const value of values) {
    h = Math.imul(h ^ (value | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

const signed = value => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0');

const TechText = ({
  text = 'React Bits',
  fontFamily = '',
  fontWeight = 600,
  fontSize = 150,
  letterSpacing = -0.05,
  color = 'currentColor',
  accentColor = 'currentColor',
  align = 'center',
  reach = 200,
  softness = 0.7,
  dashLength = 4,
  dashGap = 2,
  strokeWidth = 1.5,
  lineStyle = 'dashed',
  reveal = 'letter',
  specks = 15,
  selection = true,
  labels = true,
  draggable = true,
  bounce = 0.4,
  sweep = true,
  sweepOnce = false,
  speed = 1,
  clickKick = true,
  intro = 'none',
  introDuration = 2,
  guides = false,
  className = '',
  style,
  overlayOnly = false,
  ariaHidden = false,
  heroLayout = false,
  canvasInset = 0,
  viewportOverlay = false,
  viewportTargetRef = null,
  heroLifecycleRef = null,
  originX = 0,
  originY = 0,
  scaleX = 1,
  scaleY = 1,
  hitWidth = 0,
  hitHeight = 0,
  baselineY = 0,
  glyphPositions = null,
  onCanvasReady,
  onCanvasError,
  presentationControlRef = null,
  prepareOnly = false,
  interactionEnabled = true,
  onDiagnosticFrame,
  as = 'div'
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hitAreaRef = useRef(null);
  const settingsRef = useRef(null);
  const onCanvasReadyRef = useRef(onCanvasReady);
  const onCanvasErrorRef = useRef(onCanvasError);
  const onDiagnosticFrameRef = useRef(onDiagnosticFrame);
  const canvasReadyRef = useRef(false);
  const wakeRef = useRef(() => {});

  useLayoutEffect(() => {
    settingsRef.current = {
      text,
      fontFamily,
      fontWeight,
      fontSize,
      letterSpacing,
      color,
      accentColor,
      align,
      reach,
      softness,
      dashLength,
      dashGap,
      strokeWidth,
      lineStyle,
      reveal,
      specks,
      selection,
      labels,
      draggable,
      bounce,
      sweep,
      sweepOnce,
      speed,
      clickKick,
      intro,
      introDuration,
      guides,
      overlayOnly,
      heroLayout,
      canvasInset,
      viewportOverlay,
      heroLifecycleRef,
      originX,
      originY,
      scaleX,
      scaleY,
      baselineY,
      glyphPositions,
      prepareOnly,
      interactionEnabled
    };
    onCanvasReadyRef.current = onCanvasReady;
    onCanvasErrorRef.current = onCanvasError;
    onDiagnosticFrameRef.current = onDiagnosticFrame;
    heroLifecycleRef?.current?.entranceDiagnostics?.canvasState(text, 'TechText React settings layout commit', {
      prepareOnly, interactionEnabled, originX, originY, sweep, intro,
    });
    wakeRef.current();
  });

  useEffect(() => {
    const entranceDiagnostics = heroLifecycleRef?.current?.entranceDiagnostics;
    entranceDiagnostics?.canvasState(text, 'TechText canvas effect setup', { prepareOnly });
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const hitArea = hitAreaRef.current;
    let ctx = null;
    try { ctx = canvas?.getContext('2d'); } catch (error) {
      onCanvasErrorRef.current?.(error);
    }
    const scratch = document.createElement('canvas');
    let scratchCtx = null;
    try { scratchCtx = scratch.getContext('2d'); } catch (error) {
      onCanvasErrorRef.current?.(error);
    }
    if (!container || !canvas || !hitArea || !ctx || !scratchCtx) {
      onCanvasErrorRef.current?.(new Error('Tech Text could not initialize its 2D canvas contexts.'));
      return undefined;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let visible = prepareOnly;
    let targetVisible = false;
    let heroActive = heroLifecycleRef?.current?.active ?? true;
    let sceneOpacity = heroLifecycleRef?.current?.opacity ?? 1;
    // During the initial handoff the outer portal owns the entrance. Keep its
    // prepared bitmap presentable even if the scroll lifecycle is still inactive.
    // Relinquish this override once, when normal Hero interaction becomes ready.
    let entrancePresentationPending = Boolean(viewportOverlay && prepareOnly);
    let alive = true;
    let layoutKey = '';
    let requestedFont = '';
    let word = null;
    let glyphs = [];
    let presence = 0;
    let clock = 0;
    let pulse = 0;
    let placed = false;
    let dragging = -1;
    let dragPointerId = -1;
    let cursor = '';
    let previousDragZIndex = '';
    let introClock = 0;
    let introKind = '';
    let introducing = false;
    let sweepWasEnabled = false;
    let fontsReady = !document.fonts;
    let guideAlpha = 0;
    const kicks = [];
    const press = { x: 0, y: 0, time: 0, index: -1 };
    const pointer = { x: 0, y: 0, inside: false };
    const grab = { x: 0, y: 0 };
    const lens = { x: 0, y: 0 };
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

    const applyPresentation = () => {
      const s = settingsRef.current;
      if (entrancePresentationPending && heroActive && s?.interactionEnabled) {
        entrancePresentationPending = false;
      }
      const sceneActive = targetVisible && heroActive;
      visible = sceneActive || entrancePresentationPending;
      const shouldPaint = visible || s?.prepareOnly;
      const localOpacity = entrancePresentationPending ? 1 : sceneOpacity;
      const interactionEligible = sceneActive && s?.interactionEnabled;
      container.style.opacity = String(localOpacity);
      container.style.visibility = shouldPaint ? 'visible' : 'hidden';
      canvas.style.visibility = shouldPaint ? 'visible' : 'hidden';
      hitArea.style.pointerEvents = interactionEligible ? 'auto' : 'none';
      return { sceneActive, shouldPaint, localOpacity, interactionEligible, entrancePresentationPending };
    };

    const refreshFonts = () => {
      layoutKey = '';
      wakeRef.current();
    };

    const fontsLoaded = () => {
      fontsReady = true;
      entranceDiagnostics?.canvasState(text, 'TechText document.fonts.ready settled', { fontsReady });
      refreshFonts();
    };

    const family = s => s.fontFamily || getComputedStyle(container).fontFamily || 'sans-serif';
    const fontFor = (s, size) => `${s.fontWeight} ${size}px ${family(s)}`;

    const palette = s => {
      const current = getComputedStyle(container).color || '#000000';
      const pick = value => (!value || INHERIT.test(String(value).trim()) ? current : value);
      return { ink: pick(s.color), accent: pick(s.accentColor) };
    };

    const setFont = (target, s, size) => {
      target.font = fontFor(s, size);
      if ('letterSpacing' in target) target.letterSpacing = `${s.letterSpacing * size}px`;
      target.textAlign = 'left';
      target.textBaseline = 'alphabetic';
    };

    const sprite = (s, view, glyph, stroke, ink) => {
      const pad = Math.ceil(s.strokeWidth * 2 + 4);
      const left = glyph.box.x1 - pad;
      const top = glyph.box.y1 - pad;
      const w = glyph.box.x2 - glyph.box.x1 + pad * 2;
      const h = glyph.box.y2 - glyph.box.y1 + pad * 2;
      const image = document.createElement('canvas');
      image.width = Math.max(1, Math.ceil(w * dpr));
      image.height = Math.max(1, Math.ceil(h * dpr));
      const c = image.getContext('2d');
      if (!c) return { image, left, top };
      c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
      setFont(c, s, view.size);
      if (stroke) {
        c.lineJoin = 'round';
        c.lineWidth = s.strokeWidth * (s.overlayOnly || s.heroLayout ? 1 : 2);
        c.lineCap = 'butt';
        c.strokeStyle = ink;
        if (s.lineStyle !== 'solid') c.setLineDash([Math.max(1, s.dashLength), Math.max(1, s.dashGap)]);
        c.strokeText(glyph.char, glyph.x, view.baseline);
        c.setLineDash([]);
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000000';
        c.fillText(glyph.char, glyph.x, view.baseline);
        c.globalCompositeOperation = 'source-over';
      } else {
        c.fillStyle = ink;
        c.fillText(glyph.char, glyph.x, view.baseline);
      }
      return { image, left, top };
    };

    const ensureLayout = (s, ink) => {
      const key = [
        s.text,
        family(s),
        s.fontWeight,
        s.fontSize,
        s.letterSpacing,
        s.align,
        ink,
        s.dashLength,
        s.dashGap,
        s.strokeWidth,
        s.lineStyle,
        width,
        height,
        dpr,
        s.heroLayout,
        s.canvasInset,
        s.viewportOverlay,
        s.glyphPositions ? Object.values(s.glyphPositions).join(',') : ''
      ].join('|');
      if (key === layoutKey && word) return word;
      layoutKey = key;
      const wanted = fontFor(s, 64);
      if (document.fonts && wanted !== requestedFont) {
        requestedFont = wanted;
        // The cinematic loader already waits for document.fonts.ready before
        // releasing the Hero. Avoid a redundant load after handoff: its global
        // loadingdone event makes SculptureWindow remeasure and reseed the
        // Orbit landing transform, which used to produce a visible late snap.
        if (document.fonts.check(wanted, s.text)) {
          fontsReady = true;
        } else {
          document.fonts.load(wanted, s.text).then(refreshFonts, refreshFonts);
        }
      }

      const probe = scratchCtx;
      setFont(probe, s, s.fontSize);
      let m = probe.measureText(s.text);
      const fit = s.heroLayout ? 1 : Math.min(
        1,
        (width * (s.overlayOnly ? 0.99 : 0.9)) / Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, 1),
        (height * (s.overlayOnly ? 1.5 : 0.66)) / Math.max(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, 1)
      );
      const size = s.fontSize * fit;
      setFont(probe, s, size);
      m = probe.measureText(s.text);
      const fontAscentAtSize = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      const fontDescentAtSize = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
      const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const inkHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const margin = s.viewportOverlay
        ? 0
        : s.heroLayout && s.align === 'left'
        ? s.canvasInset
        : s.align === 'left' && s.overlayOnly
          ? 0
          : width * 0.05;
      const start =
        s.align === 'left' ? margin : s.align === 'right' ? width - margin - inkWidth : (width - inkWidth) / 2;
      const x = start + m.actualBoundingBoxLeft;
      const baseline = s.viewportOverlay
        ? s.baselineY
        : s.overlayOnly || s.heroLayout
          ? (height - fontAscentAtSize - fontDescentAtSize) / 2 + fontAscentAtSize
        : (height - inkHeight) / 2 + m.actualBoundingBoxAscent;
      const xHeight = baseline - probe.measureText('x').actualBoundingBoxAscent;
      const capHeight = baseline - probe.measureText('H').actualBoundingBoxAscent;
      const ascender = baseline - probe.measureText('d').actualBoundingBoxAscent;
      const descender = baseline + probe.measureText('p').actualBoundingBoxDescent;
      const top = baseline - m.actualBoundingBoxAscent;
      const bottom = baseline + m.actualBoundingBoxDescent;
      const inkTop = Math.min(top, capHeight) - 2;
      const inkBottom = Math.max(bottom, baseline) + 2;
      const next = {
        size,
        baseline,
        left: x - m.actualBoundingBoxLeft,
        right: x + m.actualBoundingBoxRight,
        top,
        bottom,
        lines: [
          { y: baseline, label: 'baseline' },
          { y: xHeight, label: 'x-height' },
          { y: capHeight, label: 'cap height' },
          ...(capHeight - ascender > Math.max(11, size * 0.06) ? [{ y: ascender, label: 'ascender' }] : []),
          { y: descender, label: 'descender' }
        ],
        bands: [
          { y0: xHeight, y1: baseline, up: true, order: 0 },
          { y0: capHeight, y1: xHeight, up: true, order: 1 },
          { y0: inkTop, y1: capHeight, up: true, order: 2 },
          { y0: baseline, y1: inkBottom, up: false, order: 1 }
        ].filter(band => band.y1 - band.y0 > 0.5)
      };
      word = next;

      const chars = Array.from(s.text);
      const previous = glyphs;
      glyphs = [];
      let prefix = '';
      let visibleLeft = Infinity;
      let visibleRight = -Infinity;
      let visibleTop = Infinity;
      let visibleBottom = -Infinity;
      let codeUnitOffset = 0;
      chars.forEach((char, i) => {
        prefix += char;
        const own = probe.measureText(char);
        const domStart = s.glyphPositions?.[codeUnitOffset];
        const heroBounds = s.viewportOverlay && Number.isFinite(domStart)
          ? heroCanvasGlyphBounds(domStart, own)
          : null;
        const gx = heroBounds
          ? heroBounds.originX
          : x + probe.measureText(prefix).width - own.width;
        codeUnitOffset += char.length;
        if (!char.trim()) return;
        const base = {
          char,
          x: gx,
          box: {
            x1: heroBounds ? heroBounds.x1 : gx - own.actualBoundingBoxLeft,
            y1: baseline - own.actualBoundingBoxAscent,
            x2: heroBounds ? heroBounds.x2 : gx + own.actualBoundingBoxRight,
            y2: baseline + own.actualBoundingBoxDescent
          }
        };
        visibleLeft = Math.min(visibleLeft, base.box.x1);
        visibleRight = Math.max(visibleRight, base.box.x2);
        visibleTop = Math.min(visibleTop, base.box.y1);
        visibleBottom = Math.max(visibleBottom, base.box.y2);
        const kept = previous[glyphs.length];
        glyphs.push({
          ...base,
          offset: kept?.char === char ? kept.offset : { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          outline: 0,
          shown: 1,
          cells: null,
          assembled: 0,
          index: i,
          fill: sprite(s, next, base, false, ink),
          dashes: sprite(s, next, base, true, ink)
        });
      });
      if (glyphs.length) {
        next.left = visibleLeft;
        next.right = visibleRight;
        next.top = visibleTop;
        next.bottom = visibleBottom;
      }
      dragging = -1;
      frame.index = -1;
      return next;
    };

    const glyphAt = (x, y, s) => {
      if (!word || y < word.top - 24 || y > word.bottom + 24) return -1;
      let best = -1;
      let bestDistance = Infinity;
      glyphs.forEach((glyph, i) => {
        const x1 = glyph.box.x1 + glyph.offset.x;
        const y1 = glyph.box.y1 + glyph.offset.y;
        const x2 = glyph.box.x2 + glyph.offset.x;
        const y2 = glyph.box.y2 + glyph.offset.y;
        const dx = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        const dy = y < y1 ? y1 - y : y > y2 ? y - y2 : 0;
        const d = Math.hypot(dx, dy);
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      });
      return bestDistance < Math.max(28, s.reach) ? best : -1;
    };

    const falloff = (target, cx, cy, radius, strength, softness) => {
      const inner = Math.min(1, Math.max(0, 1 - softness));
      const gradient = target.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
      if (inner > 0.995) {
        gradient.addColorStop(0.995, `rgba(0, 0, 0, ${strength})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        return gradient;
      }
      for (let i = 0; i <= FALLOFF_STEPS; i++) {
        const t = i / FALLOFF_STEPS;
        const eased = t * t * (3 - 2 * t);
        gradient.addColorStop(inner + (1 - inner) * t, `rgba(0, 0, 0, ${strength * (1 - eased)})`);
      }
      return gradient;
    };

    const worldTransform = s => {
      const sx = s.viewportOverlay ? s.scaleX || 1 : 1;
      const sy = s.viewportOverlay ? s.scaleY || 1 : 1;
      const ox = s.viewportOverlay ? s.originX || 0 : 0;
      const oy = s.viewportOverlay ? s.originY || 0 : 0;
      ctx.setTransform(dpr * sx, 0, 0, dpr * sy, ox * dpr, oy * dpr);
    };

    const blit = (target, art, dx, dy, cropX = 0, cropY = 0, s = settingsRef.current) => {
      const sx = s?.viewportOverlay ? s.scaleX || 1 : 1;
      const sy = s?.viewportOverlay ? s.scaleY || 1 : 1;
      const ox = s?.viewportOverlay ? s.originX || 0 : 0;
      const oy = s?.viewportOverlay ? s.originY || 0 : 0;
      target.drawImage(
        art.image,
        Math.round((ox + (art.left + dx) * sx) * dpr - cropX),
        Math.round((oy + (art.top + dy) * sy) * dpr - cropY),
        Math.max(1, art.image.width * sx),
        Math.max(1, art.image.height * sy)
      );
    };

    const drawReveal = s => {
      const radius = s.reach * dpr * Math.max(s.scaleX || 1, s.scaleY || 1);
      const cx = ((s.originX || 0) + lens.x * (s.scaleX || 1)) * dpr;
      const cy = ((s.originY || 0) + lens.y * (s.scaleY || 1)) * dpr;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = falloff(ctx, cx, cy, radius, presence, s.softness);
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = 'source-over';

      const x0 = Math.max(0, Math.floor(cx - radius));
      const y0 = Math.max(0, Math.floor(cy - radius));
      const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
      const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
      if (x1 <= x0 || y1 <= y0) {
        ctx.restore();
        return;
      }
      const w = x1 - x0;
      const h = y1 - y0;
      if (scratch.width < w || scratch.height < h) {
        scratch.width = Math.max(scratch.width, w);
        scratch.height = Math.max(scratch.height, h);
      }
      scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
      scratchCtx.globalCompositeOperation = 'source-over';
      scratchCtx.clearRect(0, 0, w, h);
      for (const glyph of glyphs) blit(scratchCtx, glyph.dashes, glyph.offset.x, glyph.offset.y, x0, y0, s);
      scratchCtx.globalCompositeOperation = 'destination-in';
      scratchCtx.fillStyle = falloff(scratchCtx, cx - x0, cy - y0, radius, 1, s.softness);
      scratchCtx.fillRect(0, 0, w, h);
      scratchCtx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = presence;
      ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h);
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const crisp = (value, axis = 'x', s = settingsRef.current) => {
      const scale = axis === 'x' ? (s?.viewportOverlay ? s.scaleX || 1 : 1) : (s?.viewportOverlay ? s.scaleY || 1 : 1);
      const origin = axis === 'x' ? (s?.viewportOverlay ? s.originX || 0 : 0) : (s?.viewportOverlay ? s.originY || 0 : 0);
      return (Math.round((origin + value * scale) * dpr) + 0.5) / (dpr * scale) - origin / scale;
    };

    const perimeterPoint = (distance, w, h) => {
      let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
      d -= w;
      if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
      d -= h;
      if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
      d -= w;
      return [frame.x1, frame.y2 - d, -1, 0];
    };

    const drawSpecks = (s, a, accent) => {
      const w = frame.x2 - frame.x1;
      const h = frame.y2 - frame.y1;
      if (w < 2 || h < 2) return;
      const perimeter = 2 * (w + h);
      const seed = frame.index + 1;
      const grid = 3;
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;

      for (let k = 0; k < s.specks; k++) {
        const period = 0.5 + noise(seed, k, 11) * 1.2;
        const t = pulse / period + noise(seed, k, 17);
        const cycle = Math.floor(t);
        const life = t - cycle;
        if (life > 0.88) continue;
        const [px, py, nx, ny] = perimeterPoint(noise(seed, k, cycle) * perimeter, w, h);
        const pick = noise(seed, k, cycle, 2);
        const size = pick < 0.46 ? 2 : pick < 0.7 ? 3 : pick < 0.84 ? 5 : pick < 0.94 ? 8 : 11;
        const large = size >= 8;
        const out = (large ? 9 : 4) + Math.floor(noise(seed, k, cycle, 1) * 5) * grid;
        const x = frame.x1 + Math.round((px + nx * out - frame.x1) / grid) * grid;
        const y = frame.y1 + Math.round((py + ny * out - frame.y1) / grid) * grid;
        const tone = noise(seed, k, cycle, 3);
        const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.52 : 1;
        const fade = 1 - smoothstep(0.68, 0.88, life);
        const alpha = a * (large ? 0.36 + 0.46 * tone : 0.42 + 0.5 * tone) * fade * blink;
        const left = Math.round(x - size / 2);
        const top = Math.round(y - size / 2);
        ctx.globalAlpha = alpha;
        if (tone < 0.26 || (large && tone < 0.78)) {
          ctx.strokeRect(left + 0.5, top + 0.5, size, size);
          if (large && tone > 0.5) ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        } else {
          ctx.fillRect(left, top, size, size);
        }
      }

      for (let j = 0; j < 2; j++) {
        const head = (pulse * 0.42 * s.speed + j * 0.5) * perimeter;
        for (let i = 0; i < 4; i++) {
          const [x, y] = perimeterPoint(head - i * 6, w, h);
          const size = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.98, 0.72, 0.48, 0.28][i];
          ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawFrame = (s, accent) => {
      const glyph = glyphs[frame.index];
      if (!glyph || frame.alpha < 0.01) return;
      const a = frame.alpha;
      ctx.save();
      const x1 = crisp(frame.x1, 'x', s);
      const y1 = crisp(frame.y1, 'y', s);
      const x2 = crisp(frame.x2, 'x', s);
      const y2 = crisp(frame.y2, 'y', s);
      worldTransform(s);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;

      const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
      if (moved > 1) {
        const hx = (glyph.box.x1 + glyph.box.x2) / 2;
        const hy = (glyph.box.y1 + glyph.box.y2) / 2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + glyph.offset.x, hy + glyph.offset.y);
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.45 * a;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.rect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 4);
        ctx.globalAlpha = 0.7 * a;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.5 * a;
      ctx.stroke();

      ctx.beginPath();
      for (const [cx, cy] of [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2]
      ]) {
        ctx.rect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
      }
      ctx.globalAlpha = 0.95 * a;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (s.specks > 0) drawSpecks(s, a, accent);

      if (!s.labels) {
        ctx.restore();
        return;
      }
      ctx.font = s.viewportOverlay ? PREVIEW_LABEL_FONT : LABEL_FONT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = accent;
      ctx.globalAlpha = (s.viewportOverlay ? 0.76 : 0.62) * a;
      if (s.viewportOverlay && 'letterSpacing' in ctx) ctx.letterSpacing = '0.25px';
      const label =
        moved > 1
          ? `${signed(Math.round(glyph.offset.x))}, ${signed(Math.round(-glyph.offset.y))}`
          : `${glyph.char}  ${Math.round(glyph.box.x2 - glyph.box.x1)} × ${Math.round(glyph.box.y2 - glyph.box.y1)}`;
      if (s.viewportOverlay) {
        const labelWidth = ctx.measureText(label).width;
        const localWidth = (width - (s.originX || 0)) / (s.scaleX || 1);
        const rightLabelX = frame.x2 + 8;
        const labelFitsRight = rightLabelX + labelWidth <= localWidth - 4;
        const labelX = labelFitsRight
          ? rightLabelX
          : Math.min(localWidth - 4, Math.max(labelWidth + 4, frame.x1 - 8));
        const localHeight = (height - (s.originY || 0)) / (s.scaleY || 1);
        const aboveY = frame.y1 - 8;
        const belowY = frame.y2 + 14;
        const labelY = aboveY >= 12
          ? Math.min(aboveY, localHeight - 4)
          : Math.min(localHeight - 4, belowY);
        ctx.textAlign = labelFitsRight ? 'left' : 'right';
        ctx.fillText(label, crisp(labelX, 'x', s), crisp(labelY, 'y', s));
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      } else {
        ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const drawLines = (s, view, accent, alpha, growth) => {
      const pad = Math.max(12, view.size * 0.12);
      const x1 = Math.round(view.left - pad);
      const x2 = Math.round(view.right + pad);
      const localWidth = s.viewportOverlay ? (width - (s.originX || 0)) / (s.scaleX || 1) : width;
      const room = localWidth - x2 > x1;
      ctx.save();
      worldTransform(s);
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.lineWidth = 1;
      ctx.font = s.viewportOverlay ? PREVIEW_LABEL_FONT : LABEL_FONT;
      ctx.textBaseline = 'middle';
      ctx.textAlign = room ? 'left' : 'right';
      if (s.viewportOverlay && 'letterSpacing' in ctx) ctx.letterSpacing = '0.25px';
      const placedLabels = [];
      view.lines.forEach((line, k) => {
        const grow = growth(k);
        if (grow <= 0.001) return;
        const y = crisp(line.y, 'y', s);
        const end = x1 + (x2 - x1) * grow;
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(end, y);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillRect(x1 - 1, crisp(line.y, 'y', s) - 1, 3, 3);
        ctx.fillRect(Math.round(end) - 1, crisp(line.y, 'y', s) - 1, 3, 3);
        if (s.labels) {
          if (!s.viewportOverlay) {
            ctx.globalAlpha = alpha * 0.62 * smoothstep(0.7, 1, grow);
            ctx.fillText(line.label, room ? x2 + 8 : x1 - 8, Math.round(line.y));
            return;
          }
          const labelWidth = ctx.measureText(line.label).width;
          const rightX = x2 + 9;
          const leftX = x1 - 9;
          const canRight = rightX + labelWidth <= localWidth - 4;
          const canLeft = leftX - labelWidth >= 4;
          const side = canRight && canLeft ? (k % 2 === 0 ? 'right' : 'left') : canRight ? 'right' : canLeft ? 'left' : 'edge';
          const labelX = side === 'right' ? rightX : side === 'left' ? leftX : localWidth - 4;
          let labelY = line.y;
          for (let n = 0; n < placedLabels.length; n++) {
            const prior = placedLabels[n];
            if (prior.side === side && Math.abs(labelY - prior.y) < 12) {
              labelY = prior.y + (k % 2 === 0 ? 12 : -12);
            }
          }
          ctx.globalAlpha = alpha * 0.78 * smoothstep(0.7, 1, grow);
          ctx.textAlign = side === 'right' ? 'left' : 'right';
          ctx.fillText(line.label, crisp(labelX, 'x', s), crisp(labelY, 'y', s));
          placedLabels.push({ side, y: labelY });
        }
      });
      if (s.viewportOverlay && 'letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore();
    };

    const ensureCells = (glyph, view) => {
      if (glyph.cells) return glyph.cells;
      const art = glyph.fill;
      const size = Math.max(3, Math.round(view.size / 26));
      const w = art.image.width;
      const h = art.image.height;
      const source = art.image.getContext('2d');
      const cells = [];
      glyph.cells = cells;
      glyph.assembled = 0;
      if (!source || w < 2 || h < 2) return cells;
      const data = source.getImageData(0, 0, w, h).data;
      const gx = Math.floor(art.left / size) * size;
      const gy = Math.floor(art.top / size) * size;
      const cols = Math.ceil((art.left + w / dpr - gx) / size) + 1;
      const rows = Math.ceil((art.top + h / dpr - gy) / size) + 1;
      const hit = new Uint8Array(cols * rows);
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          if (data[(py * w + px) * 4 + 3] < 24) continue;
          const cx = Math.floor((art.left + px / dpr - gx) / size);
          const cy = Math.floor((art.top + py / dpr - gy) / size);
          hit[cy * cols + cx] = 1;
        }
      }
      const center = (glyph.box.x1 + glyph.box.x2) / 2;
      const along = clamp01((center - view.left) / Math.max(1, view.right - view.left));
      for (let k = 0; k < hit.length; k++) {
        if (!hit[k]) continue;
        const angle = noise(glyph.index, k, 1) * Math.PI * 2;
        const distance = view.size * (0.25 + 0.6 * noise(glyph.index, k, 2));
        const start = 0.03 + 0.36 * along + 0.12 * noise(glyph.index, k, 3);
        const land = start + 0.3 + 0.14 * noise(glyph.index, k, 4);
        cells.push({
          x: gx + (k % cols) * size,
          y: gy + Math.floor(k / cols) * size,
          size,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance * 0.7,
          start,
          land
        });
        glyph.assembled = Math.max(glyph.assembled, land);
      }
      return cells;
    };

    const cellRect = (x, y, size, s = settingsRef.current) => {
      const sx = s?.viewportOverlay ? s.scaleX || 1 : 1;
      const sy = s?.viewportOverlay ? s.scaleY || 1 : 1;
      const ox = s?.viewportOverlay ? s.originX || 0 : 0;
      const oy = s?.viewportOverlay ? s.originY || 0 : 0;
      const left = Math.round((ox + x * sx) * dpr);
      const top = Math.round((oy + y * sy) * dpr);
      return [left, top, Math.round(size * sx * dpr), Math.round(size * sy * dpr)];
    };

    const drawAssembling = (glyph, progress, accent, s) => {
      const cells = glyph.cells || [];
      ctx.save();
      ctx.beginPath();
      let landed = 0;
      for (const cell of cells) {
        if (progress < cell.land) continue;
        const [x, y, w, h] = cellRect(cell.x, cell.y, cell.size, s);
        ctx.rect(x, y, w, h);
        landed++;
      }
      if (landed) {
        ctx.clip();
        blit(ctx, glyph.fill, 0, 0, 0, 0);
      }
      ctx.restore();
      ctx.fillStyle = accent;
      for (const cell of cells) {
        if (progress < cell.start || progress >= cell.land) continue;
        const u = (progress - cell.start) / (cell.land - cell.start);
        const eased = 1 - Math.pow(1 - u, 4);
        const size = cell.size * (0.4 + 0.6 * eased);
        const x = cell.x + (cell.size - size) / 2 + cell.dx * (1 - eased);
        const y = cell.y + (cell.size - size) / 2 + cell.dy * (1 - eased);
        const [left, top, w, h] = cellRect(x, y, size, s);
        ctx.globalAlpha = Math.min(1, u * 4) * (0.55 + 0.45 * eased);
        ctx.fillRect(left, top, Math.max(1, w), Math.max(1, h));
      }
      ctx.globalAlpha = 1;
    };

    const drawFilling = (glyph, lead, progress, view, s) => {
      const art = glyph.fill;
      const sx = s.viewportOverlay ? s.scaleX || 1 : 1;
      const sy = s.viewportOverlay ? s.scaleY || 1 : 1;
      const ox = s.viewportOverlay ? s.originX || 0 : 0;
      const oy = s.viewportOverlay ? s.originY || 0 : 0;
      const left = Math.floor((ox + art.left * sx) * dpr);
      const top = Math.floor((oy + art.top * sy) * dpr);
      const w = Math.ceil(art.image.width * sx) + 2;
      const h = Math.ceil(art.image.height * sy) + 2;
      const fill = clamp01((progress - 0.24 - 0.28 * lead) / 0.48);
      const rects = [];
      for (const band of view.bands) {
        const amount = smoothstep(0.3 * band.order, 0.3 * band.order + 0.4, fill);
        if (amount <= 0) continue;
        const span = (band.y1 - band.y0) * amount;
        const y0 = Math.round((oy + (band.up ? band.y1 - span : band.y0) * sy) * dpr);
        const y1 = Math.round((oy + (band.up ? band.y1 : band.y0 + span) * sy) * dpr);
        if (y1 > y0) rects.push([y0, y1 - y0]);
      }
      const outline = smoothstep(0.08 + 0.2 * lead, 0.22 + 0.2 * lead, progress);
      if (outline > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(left - 2, top - 2, w + 2, h + 2);
        for (const [y, span] of rects) ctx.rect(left - 2, y, w + 2, span);
        ctx.clip('evenodd');
        ctx.globalAlpha = outline;
        blit(ctx, glyph.dashes, 0, 0, 0, 0);
        ctx.restore();
      }
      if (rects.length) {
        ctx.save();
        ctx.beginPath();
        for (const [y, span] of rects) ctx.rect(left - 2, y, w + 2, span);
        ctx.clip();
        blit(ctx, glyph.fill, 0, 0, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const kick = index => {
      const strength = (word ? word.size : 120) * 11;
      kicks.push({ index, at: pulse, velocity: strength });
      for (let d = 1; d < glyphs.length; d++) {
        const velocity = strength * Math.pow(KICK_DECAY, d);
        if (velocity < 30) break;
        for (const j of [index - d, index + d]) {
          if (j >= 0 && j < glyphs.length) kicks.push({ index: j, at: pulse + d * 0.055, velocity });
        }
      }
      wakeRef.current();
    };

    const tick = now => {
      raf = 0;
      if (!heroActive && !settingsRef.current?.prepareOnly && !entrancePresentationPending) return;
      const s = settingsRef.current;
      if (!s) return;
      const interactionEligible = heroActive && targetVisible && s.interactionEnabled;
      if (s.sweep && !sweepWasEnabled) clock = 0;
      sweepWasEnabled = s.sweep;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const { ink, accent } = palette(s);
      const view = ensureLayout(s, ink);
      const damping = 2 * Math.sqrt(SPRING) * (1 - clamp01(s.bounce) * 0.96);

      if (s.intro !== introKind) {
        introKind = s.intro;
        introClock = 0;
      }
      const introOn = interactionEligible && introKind !== 'none' && !reducedMotion && glyphs.length > 0;
      if (introOn && fontsReady) introClock += dt;
      const progress = introOn ? clamp01((introClock - INTRO_DELAY) / Math.max(0.3, s.introDuration)) : 1;
      introducing = introOn && progress < 1;

      const sweepLimit = Math.PI / 0.45;
      const sweepAvailable = s.sweep && (!s.sweepOnce || clock < sweepLimit);
      const sweeping = interactionEligible && !introducing && sweepAvailable && !reducedMotion && !pointer.inside && dragging < 0;
      if (sweeping) clock += dt * s.speed;
      pulse += dt;
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (sweeping) {
        targetX = view.left + (view.right - view.left) * (0.5 - 0.5 * Math.cos(clock * 0.45));
        targetY = view.top + (view.bottom - view.top) * (0.45 + 0.1 * Math.sin(clock * 0.8));
      }
      const active = interactionEligible && !introducing && (pointer.inside || sweeping || dragging >= 0);
      if (active && !placed) {
        lens.x = targetX;
        lens.y = targetY;
      }
      if (active) {
        const lag = pointer.inside ? 0.05 : 0.22;
        lens.x = approach(lens.x, targetX, dt, lag);
        lens.y = approach(lens.y, targetY, dt, lag);
      }
      placed = active;
      presence = approach(presence, s.reveal === 'area' && active && dragging < 0 ? 1 : 0, dt, 0.16);

      for (let k = kicks.length - 1; k >= 0; k--) {
        if (kicks[k].at > pulse) continue;
        const glyph = glyphs[kicks[k].index];
        if (glyph) glyph.velocity.y -= kicks[k].velocity;
        kicks.splice(k, 1);
      }

      let moving = false;
      glyphs.forEach((glyph, i) => {
        if (i === dragging) {
          glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);
          glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);
          glyph.velocity.x = 0;
          glyph.velocity.y = 0;
          moving = true;
          return;
        }
        const { offset, velocity } = glyph;
        if (Math.abs(offset.x) < 0.05 && Math.abs(offset.y) < 0.05 && Math.hypot(velocity.x, velocity.y) < 0.5) {
          offset.x = 0;
          offset.y = 0;
          velocity.x = 0;
          velocity.y = 0;
          return;
        }
        velocity.x += (-SPRING * offset.x - damping * velocity.x) * dt;
        velocity.y += (-SPRING * offset.y - damping * velocity.y) * dt;
        offset.x += velocity.x * dt;
        offset.y += velocity.y * dt;
        moving = true;
      });

      let typing = -1;
      if (introducing && introKind === 'type') {
        const step = 0.86 / glyphs.length;
        const cursorAt = Math.min(glyphs.length - 1, Math.floor(progress / step));
        typing = progress < 0.93 ? cursorAt : -1;
        glyphs.forEach((glyph, i) => {
          glyph.shown = i < cursorAt ? 1 : i === cursorAt ? smoothstep(0, step * 0.3, progress - i * step) : 0;
        });
      } else {
        glyphs.forEach(glyph => {
          glyph.shown = 1;
        });
      }

      const focus = introducing ? typing : dragging >= 0 ? dragging : active ? glyphAt(lens.x, lens.y, s) : -1;
      if (focus >= 0 && s.selection) {
        const glyph = glyphs[focus];
        const bx1 = glyph.box.x1 + glyph.offset.x - 6;
        const by1 = glyph.box.y1 + glyph.offset.y - 6;
        const bx2 = glyph.box.x2 + glyph.offset.x + 6;
        const by2 = glyph.box.y2 + glyph.offset.y + 6;
        if (frame.index < 0 || frame.alpha < 0.02) {
          frame.x1 = bx1;
          frame.y1 = by1;
          frame.x2 = bx2;
          frame.y2 = by2;
        }
        const glide = focus === dragging ? 0.02 : 0.08;
        frame.x1 = approach(frame.x1, bx1, dt, glide);
        frame.y1 = approach(frame.y1, by1, dt, glide);
        frame.x2 = approach(frame.x2, bx2, dt, glide);
        frame.y2 = approach(frame.y2, by2, dt, glide);
        frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);

      glyphs.forEach((glyph, i) => {
        const target = introducing
          ? introKind === 'type' && (i === typing || (typing >= 0 && i > typing))
            ? 1
            : 0
          : s.reveal === 'letter' && i === focus && i !== dragging
            ? 1
            : 0;
        if (introducing && glyph.shown === 0) glyph.outline = target;
        glyph.outline = approach(glyph.outline, target, dt, 0.09);
        if (Math.abs(glyph.outline - target) > 0.002) moving = true;
        else glyph.outline = target;
      });

      guideAlpha = approach(guideAlpha, s.guides && !introducing && (focus >= 0 || presence > 0.4) ? 1 : 0, dt, 0.14);

      const hovering = !introducing && focus >= 0 && pointer.inside;
      const nextCursor =
        dragging >= 0 ? 'grabbing' : hovering && s.draggable ? 'grab' : hovering && s.clickKick ? 'pointer' : '';
      if (nextCursor !== cursor) {
        cursor = nextCursor;
        hitArea.style.cursor = nextCursor;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const glyph of glyphs) {
        const moved = Math.hypot(glyph.offset.x, glyph.offset.y);
        if (moved > 1) {
          ctx.globalAlpha = Math.min(1, moved / 24) * 0.55;
          blit(ctx, glyph.dashes, 0, 0, 0, 0);
          ctx.globalAlpha = 1;
        }
      }
      if (introducing && introKind === 'metrics') {
        drawLines(s, view, accent, 1 - smoothstep(0.84, 1, progress), k =>
          smoothstep(0.02 + 0.04 * k, 0.2 + 0.04 * k, progress)
        );
      } else if (guideAlpha > 0.005) {
        drawLines(s, view, accent, guideAlpha * 0.6, () => 1);
      }
      glyphs.forEach((glyph, i) => {
        if (introducing && introKind === 'assemble') {
          ensureCells(glyph, view);
          if (progress < glyph.assembled) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            drawAssembling(glyph, progress, accent, s);
            ctx.restore();
            return;
          }
        }
        if (introducing && introKind === 'metrics') {
          const lead = glyphs.length > 1 ? i / (glyphs.length - 1) : 0;
          if (progress < 0.72 + 0.28 * lead) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            drawFilling(glyph, lead, progress, view, s);
            ctx.restore();
            return;
          }
        }
        if (glyph.shown < 0.001) return;
        if (!s.overlayOnly && glyph.outline < 0.999) {
          ctx.globalAlpha = (1 - glyph.outline) * glyph.shown;
          blit(ctx, glyph.fill, glyph.offset.x, glyph.offset.y, 0, 0);
        }
        if (glyph.outline > 0.001) {
          ctx.globalAlpha = glyph.outline * glyph.shown;
          blit(ctx, glyph.dashes, glyph.offset.x, glyph.offset.y, 0, 0);
        }
        ctx.globalAlpha = 1;
      });
      if (presence > 0.001) drawReveal(s);
      drawFrame(s, accent);
      if (entranceDiagnostics?.active) {
        entranceDiagnostics.paint(s.text, {
          glyphCount: glyphs.filter(glyph => glyph.shown > 0.001).length,
          fontsReady, originX: s.originX, originY: s.originY, scaleX: s.scaleX, scaleY: s.scaleY,
          bitmapWidth: canvas.width, bitmapHeight: canvas.height,
          heroActive, targetVisible, sceneOpacity, localOpacity: Number(container.style.opacity),
          entrancePresentationPending, preparing: s.prepareOnly,
          interactionEnabled: s.interactionEnabled, interactionEligible, introducing, active,
        });
      }

      if (s.text === 'BUILDING' && onDiagnosticFrameRef.current) {
        const targetGlyph = glyphs.find(glyph => glyph.index === 5)
        if (targetGlyph) {
          const canvasBounds = canvas.getBoundingClientRect()
          const screenX = value => canvasBounds.left + (value * dpr / Math.max(1, canvas.width)) * canvasBounds.width
          const screenY = value => canvasBounds.top + (value * dpr / Math.max(1, canvas.height)) * canvasBounds.height
          const boundsFor = (dx, dy) => ({
            left: screenX(s.originX + (targetGlyph.box.x1 + dx) * s.scaleX),
            top: screenY(s.originY + (targetGlyph.box.y1 + dy) * s.scaleY),
            right: screenX(s.originX + (targetGlyph.box.x2 + dx) * s.scaleX),
            bottom: screenY(s.originY + (targetGlyph.box.y2 + dy) * s.scaleY),
          })
          const restingBounds = boundsFor(0, 0)
          const renderedBounds = boundsFor(targetGlyph.offset.x, targetGlyph.offset.y)
          const center = bounds => ({ x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 })
          const containerBounds = container.getBoundingClientRect()
          const selectionFrame = frame.index >= 0 ? {
            index: frame.index, alpha: frame.alpha,
            bounds: {
              left: screenX(s.originX + frame.x1 * s.scaleX), top: screenY(s.originY + frame.y1 * s.scaleY),
              right: screenX(s.originX + frame.x2 * s.scaleX), bottom: screenY(s.originY + frame.y2 * s.scaleY),
            },
          } : null
          onDiagnosticFrameRef.current({
            source: 'Tech Text draw loop · BUILDING glyph index 5', character: 'I', characterIndex: targetGlyph.index,
            restingBounds, renderedBounds, restingCenter: center(restingBounds), renderedCenter: center(renderedBounds),
            displacement: { x: targetGlyph.offset.x * s.scaleX, y: targetGlyph.offset.y * s.scaleY },
            localGlyphBounds: { ...targetGlyph.box },
            canvasRect: { left: canvasBounds.left, top: canvasBounds.top, width: canvasBounds.width, height: canvasBounds.height },
            portalRect: { left: containerBounds.left, top: containerBounds.top, width: containerBounds.width, height: containerBounds.height, transform: getComputedStyle(container).transform },
            canvasBitmap: { width: canvas.width, height: canvas.height }, devicePixelRatio: dpr,
            origin: { x: s.originX, y: s.originY }, scale: { x: s.scaleX, y: s.scaleY },
            selectionFrame,
            canvasVisible: visible, heroActive, targetVisible, sceneOpacity,
            localOpacity: Number(container.style.opacity), entrancePresentationPending, interactionEligible,
            animation: { dragging: dragging === 5, active: active, pointerInside: pointer.inside, focus, outline: targetGlyph.outline, frameAlpha: frame.alpha },
          })
        }
      }

      if (fontsReady && !canvasReadyRef.current) {
        canvasReadyRef.current = true;
        entranceDiagnostics?.canvasState(s.text, 'TechText first successful paint → onCanvasReady()', { fontsReady, ready: true });
        onCanvasReadyRef.current?.();
      }

      const settling =
        moving ||
        introducing ||
        kicks.length > 0 ||
        (guideAlpha > 0.005 && guideAlpha < 0.995) ||
        Math.abs(presence - (s.reveal === 'area' && active && dragging < 0 ? 1 : 0)) > 0.002 ||
        (frame.alpha > 0.01 && frame.alpha < 0.99);
      if ((active || settling) && (visible || settingsRef.current?.prepareOnly) && alive) raf = requestAnimationFrame(safeTick);
    };

    const safeTick = now => {
      try {
        tick(now);
      } catch (error) {
        entranceDiagnostics?.canvasState(text, 'TechText.safeTick() caught paint failure', { error: error.message });
        alive = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        onCanvasErrorRef.current?.(error);
      }
    };

    const wake = () => {
      const s = settingsRef.current;
      const presentation = applyPresentation();
      entranceDiagnostics?.write('TechText.wake() → inner renderer/canvas visibility', {
        line: text, ...presentation, heroActive, targetVisible, preparing: s?.prepareOnly, interactionEnabled: s?.interactionEnabled,
      });
      if (raf || !presentation.shouldPaint || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(safeTick);
    };
    wakeRef.current = wake;

    if (presentationControlRef) {
      presentationControlRef.current = {
        setOrigin(x, y) {
          const s = settingsRef.current;
          if (!s || !s.viewportOverlay || !alive || (s.originX === x && s.originY === y)) return;
          entranceDiagnostics?.write('TechText.setOrigin() → glyph origin, hit target and synchronous draw', { line: text, oldX: s.originX, oldY: s.originY, x, y });
          s.originX = x;
          s.originY = y;
          hitArea.style.left = `${x}px`;
          hitArea.style.top = `${y}px`;
          // Paint in the same GSAP update as the native section's movement.
          // The bitmap stays viewport-sized; only its measured glyph origin moves.
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          safeTick(performance.now());
        }
      };
    }

    const syncHeroLifecycle = lifecycle => {
      const wasActive = heroActive;
      heroActive = lifecycle?.active ?? true;
      sceneOpacity = heroActive ? (lifecycle?.opacity ?? 1) : 0;
      // A first post-loader publication can already be outside the Hero (for
      // example, restored scroll). End the entrance override in that case too.
      // Do this on a lifecycle publication, so a React handoff commit cannot
      // briefly expose the stale, inactive scroll state between owners.
      if (entrancePresentationPending && !settingsRef.current?.prepareOnly
          && viewportTargetRef?.current?.closest('[data-cinematic-hero]')?.dataset.loaderActive === 'false') {
        entrancePresentationPending = false;
      }
      const presentation = applyPresentation();
      entranceDiagnostics?.write('TechText.syncHeroLifecycle() → inner renderer opacity and visibility', {
        line: text, opacity: presentation.localOpacity, ...presentation, heroActive, targetVisible, preparing: settingsRef.current?.prepareOnly,
      });

      if (!heroActive && !settingsRef.current?.prepareOnly && !entrancePresentationPending) {
        pointer.inside = false;
        placed = false;
        cursor = '';
        press.index = -1;
        hitArea.style.cursor = '';
        if (dragging >= 0) {
          if (dragPointerId >= 0 && hitArea.hasPointerCapture?.(dragPointerId)) {
            hitArea.releasePointerCapture(dragPointerId);
          }
          dragging = -1;
          dragPointerId = -1;
          container.style.zIndex = previousDragZIndex || '24';
        }
        glyphs.forEach(glyph => {
          glyph.offset.x = 0;
          glyph.offset.y = 0;
          glyph.velocity.x = 0;
          glyph.velocity.y = 0;
        });
        kicks.length = 0;
        frame.alpha = 0;
        frame.index = -1;
        guideAlpha = 0;
        presence = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        entranceDiagnostics?.canvasState(text, 'TechText inactive Hero → clear bitmap and interaction state', { bitmapReset: true });
        return;
      }

      if (!wasActive && targetVisible) wake();
      else if (settingsRef.current?.prepareOnly) wake();
    };
    const lifecycleListeners = heroLifecycleRef?.current?.listeners;
    lifecycleListeners?.add(syncHeroLifecycle);

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      entranceDiagnostics?.canvasState(text, 'TechText.resize() → reset canvas bitmap', { bitmapReset: true, width, height, dpr, bitmapWidth: canvas.width, bitmapHeight: canvas.height });
      layoutKey = '';
      wake();
    };

    const locate = e => {
      const s = settingsRef.current;
      if (s?.viewportOverlay) {
        pointer.x = (e.clientX - (s.originX || 0)) / (s.scaleX || 1);
        pointer.y = (e.clientY - (s.originY || 0)) / (s.scaleY || 1);
        return;
      }
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) * (container.clientWidth / Math.max(rect.width, 1));
      pointer.y = (e.clientY - rect.top) * (container.clientHeight / Math.max(rect.height, 1));
    };
    const onMove = e => {
      if (!heroActive || !targetVisible || !settingsRef.current?.interactionEnabled) return;
      locate(e);
      pointer.inside = true;
      wake();
    };
    const onLeave = () => {
      if (dragging >= 0) return;
      pointer.inside = false;
      wake();
    };
    const onDown = e => {
      if (!heroActive || !targetVisible || !settingsRef.current?.interactionEnabled) return;
      locate(e);
      pointer.inside = true;
      const s = settingsRef.current;
      const primary = e.pointerType !== 'mouse' || e.button === 0;
      const index = introducing || !primary ? -1 : glyphAt(pointer.x, pointer.y, settingsRef.current);
      press.x = pointer.x;
      press.y = pointer.y;
      press.time = performance.now();
      press.index = index;
      if (s?.draggable && index >= 0) {
        dragging = index;
        dragPointerId = e.pointerId;
        if (s.viewportOverlay) {
          previousDragZIndex = container.style.zIndex;
          container.style.zIndex = '25';
        }
        grab.x = pointer.x - glyphs[index].offset.x;
        grab.y = pointer.y - glyphs[index].offset.y;
        hitArea.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      }
      wake();
    };
    const onUp = e => {
      locate(e);
      if (dragging >= 0) {
        dragging = -1;
        dragPointerId = -1;
        if (settingsRef.current?.viewportOverlay) container.style.zIndex = previousDragZIndex;
        hitArea.releasePointerCapture?.(e.pointerId);
        const rect = hitArea.getBoundingClientRect();
        pointer.inside =
          e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      }
      if (
        e.type === 'pointerup' &&
        press.index >= 0 &&
        settingsRef.current?.clickKick &&
        !reducedMotion &&
        performance.now() - press.time < 450
      ) {
        if (Math.hypot(pointer.x - press.x, pointer.y - press.y) < 6) kick(press.index);
      }
      press.index = -1;
      wake();
    };

    hitArea.addEventListener('pointermove', onMove, { passive: true });
    hitArea.addEventListener('pointerenter', onMove, { passive: true });
    hitArea.addEventListener('pointerdown', onDown, { passive: false });
    hitArea.addEventListener('pointerup', onUp, { passive: true });
    hitArea.addEventListener('pointercancel', onUp, { passive: true });
    hitArea.addEventListener('pointerleave', onLeave, { passive: true });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener('resize', resize, { passive: true });
    const observationTarget = viewportOverlay && viewportTargetRef?.current ? viewportTargetRef.current : container;
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      targetVisible = entry.isIntersecting;
      const presentation = applyPresentation();
      entranceDiagnostics?.write('TechText IntersectionObserver → inner renderer/canvas visibility', {
        line: text, isIntersecting: entry.isIntersecting, heroActive, visible, ...presentation,
      });
      if (visible) wake();
    });
    intersectionObserver.observe(observationTarget);
    const themeObserver = new MutationObserver(wake);
    for (const node of [document.documentElement, document.body]) {
      if (node) themeObserver.observe(node, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    }
    const schemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    schemeQuery?.addEventListener?.('change', wake);
    if (document.fonts) document.fonts.ready.then(fontsLoaded, fontsLoaded);

    resize();
    syncHeroLifecycle(heroLifecycleRef?.current);

    return () => {
      entranceDiagnostics?.canvasState(text, 'TechText canvas effect cleanup', {});
      alive = false;
      cancelAnimationFrame(raf);
      lifecycleListeners?.delete(syncHeroLifecycle);
      wakeRef.current = () => {};
      if (presentationControlRef) presentationControlRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      schemeQuery?.removeEventListener?.('change', wake);
      hitArea.style.cursor = '';
      hitArea.removeEventListener('pointermove', onMove);
      hitArea.removeEventListener('pointerenter', onMove);
      hitArea.removeEventListener('pointerdown', onDown);
      hitArea.removeEventListener('pointerup', onUp);
      hitArea.removeEventListener('pointercancel', onUp);
      hitArea.removeEventListener('pointerleave', onLeave);
      if (dragPointerId >= 0 && hitArea.hasPointerCapture?.(dragPointerId)) hitArea.releasePointerCapture(dragPointerId);
    };
  }, []);

  const Root = as;
  const hitAreaStyle = viewportOverlay
    ? { inset: 'auto', left: originX, top: originY, right: 'auto', bottom: 'auto', width: hitWidth, height: hitHeight }
    : heroLayout
      ? { left: canvasInset, top: canvasInset, width: `calc(100% - ${canvasInset * 2}px)`, height: `calc(100% - ${canvasInset * 2}px)` }
    : undefined;
  return (
    <Root ref={containerRef} className={`tech-text ${className}`.trim()} style={style} role={overlayOnly || ariaHidden ? undefined : 'img'} aria-label={overlayOnly || ariaHidden ? undefined : text} aria-hidden={overlayOnly || ariaHidden ? 'true' : undefined}>
      <canvas ref={canvasRef} className="tech-text-canvas" />
      <span ref={hitAreaRef} className="tech-text-hit-area" style={hitAreaStyle} aria-hidden="true" />
    </Root>
  );
};

export default TechText;
