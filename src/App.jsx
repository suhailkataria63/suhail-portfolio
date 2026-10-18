import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import WelcomeIntro from "@/components/WelcomeIntro";
import HighEnd3DBackground from "@/components/HighEnd3DBackground";

import { projects } from "@/data/portfolio";
import { cx } from "@/sections/shared";
import HeroSection from "@/sections/HeroSection";
import ProjectsSection from "@/sections/ProjectsSection";
import SkillsSection from "@/sections/SkillsSection";
import EducationSection from "@/sections/EducationSection";
import ExperienceSection from "@/sections/ExperienceSection";
import ContactSection from "@/sections/ContactSection";

const themeStyles = {
  dark: {
    main: "portfolio-dark theme-dark",
    progress: "bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400",
    nav: "border-white/10 bg-slate-900/72 shadow-2xl shadow-black/40",
    brand: "text-white",
    navLinks: "text-slate-200",
    navHover: "hover:text-cyan-300",
    toggle: "border-white/12 bg-white/10 text-white shadow-sm shadow-black/30 hover:bg-white/15",
    eyebrow: "text-cyan-300",
    sectionTitle: "text-white",
    sectionText: "text-slate-300",
    heroBadge: "border-cyan-300/35 bg-cyan-300/12 text-cyan-100 shadow-lg shadow-cyan-950/25",
    heroTitle: "text-white",
    heroGradient: "from-cyan-300 via-violet-300 to-fuchsia-300",
    bodyText: "text-slate-300",
    primaryButton: "primary-btn view-projects-btn shadow-lg shadow-cyan-500/20 hover:opacity-95",
    outlineButton: "secondary-btn resume-btn shadow-sm shadow-black/25 hover:opacity-95",
    orbOne: "bg-cyan-500/18",
    orbTwo: "bg-fuchsia-500/18",
    heroGlow: "from-cyan-400/28 via-violet-500/22 to-fuchsia-500/28",
    glassCard: "portfolio-card-dark border-cyan-200/18 bg-gradient-to-br from-slate-700/45 via-indigo-950/42 to-fuchsia-950/36 shadow-2xl shadow-violet-950/50 backdrop-blur-2xl",
    projectCard: "portfolio-card-dark border-cyan-200/14 bg-gradient-to-br from-slate-800/52 via-indigo-950/44 to-fuchsia-950/32 shadow-xl shadow-violet-950/35 backdrop-blur-2xl hover:border-cyan-300/45 hover:shadow-cyan-950/35",
    iconBox: "bg-cyan-300/15 text-cyan-200",
    externalIcon: "text-slate-400 group-hover:text-cyan-300",
    projectType: "text-cyan-300",
    cardTitle: "text-white",
    tag: "border border-white/10 bg-white/9 text-slate-200 shadow-sm shadow-black/20",
    statCard: "border-white/8 bg-gradient-to-r from-slate-700/58 via-violet-950/42 to-fuchsia-950/36 text-slate-100 shadow-sm shadow-black/25 backdrop-blur-xl",
    filterActive: "border-cyan-300 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20",
    filterIdle: "border-white/10 bg-white/6 text-slate-300 hover:bg-white/12",
    githubButton: "secondary-btn border-white/12 hover:opacity-95",
    liveButton: "primary-btn shadow-lg shadow-cyan-500/20 hover:opacity-95",
    skillCard: "portfolio-card-dark border-cyan-200/14 bg-gradient-to-br from-slate-800/52 via-indigo-950/42 to-cyan-950/30 shadow-xl shadow-cyan-950/30 backdrop-blur-2xl",
    skillIcon: "text-cyan-300",
    skillTag: "border-white/10 bg-white/7 text-slate-300 shadow-sm shadow-black/20",
    experienceCard: "portfolio-card-dark border-cyan-200/14 bg-gradient-to-br from-slate-800/50 via-indigo-950/38 to-fuchsia-950/28 shadow-xl shadow-violet-950/30 backdrop-blur-2xl",
    periodPill: "bg-white/10 text-slate-200 ring-1 ring-white/10",
    contactBox: "portfolio-card-dark border-cyan-200/18 bg-gradient-to-br from-cyan-400/14 via-violet-500/18 to-fuchsia-500/16 shadow-2xl shadow-fuchsia-950/35 backdrop-blur-2xl",
    contactPrimary: "primary-btn hover:opacity-95",
  },
  light: {
    main: "portfolio-light theme-light",
    progress: "bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900",
    nav: "border-white/75 bg-white/72 shadow-xl shadow-slate-300/35",
    brand: "text-slate-950",
    navLinks: "text-slate-700",
    navHover: "hover:text-blue-700",
    toggle: "border-slate-200/80 bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    eyebrow: "text-blue-800",
    sectionTitle: "text-slate-950",
    sectionText: "text-slate-700",
    heroBadge: "border-blue-300/70 bg-white/82 text-slate-900 shadow-sm shadow-blue-100/90",
    heroTitle: "text-slate-950",
    heroGradient: "from-blue-700 via-indigo-600 to-violet-700",
    bodyText: "text-slate-700",
    primaryButton: "primary-btn view-projects-btn shadow-lg shadow-blue-300/50 hover:opacity-95",
    outlineButton: "secondary-btn resume-btn shadow-sm hover:opacity-95",
    orbOne: "bg-sky-300/30",
    orbTwo: "bg-indigo-300/28",
    heroGlow: "from-sky-300/35 via-blue-300/25 to-indigo-400/32",
    glassCard: "portfolio-card-light border-white/90 bg-gradient-to-br from-white/88 via-sky-50/78 to-indigo-100/70 shadow-2xl shadow-blue-300/30 backdrop-blur-2xl",
    projectCard: "portfolio-card-light border-white/90 bg-gradient-to-br from-white/88 via-sky-50/76 to-indigo-100/62 shadow-xl shadow-blue-300/22 backdrop-blur-2xl hover:border-blue-300 hover:shadow-blue-300/35",
    iconBox: "bg-blue-100/90 text-blue-800",
    externalIcon: "text-slate-500 group-hover:text-blue-700",
    projectType: "text-blue-700",
    cardTitle: "text-slate-950",
    tag: "border border-white/90 bg-gradient-to-r from-white/92 to-sky-50/82 text-slate-700 shadow-sm shadow-blue-100/70",
    statCard: "border-white/90 bg-gradient-to-r from-white/95 via-sky-50/88 to-indigo-100/74 text-slate-950 shadow-sm shadow-blue-200/65 backdrop-blur-xl",
    filterActive: "border-slate-950 bg-slate-950 text-white shadow-md shadow-slate-300/50",
    filterIdle: "border-white/85 bg-white/70 text-slate-700 shadow-sm hover:bg-white hover:text-slate-950",
    githubButton: "secondary-btn border-slate-300/80 shadow-sm hover:opacity-95",
    liveButton: "primary-btn shadow-md shadow-blue-200/80 hover:opacity-95",
    skillCard: "portfolio-card-light border-white/90 bg-gradient-to-br from-white/90 via-sky-50/74 to-indigo-100/60 shadow-xl shadow-blue-300/22 backdrop-blur-2xl",
    skillIcon: "text-blue-700",
    skillTag: "border-white/85 bg-white/74 text-slate-700 shadow-sm",
    experienceCard: "portfolio-card-light border-white/90 bg-gradient-to-br from-white/90 via-sky-50/72 to-indigo-100/58 shadow-xl shadow-blue-300/22 backdrop-blur-2xl",
    periodPill: "bg-slate-950 text-white shadow-sm shadow-slate-300/50",
    contactBox: "portfolio-card-light border-white/90 bg-gradient-to-br from-white/90 via-sky-50/78 to-indigo-100/62 shadow-2xl shadow-blue-300/28 backdrop-blur-2xl",
    contactPrimary: "primary-btn hover:opacity-95",
  },
};

