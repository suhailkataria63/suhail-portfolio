import { memo, useEffect, useRef } from "react";

const palettes = {
  dark: {
    top: "#020617",
    mid: "#050816",
    bottom: "#10051f",
    horizon: "rgba(34, 211, 238, 0.18)",
    gridMajor: "rgba(103, 232, 249, 0.40)",
    gridMinor: "rgba(148, 163, 184, 0.16)",
    vertical: "rgba(139, 92, 246, 0.20)",
    ribbonA: "rgba(34, 211, 238, 0.72)",
    ribbonB: "rgba(167, 139, 250, 0.55)",
    particles: "rgba(248, 250, 252, 0.74)",
    ripple: "rgba(103, 232, 249,"
  },
  light: {
    top: "#ffffff",
    mid: "#f7fcff",
    bottom: "#eef4ff",
    horizon: "rgba(37, 99, 235, 0.12)",
    gridMajor: "rgba(37, 99, 235, 0.28)",
    gridMinor: "rgba(14, 165, 233, 0.13)",
    vertical: "rgba(124, 58, 237, 0.12)",
    ribbonA: "rgba(37, 99, 235, 0.46)",
    ribbonB: "rgba(14, 165, 233, 0.36)",
    particles: "rgba(30, 64, 175, 0.95)",
    ripple: "rgba(37, 99, 235,"
  }
};

const interactiveSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "[role='button']",
  ".portfolio-nav",
  ".glass-card",
  ".profile-card",
  ".project-card",
  ".skill-card",
  ".experience-card",
  ".education-card",
  ".contact-box",
  "[data-no-bg-ripple]"
].join(",");

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function HighEnd3DBackground({ theme = "dark" }) {
  const canvasRef = useRef(null);
  const themeRef = useRef(theme === "light" ? "light" : "dark");
  const pointerRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const pulsesRef = useRef([]);

  useEffect(() => {
    themeRef.current = theme === "light" ? "light" : "dark";
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let timeout = 0;
    let running = true;
    let lastFrame = 0;

    const reducedMotion = prefersReducedMotion();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event) => {
      pointerRef.current.x = (event.clientX / width - 0.5) * 2;
      pointerRef.current.y = (event.clientY / height - 0.5) * 2;
    };

    const onClick = (event) => {
      if (event.target?.closest?.(interactiveSelector)) return;

      pulsesRef.current.push({
        x: event.clientX,
        y: event.clientY,
        born: performance.now()
      });

      if (pulsesRef.current.length > 3) pulsesRef.current.shift();
    };

    const project = (u, v, time, px, py) => {
      const horizon = height * 0.36;
      const floor = height * 1.04;
      const depth = Math.max(0, Math.min(1, v));
      const curve = Math.pow(depth, 1.72);
      const spread = width * (0.22 + depth * 0.88);

      const wave =
        Math.sin(u * 3.2 + time * 0.85 + depth * 1.6) * (3 + depth * 20) +
        Math.sin(u * 6.4 - time * 0.55 + depth * 2.1) * (2 + depth * 8);

      return {
        x: width * 0.5 + u * spread + px * (4 + depth * 18),
        y: horizon + curve * (floor - horizon) + wave + py * (2 + depth * 9),
        depth
      };
    };

    const makeRow = (v, time, px, py, samples = 96) => {
      const pts = [];

      for (let i = 0; i < samples; i += 1) {
        const u = -1.18 + (i / (samples - 1)) * 2.36;
        pts.push(project(u, v, time, px, py));
      }

      return pts;
    };

    const makeColumn = (u, time, px, py, samples = 32) => {
      const pts = [];

      for (let i = 0; i < samples; i += 1) {
        const v = i / (samples - 1);
        pts.push(project(u, v, time, px, py));
      }

      return pts;
    };

    const strokeSmooth = (pts, color, widthValue, alpha, glow = 0) => {
      if (pts.length < 2) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = widthValue;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (glow) {
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length - 1; i += 1) {
        const midX = (pts[i].x + pts[i + 1].x) * 0.5;
        const midY = (pts[i].y + pts[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }

      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    };

    const drawBackground = (palette, activeTheme) => {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, palette.top);
      bg.addColorStop(0.56, palette.mid);
      bg.addColorStop(1, palette.bottom);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const leftGlow = ctx.createRadialGradient(
        width * 0.08,
        height * 0.42,
        0,
        width * 0.08,
        height * 0.42,
        width * 0.42
      );

      leftGlow.addColorStop(
        0,
        activeTheme === "dark" ? "rgba(8,145,178,0.14)" : "rgba(186,230,253,0.28)"
      );
      leftGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      const rightGlow = ctx.createRadialGradient(
        width * 0.88,
        height * 0.75,
        0,
        width * 0.88,
        height * 0.75,
        width * 0.44
      );

      rightGlow.addColorStop(
        0,
        activeTheme === "dark" ? "rgba(126,34,206,0.16)" : "rgba(129,140,248,0.14)"
      );
      rightGlow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);
    };

    const draw = (now) => {
      if (!running) return;

      if (!reducedMotion && now - lastFrame < 24) {
        raf = window.requestAnimationFrame(draw);
        return;
      }

      lastFrame = now;

      const activeTheme = themeRef.current;
      const palette = palettes[activeTheme];
      const time = now * 0.001;

      pointerRef.current.sx += (pointerRef.current.x - pointerRef.current.sx) * 0.04;
      pointerRef.current.sy += (pointerRef.current.y - pointerRef.current.sy) * 0.04;

      const px = pointerRef.current.sx;
      const py = pointerRef.current.sy;

      ctx.clearRect(0, 0, width, height);
      drawBackground(palette, activeTheme);

      ctx.save();
      ctx.globalCompositeOperation = activeTheme === "dark" ? "lighter" : "source-over";

      const rowCount = 16;

      for (let r = 0; r < rowCount; r += 1) {
        const v = r / (rowCount - 1);
        const major = r % 4 === 0;
        const pts = makeRow(v, time, px, py, 96);
        const fade = 0.18 + Math.pow(v, 1.15) * 0.56;

        strokeSmooth(
          pts,
          major ? palette.gridMajor : palette.gridMinor,
          major ? 1.0 : 0.52,
          (activeTheme === "light" ? 0.18 : 0.23) * fade,
          0
        );
      }

      const colCount = 14;

      for (let c = 0; c < colCount; c += 1) {
        const u = -1.18 + (c / (colCount - 1)) * 2.36;
        const major = c % 4 === 0;
        const pts = makeColumn(u, time, px, py, 32);

        strokeSmooth(
          pts,
          major ? palette.gridMajor : palette.vertical,
          major ? 0.68 : 0.38,
          activeTheme === "light" ? (major ? 0.13 : 0.08) : (major ? 0.15 : 0.1),
          0
        );
      }

      const ribbonDepths = [0.20, 0.32, 0.46, 0.62, 0.76];

      ribbonDepths.forEach((v, index) => {
        const pts = makeRow(v, time * 1.25 + index * 0.45, px, py, 110);
        const offset = (index - 1) * 4;

        pts.forEach((p, i) => {
          p.y -= 22 + index * 13 + Math.sin(i * 0.045 + time * 1.45 + index) * 6 + offset;
        });

        strokeSmooth(
          pts,
          index % 2 === 0 ? palette.ribbonA : palette.ribbonB,
          activeTheme === "light" ? 1.45 : 1.2,
          activeTheme === "light" ? 0.3 - index * 0.035 : 0.36 - index * 0.045,
          activeTheme === "light" ? 0 : 3
        );
      });

      ctx.restore();

      // Subtle flying specks. Slightly stronger in both themes without increasing size.
      ctx.save();
      ctx.globalCompositeOperation = activeTheme === "dark" ? "lighter" : "source-over";
      ctx.fillStyle = palette.particles;
      ctx.shadowBlur = 0;

      for (let i = 0; i < 28; i += 1) {
        const v = (i * 0.137 + time * 0.032) % 1;
        const lane = (i % 8) / 7;
        const u = -0.92 + lane * 1.84 + Math.sin(i * 2.1 + time * 0.35) * 0.035;
        const p = project(u, v, time, px, py);
        const pulse = 0.55 + Math.sin(time * 2.2 + i * 0.7) * 0.18;

        const edgeFade = Math.min(1, v * 7, (1 - v) * 7);

        ctx.globalAlpha =
          activeTheme === "light"
            ? (0.42 + pulse * 0.18) * edgeFade
            : (0.26 + pulse * 0.14) * edgeFade;

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          activeTheme === "light" ? 0.65 + p.depth * 0.65 : 0.7 + p.depth * 0.85,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();

      const remaining = [];

      for (const pulse of pulsesRef.current) {
        const age = (now - pulse.born) / 1000;
        if (age > 0.85) continue;

        remaining.push(pulse);

        const t = age / 0.85;
        const ease = 1 - Math.pow(1 - t, 3);
        const alpha = (1 - ease) * (activeTheme === "light" ? 0.22 : 0.28);

        ctx.save();
        ctx.globalCompositeOperation = activeTheme === "dark" ? "lighter" : "source-over";
        ctx.strokeStyle = `${palette.ripple} ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.shadowBlur = activeTheme === "light" ? 0 : 5;
        ctx.shadowColor = `${palette.ripple} ${alpha})`;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, 16 + ease * 68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      pulsesRef.current = remaining;

      const veil = ctx.createLinearGradient(0, 0, 0, height);

      if (activeTheme === "light") {
        veil.addColorStop(0, "rgba(255,255,255,0.18)");
        veil.addColorStop(0.36, "rgba(255,255,255,0.05)");
        veil.addColorStop(1, "rgba(255,255,255,0.00)");
      } else {
        veil.addColorStop(0, "rgba(2,6,23,0.42)");
        veil.addColorStop(0.42, "rgba(2,6,23,0.07)");
        veil.addColorStop(1, "rgba(2,6,23,0.12)");
      }

      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);

      if (reducedMotion) {
        timeout = window.setTimeout(() => draw(performance.now()), 180);
      } else {
        raf = window.requestAnimationFrame(draw);
      }
    };

    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });

    raf = window.requestAnimationFrame(draw);

    return () => {
      running = false;

      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);

      if (raf) window.cancelAnimationFrame(raf);
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  const safeTheme = theme === "light" ? "light" : "dark";

  return (
    <div
      className={`wave-grid-background professional-wave-background professional-wave-background--${safeTheme}`}
      aria-hidden="true"
      data-theme={safeTheme}
    >
      <style>{`
        .professional-wave-background {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100svh !important;
          z-index: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
          isolation: isolate !important;
          background: transparent !important;
          contain: strict !important;
        }

        .professional-wave-background__canvas {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          opacity: 1 !important;
          z-index: 1 !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
        }

        .professional-wave-background::after {
          content: "" !important;
          position: absolute !important;
          inset: 0 !important;
          pointer-events: none !important;
          z-index: 2 !important;
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.04), transparent 22%, transparent 78%, rgba(255,255,255,0.02)),
            radial-gradient(ellipse at 50% 34%, transparent 0%, rgba(0,0,0,0.02) 100%) !important;
        }

        .professional-wave-background--dark::after {
          background:
            linear-gradient(to bottom, rgba(2,6,23,0.26), transparent 26%, transparent 78%, rgba(2,6,23,0.18)),
            radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(2,6,23,0.12) 100%) !important;
        }
      `}</style>

      <canvas ref={canvasRef} className="professional-wave-background__canvas" />
    </div>
  );
}

export default memo(HighEnd3DBackground);