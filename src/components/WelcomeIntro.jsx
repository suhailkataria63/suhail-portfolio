import React, { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, Code2, Database, Sparkles } from "lucide-react";

export default function WelcomeIntro({ onFinish }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const duration = prefersReducedMotion ? 900 : 3900;
    const timer = window.setTimeout(onFinish, duration);
    return () => window.clearTimeout(timer);
  }, [onFinish, prefersReducedMotion]);

  const skills = ["AI", "Full-Stack", "Data", "APIs"];

  return (
    <motion.section
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      aria-label="Welcome intro"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.25),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#020617_100%)]" />

      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute h-[34rem] w-[34rem] rounded-full border border-blue-400/20"
            initial={{ scale: 0.45, opacity: 0 }}
            animate={{ scale: [0.45, 1, 1.12], opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute h-[22rem] w-[22rem] rounded-full border border-cyan-300/20"
            initial={{ scale: 0.35, opacity: 0 }}
            animate={{ scale: [0.35, 1.1, 1.25], opacity: [0, 0.7, 0] }}
            transition={{ duration: 2.8, delay: 0.45, repeat: Infinity, ease: "easeOut" }}
          />
        </>
      )}

      <motion.div
        className="relative z-10 mx-6 flex max-w-4xl flex-col items-center text-center"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-2xl shadow-blue-500/20 backdrop-blur-xl"
          animate={prefersReducedMotion ? undefined : { y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-9 w-9 text-cyan-200" />
        </motion.div>

        <motion.p
          className="mb-4 text-xs font-semibold uppercase tracking-[0.55em] text-cyan-200/90"
          initial={{ opacity: 0, letterSpacing: "0.25em" }}
          animate={{ opacity: 1, letterSpacing: "0.55em" }}
          transition={{ delay: 0.35, duration: 0.8 }}
        >
          Welcome to
        </motion.p>

        <motion.h1
          className="bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-7xl md:text-8xl"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.8, ease: "easeOut" }}
        >
          Suhail.dev
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7 }}
        >
          AI-powered products, full-stack systems, and data-driven experiences.
        </motion.p>

        <motion.div
          className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { delayChildren: 1.25, staggerChildren: 0.12 } },
          }}
        >
          {skills.map((skill) => (
            <motion.span
              key={skill}
              className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xl"
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {skill}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 h-1.5 w-64 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.85, duration: prefersReducedMotion ? 0.3 : 1.55, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-4 text-slate-400/70">
        {[Brain, Code2, Database].map((Icon, index) => (
          <motion.div
            key={index}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + index * 0.15 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
