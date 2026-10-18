import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { profile, highlights } from "@/data/portfolio";
import { cx } from "./shared";

function FloatingOrb({ className }) {
  return <motion.div animate={{ y: [0, -22, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className={className} />;
}

export default function HeroSection({ theme, isLight }) {
  return (
    <section id="home" className="relative flex min-h-screen items-center px-6 py-24 md:px-10">
        <FloatingOrb className={cx("absolute left-[-80px] top-32 h-64 w-64 rounded-full blur-3xl", theme.orbOne)} />
        <FloatingOrb className={cx("absolute bottom-20 right-[-120px] h-80 w-80 rounded-full blur-3xl", theme.orbTwo)} />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className={cx("mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", theme.heroBadge)}>
              <Sparkles className="h-4 w-4" /> Available for AI/ML, full-stack, and backend roles
            </div>
            <h1 className={cx("max-w-4xl text-5xl font-black leading-tight md:text-7xl", theme.heroTitle)}>
              Building intelligent products with <span className={cx("bg-gradient-to-r bg-clip-text text-transparent", theme.heroGradient)}>AI + software engineering</span>.
            </h1>
            <p className={cx("mt-6 max-w-2xl text-lg leading-8", theme.bodyText)}>{profile.summary}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild className={cx("rounded-full px-6 py-6", theme.primaryButton)}>
                <a href="#projects">View Projects <ArrowUpRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline" className={cx("rounded-full px-6 py-6", theme.outlineButton)}>
                <a href={profile.resume} download="Suhail_Kataria_Resume.pdf">
                  <Download className="mr-2 h-4 w-4" /> Resume
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="relative">
            <div className={cx("absolute inset-0 rounded-[2rem] bg-gradient-to-br blur-2xl", theme.heroGlow)} />
            <Card className={cx("profile-card glass-card relative overflow-hidden rounded-[2rem] border", theme.glassCard)}>
              <CardContent className="p-7">
                <div className="mb-7 flex items-center gap-4">
                  <div
                    className={cx(
                      "grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border",
                      isLight
                        ? "border-slate-200/80 bg-slate-950 shadow-lg shadow-blue-200/60"
                        : "border-white/10 bg-black/90 shadow-lg shadow-cyan-500/15"
                    )}
                  >
                    <img
                      src="/icons.svg"
                      alt="Suhail Kataria logo"
                      className="h-full w-full object-cover"
                      draggable="false"
                    />
                  </div>
                  <div>
                    <h3 className={cx("text-2xl font-bold", theme.cardTitle)}>{profile.name}</h3>
                    <p className={cx("text-sm", theme.bodyText)}>{profile.title}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {highlights.map((item) => (
                    <motion.div whileHover={{ x: 8 }} key={item} className={cx("glass-card rounded-2xl border p-4 font-semibold", theme.statCard)}>{item}</motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
  );
}