export default function SuhailPortfolio() {
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.001 });
  const [filter, setFilter] = useState("All");
  const [themeMode, setThemeMode] = useState("dark");
  const isLight = themeMode === "light";
  const isDarkMode = themeMode === "dark";
  const theme = isLight ? themeStyles.light : themeStyles.dark;

  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = isDarkMode ? "dark" : "light";

    root.classList.toggle("dark", isDarkMode);
    root.dataset.theme = activeTheme;
    document.body.dataset.theme = activeTheme;
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const filteredProjects = projects.filter((project) => {
    if (filter === "All") return true;
    const text = `${project.title} ${project.type} ${project.stack.join(" ")}`.toLowerCase();
    return text.includes(filter.toLowerCase()) || (filter === "Data" && text.includes("forecast"));
  });

  return (
    <AnimatePresence mode="wait">
      {!introDone ? (
        <WelcomeIntro key="welcome-intro" onFinish={finishIntro} />
      ) : (
        <motion.main
          key="portfolio-dashboard"
          className={cx("portfolio-app relative min-h-screen overflow-x-hidden transition-colors duration-500", theme.main)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <HighEnd3DBackground theme={isDarkMode ? "dark" : "light"} />
      <motion.div
        style={{ scaleX, transformOrigin: "0% 50%" }}
        className={cx("portfolio-scroll-progress", theme.progress)}
      />

      <nav className={cx("portfolio-nav flex items-center justify-between rounded-full border px-5 py-3 backdrop-blur-2xl", theme.nav)}>
        <a href="#home" className={cx("font-semibold tracking-wide", theme.brand)}>
          <span className="hidden sm:inline">Suhail.dev</span>
          <span className="sm:hidden">SK</span>
        </a>
        <div className={cx("flex items-center gap-2 text-[11px] sm:gap-4 sm:text-sm md:gap-6", theme.navLinks)}>
          <a href="#projects" className={theme.navHover}>Projects</a>
          <a href="#skills" className={theme.navHover}>Skills</a>
          <a href="#education" className={theme.navHover}>Education</a>
          <a href="#experience" className={theme.navHover}>Experience</a>
          <a href="#contact" className={theme.navHover}>Contact</a>
          <button
            type="button"
            onClick={() => setThemeMode(isLight ? "dark" : "light")}
            className={cx("rounded-full border px-4 py-2 text-xs font-semibold transition", theme.toggle)}
            aria-label="Toggle light and dark theme"
          >
            {isLight ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </nav>

      <HeroSection theme={theme} isLight={isLight} />

      <ProjectsSection theme={theme} filter={filter} setFilter={setFilter} filteredProjects={filteredProjects} />

      <SkillsSection theme={theme} />

            <EducationSection theme={theme} />

      <ExperienceSection theme={theme} />

      <ContactSection theme={theme} />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
