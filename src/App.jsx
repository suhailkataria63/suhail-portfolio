import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Mail, ExternalLink, ArrowUpRight, Sparkles, Brain, Server, BarChart3, ShieldCheck, Code2, Database, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import WelcomeIntro from "@/components/WelcomeIntro";

const profile = {
  name: "Suhail Kataria",
  title: "AI & Data Science Student • Full-Stack AI Builder",
  email: "suhail.kataria63@gmail.com",
  phone: "6280208838",
  github: "https://github.com/suhailkataria63",
  linkedin: "https://linkedin.com/in/suhail-kataria63",
  resume: "/Suhail_1P.pdf",
  summary:
    "I build AI-powered web applications, LLM-integrated workflows, predictive models, REST APIs, dashboards, and scalable full-stack products using Python, FastAPI, Next.js, React, TypeScript, Golang, SQL, and modern deployment tools.",
};

const projects = [
  {
    title: "InternAI Resume Analyzer",
    type: "AI Matching Workflow",
    description:
  "Full-stack AI internship assistant that analyzes resumes against job descriptions, extracts skills, calculates match scores, identifies skill gaps, generates application answers and cover letters, and tracks saved applications.",
stack: [
  "Python","FastAPI","Next.js","Tailwind CSS","SQLite","REST APIs","Gemini API","LLM Fallbacks","Vercel"],
    icon: Brain,
    github: "https://github.com/suhailkataria63/InternAI",
    live: "https://intern-ai-seven.vercel.app"
  },
  {
    title: "Hybrid Phishing Detection System",
    type: "AI Security Platform",
    description:
      "AI-powered phishing detection for URLs, emails, and domains with 94% classification accuracy, FastAPI backend, and responsive Next.js frontend.",
    stack: ["Python", "Scikit-learn", "FastAPI", "Next.js", "TypeScript", "Tailwind", "Vercel"],
    icon: ShieldCheck,
    github: "https://github.com/suhailkataria63/Phishing-Detection-with-Hybrid-AI-models",
    live: "https://phishing-detection-with-hybrid-ai-m.vercel.app"
  },
  {
    title: "Smart Leads Dashboard",
    type: "Full-Stack SaaS Dashboard",
    description:
      "Full-stack lead management dashboard with authentication, RBAC, CRUD operations, search, filtering, pagination, CSV export, and a responsive analytics-focused UI.",
    stack: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "JWT", "Render"],
    icon: Server,
    github: "https://github.com/suhailkataria63",
    live: "https://smart-leads-dash.vercel.app/login"
  },
  {
    title: "EduPro Demand Forecasting",
    type: "Time-Series Forecasting App",
    description:
      "Forecasting web app for educational service demand and revenue trends, achieving 9% MAPE with an interactive Streamlit dashboard.",
    stack: ["Python", "Pandas", "NumPy", "Scikit-learn", "Streamlit", "Data Viz"],
    icon: BarChart3,
    github: "https://github.com/suhailkataria63/edupro-demand-forecasting",
    live: "https://edupro-demand-forecasting-islizsqc8jg3lio4eewbaq.streamlit.app"
  },
  {
    title: "SocialMedia Intel Sentiment Platform",
    type: "Deep Learning NLP Platform",
    description:
      "End-to-end sentiment analysis platform using Spark, Parquet, GRU deep learning, FastAPI inference, and R Shiny analytics dashboard.",
    stack: ["Python", "Spark", "TensorFlow", "Keras", "GRU", "FastAPI", "R Shiny"],
    icon: Brain,
    github: "https://github.com/suhailkataria63/sentiment-analysis-using-deep-learning",
    live: ""
  },
  {
    title: "Golang Backend Authentication API",
    type: "Secure Backend API",
    description:
      "Golang authentication service with signup, login, bcrypt hashing, JWT middleware, RBAC, SQLite storage, and clean API documentation.",
    stack: ["Golang", "SQLite", "JWT", "bcrypt", "REST APIs", "Middleware"],
    icon: Code2,
    github: "https://github.com/suhailkataria63/reducate_task_assignment",
    live: ""
  },
];

const skills = [
  "Python", "Golang", "SQL", "JavaScript", "TypeScript", "React.js", "Next.js", "Tailwind CSS", "FastAPI", "Node.js", "Express.js", "MongoDB", "SQLite", "JWT", "RBAC", "Pandas", "NumPy", "Scikit-learn", "TensorFlow/Keras", "Streamlit", "Hugging Face", "Vercel", "GitHub"
];

const education = [
  {
    degree: "B.Tech in Artificial Intelligence & Data Science",
    institute: "Chandigarh Group of Colleges, Landran",
    university: "IKGPTU",
    period: "2024 – 2027",
    points: [
      "Currently in 4th Year, 7th Semester.",
      "Focused on machine learning, data science, web development, backend APIs, and AI-powered applications.",
      "Built practical projects in RAG, phishing detection, forecasting, full-stack dashboards, and backend authentication systems.",
    ],
  },
  {
    degree: "Diploma in Computer Science & Engineering",
    institute: "Mehr Chand Polytechnic College, Jalandhar",
    university: "PSBTE",
    period: "2021 – 2024",
    points: [
      "Completed diploma with a focus on computer fundamentals and programming.",
      "Developed strong foundational skills in software development and problem-solving.",
    ],
  },
  {
  degree: "Matriculation (10th Standard)",
  institute: "Jawahar Navodaya Vidyalaya",
  university: "CBSE",
  period: "2021",
  points: [
    "Completed secondary education under the CBSE curriculum.",
    "Built a strong academic foundation in mathematics, science, and computer fundamentals.",
    ],
  }
];

const experience = [
  {
    role: "Artificial Intelligence Intern",
    company: "Unified Mentor Pvt. Ltd.",
    period: "Feb 2026 – May 2026",
    points: ["Built AI/ML projects using real-world datasets.", "Worked on restaurant growth prediction and demand forecasting.", "Created dashboards for business insights."],
  },
  {
    role: "Data Science Trainee",
    company: "ThinkNEXT Technologies Pvt. Ltd.",
    period: "Jun 2025 – Jul 2025",
    points: ["Completed industrial training in data analysis and ML.", "Built regression models with preprocessing and evaluation."],
  },
  {
    role: "Python Trainee",
    company: "O7 Services, Jalandhar",
    period: "Jul 2023 – Aug 2023",
    points: ["Completed Python training focused on core concepts and mini projects.", "Practiced data handling, logic building, and project workflows."],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const themeStyles = {
  dark: {
    main: "bg-[#050816] text-slate-100",
    progress: "bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400",
    nav: "border-white/10 bg-white/8",
    brand: "text-white",
    navLinks: "text-slate-300",
    navHover: "hover:text-cyan-300",
    toggle: "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
    eyebrow: "text-cyan-300",
    sectionTitle: "text-white",
    sectionText: "text-slate-300",
    heroBadge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    heroTitle: "text-white",
    heroGradient: "from-cyan-300 via-violet-300 to-fuchsia-300",
    bodyText: "text-slate-300",
    primaryButton: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    outlineButton: "border-white/15 bg-white/5 text-white hover:bg-white/10",
    orbOne: "bg-cyan-500/20",
    orbTwo: "bg-violet-500/20",
    heroGlow: "from-cyan-400/30 to-fuchsia-500/30",
    glassCard: "border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl",
    projectCard: "border-white/10 bg-white/[0.07] backdrop-blur-xl hover:border-cyan-300/40 hover:bg-white/[0.1]",
    iconBox: "bg-cyan-300/15 text-cyan-200",
    externalIcon: "text-slate-400 group-hover:text-cyan-300",
    projectType: "text-cyan-300",
    cardTitle: "text-white",
    tag: "bg-white/8 text-slate-300",
    statCard: "border-white/10 bg-black/20 text-slate-200",
    filterActive: "border-cyan-300 bg-cyan-300 text-slate-950",
    filterIdle: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
    githubButton: "border-white/10 bg-white/5 text-white hover:bg-white/10",
    liveButton: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    skillCard: "border-white/10 bg-white/[0.07]",
    skillIcon: "text-cyan-300",
    skillTag: "border-white/10 bg-white/5 text-slate-300",
    experienceCard: "border-white/10 bg-white/[0.07]",
    periodPill: "bg-white/10 text-slate-300",
    contactBox: "border-white/10 bg-gradient-to-br from-cyan-400/15 via-violet-400/15 to-fuchsia-400/15",
    contactPrimary: "bg-white text-slate-950 hover:bg-slate-200",
  },
  light: {
    main: "bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_30%),radial-gradient(circle_at_top_right,#e0e7ff_0%,transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef4ff_45%,#f8fafc_100%)] text-slate-950",
    progress: "bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900",
    nav: "border-white/70 bg-white/65 shadow-xl shadow-slate-300/40",
    brand: "text-slate-950",
    navLinks: "text-slate-700",
    navHover: "hover:text-blue-700",
    toggle: "border-slate-200/80 bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    eyebrow: "text-blue-700",
    sectionTitle: "text-slate-950",
    sectionText: "text-slate-700",
    heroBadge: "border-blue-300/60 bg-white/80 text-slate-900 shadow-sm shadow-blue-100/80",
    heroTitle: "text-slate-950",
    heroGradient: "from-blue-800 via-indigo-700 to-slate-950",
    bodyText: "text-slate-700",
    primaryButton: "bg-slate-950 text-white shadow-lg shadow-slate-300/50 hover:bg-slate-800",
    outlineButton: "border-slate-300/80 bg-white/70 text-slate-950 shadow-sm hover:bg-white",
    orbOne: "bg-blue-400/25",
    orbTwo: "bg-indigo-400/25",
    heroGlow: "from-blue-300/35 to-indigo-400/35",
    glassCard: "border-white/80 bg-white/70 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl",
    projectCard: "border-white/80 bg-white/68 shadow-xl shadow-slate-300/35 backdrop-blur-2xl hover:border-blue-300 hover:bg-white/82",
    iconBox: "bg-blue-100/90 text-blue-800",
    externalIcon: "text-slate-500 group-hover:text-blue-700",
    projectType: "text-blue-700",
    cardTitle: "text-slate-950",
    tag: "border border-white/80 bg-white/75 text-slate-700",
    statCard: "border-white/80 bg-white/78 text-slate-900 shadow-sm shadow-slate-200/70",
    filterActive: "border-slate-950 bg-slate-950 text-white shadow-md shadow-slate-300/50",
    filterIdle: "border-white/80 bg-white/65 text-slate-700 shadow-sm hover:bg-white hover:text-slate-950",
    githubButton: "border-slate-300/80 bg-white/72 text-slate-900 shadow-sm hover:bg-white",
    liveButton: "bg-blue-700 text-white shadow-md shadow-blue-200/80 hover:bg-blue-800",
    skillCard: "border-white/80 bg-white/70 shadow-xl shadow-slate-300/35 backdrop-blur-2xl",
    skillIcon: "text-blue-700",
    skillTag: "border-white/80 bg-white/70 text-slate-700 shadow-sm",
    experienceCard: "border-white/80 bg-white/70 shadow-xl shadow-slate-300/35 backdrop-blur-2xl",
    periodPill: "bg-slate-950 text-white",
    contactBox: "border-white/80 bg-white/70 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl",
    contactPrimary: "bg-slate-950 text-white hover:bg-slate-800",
  },
};

function SectionTitle({ eyebrow, title, text, theme }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mx-auto mb-12 max-w-3xl text-center">
      <p className={cx("mb-3 text-sm font-semibold uppercase tracking-[0.35em]", theme.eyebrow)}>{eyebrow}</p>
      <h2 className={cx("text-3xl font-bold md:text-5xl", theme.sectionTitle)}>{title}</h2>
      {text && <p className={cx("mt-4 text-base leading-7 md:text-lg", theme.sectionText)}>{text}</p>}
    </motion.div>
  );
}

function FloatingOrb({ className }) {
  return <motion.div animate={{ y: [0, -22, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className={className} />;
}

export default function SuhailPortfolio() {
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.001 });
  const [filter, setFilter] = useState("All");
  const [themeMode, setThemeMode] = useState("dark");
  const isLight = themeMode === "light";
  const theme = isLight ? themeStyles.light : themeStyles.dark;

  const categories = useMemo(() => ["All", "AI", "Full-Stack", "Backend", "Data"], []);
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
          className={cx("min-h-screen overflow-hidden transition-colors duration-500", theme.main)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
      <motion.div style={{ scaleX }} className={cx("fixed left-0 top-0 z-50 h-1 w-full origin-left", theme.progress)} />

      <nav className={cx("fixed left-1/2 top-5 z-40 flex w-[92%] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border px-5 py-3 backdrop-blur-2xl", theme.nav)}>
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
                <a href={profile.resume} download="Suhail_1P.pdf">
                  <Download className="mr-2 h-4 w-4" /> Resume
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="relative">
            <div className={cx("absolute inset-0 rounded-[2rem] bg-gradient-to-br blur-2xl", theme.heroGlow)} />
            <Card className={cx("relative overflow-hidden rounded-[2rem] border", theme.glassCard)}>
              <CardContent className="p-7">
                <div className="mb-7 flex items-center gap-4">
                  <div className={cx("grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-black", isLight ? "from-blue-200 to-indigo-300 text-slate-950 shadow-lg shadow-blue-200/70" : "from-cyan-300 to-violet-400 text-slate-950")}>SK</div>
                  <div>
                    <h3 className={cx("text-2xl font-bold", theme.cardTitle)}>{profile.name}</h3>
                    <p className={cx("text-sm", theme.bodyText)}>{profile.title}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {["94% phishing model accuracy", "9% MAPE demand forecasting", "Full-stack AI apps", "JWT + RBAC backend systems"].map((item) => (
                    <motion.div whileHover={{ x: 8 }} key={item} className={cx("rounded-2xl border p-4 font-semibold", theme.statCard)}>{item}</motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="projects" className="px-6 py-24 md:px-10">
        <SectionTitle theme={theme} eyebrow="Selected Work" title="Project case studies" text="Selected projects showing outcomes, architecture, stack choices, and real world value - not just repository links." />

        <div className="mx-auto mb-8 flex max-w-6xl flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={cx("rounded-full border px-4 py-2 text-sm font-medium transition", filter === cat ? theme.filterActive : theme.filterIdle)}>
              {cat}
            </button>
          ))}
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project, index) => {
            const Icon = project.icon;

            return (
              <motion.div
                key={project.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -10, rotateX: 2 }}
                className="group block"
              >
                <Card className={cx("h-full overflow-hidden rounded-[1.75rem] border transition", theme.projectCard)}>
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div className={cx("grid h-12 w-12 place-items-center rounded-2xl", theme.iconBox)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <ExternalLink className={cx("h-5 w-5 transition", theme.externalIcon)} />
                    </div>

                    <p className={cx("text-sm font-semibold", theme.projectType)}>{project.type}</p>
                    <h3 className={cx("mt-2 text-xl font-bold", theme.cardTitle)}>{project.title}</h3>
                    <p className={cx("mt-3 flex-1 text-sm leading-6", theme.bodyText)}>{project.description}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.stack.map((tech) => (
                        <span key={tech} className={cx("rounded-full px-3 py-1 text-xs", theme.tag)}>
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href={project.github} target="_blank" rel="noreferrer" className={cx("inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium", theme.githubButton)}>
                        <FaGithub className="mr-2 h-4 w-4" /> GitHub
                      </a>

                      {project.live && (
                        <a href={project.live} target="_blank" rel="noreferrer" className={cx("inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold", theme.liveButton)}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="skills" className="px-6 py-24 md:px-10">
        <SectionTitle theme={theme} eyebrow="Capabilities" title="AI, Backend, Frontend, and Analytics." />
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[{ title: "AI / ML", icon: Brain, text: "Predictive modeling, NLP, classification, regression, time-series forecasting, model evaluation." }, { title: "Full Stack", icon: Code2, text: "React, Next.js, Tailwind, FastAPI, REST APIs, dashboards, deployment workflows." }, { title: "Data + Backend", icon: Database, text: "SQL, SQLite, MongoDB, JWT auth, RBAC, API integration, EDA, visualization." }].map((area) => {
            const Icon = area.icon;
            return (
              <motion.div key={area.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className={cx("h-full min-h-[260px] rounded-[1.75rem] border", theme.skillCard)}>
                  <CardContent className="flex h-full flex-col justify-center p-8">
                    <Icon className={cx("mb-5 h-8 w-8", theme.skillIcon)} />
                    <h3 className={cx("text-xl font-bold", theme.cardTitle)}>{area.title}</h3>
                    <p className={cx("mt-3 text-sm leading-6", theme.bodyText)}>{area.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-center gap-3">
          {skills.map((skill) => <motion.span whileHover={{ y: -4 }} key={skill} className={cx("rounded-full border px-4 py-2 text-sm", theme.skillTag)}>{skill}</motion.span>)}
        </div>
      </section>

            <section id="education" className="px-6 py-24 md:px-10">
        <SectionTitle
          theme={theme}
          eyebrow="Education"
          title="Academic background"
          text="A foundation in AI, data science, software development, and applied problem solving."
        />

        <div className="mx-auto max-w-4xl space-y-5">
          {education.map((item) => (
            <motion.div
              key={item.degree}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={cx("rounded-[1.5rem] border p-6", theme.experienceCard)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className={cx("text-xl font-bold", theme.cardTitle)}>{item.degree}</h3>
                  <p className={theme.projectType}>{item.institute}</p>
                  <p className={cx("mt-1 text-sm", theme.bodyText)}>{item.university}</p>
                </div>
                <span className={cx("rounded-full px-3 py-1 text-sm", theme.periodPill)}>
                  {item.period}
                </span>
              </div>

              <ul className={cx("mt-4 space-y-2 text-sm leading-6", theme.bodyText)}>
                {item.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="experience" className="px-6 py-24 md:px-10">
        <SectionTitle theme={theme} eyebrow="Experience" title="Training and Practical execution" />
        <div className="mx-auto max-w-4xl space-y-5">
          {experience.map((item) => (
            <motion.div key={item.company} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className={cx("rounded-[1.5rem] border p-6", theme.experienceCard)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className={cx("text-xl font-bold", theme.cardTitle)}>{item.role}</h3>
                  <p className={theme.projectType}>{item.company}</p>
                </div>
                <span className={cx("rounded-full px-3 py-1 text-sm", theme.periodPill)}>{item.period}</span>
              </div>
              <ul className={cx("mt-4 space-y-2 text-sm leading-6", theme.bodyText)}>
                {item.points.map((point) => <li key={point}>• {point}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="contact" className="px-6 py-24 md:px-10">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className={cx("mx-auto max-w-5xl rounded-[2rem] border p-8 text-center backdrop-blur-xl md:p-14", theme.contactBox)}>
          <p className={cx("mb-3 text-sm font-semibold uppercase tracking-[0.35em]", theme.eyebrow)}>Contact</p>
          <h2 className={cx("text-3xl font-black md:text-5xl", theme.sectionTitle)}>Let’s build something intelligent.</h2>
          <p className={cx("mx-auto mt-4 max-w-2xl", theme.bodyText)}>Open to AI/ML internships, full-stack projects, backend API work, and data science collaborations.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild className={cx("rounded-full px-6 py-6", theme.contactPrimary)}><a href={`mailto:${profile.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
            <Button asChild variant="outline" className={cx("rounded-full px-6 py-6", theme.outlineButton)}><a href={profile.github} target="_blank" rel="noreferrer"><FaGithub className="mr-2 h-4 w-4" />GitHub</a></Button>
            <Button asChild variant="outline" className={cx("rounded-full px-6 py-6", theme.outlineButton)}><a href={profile.linkedin} target="_blank" rel="noreferrer"><FaLinkedin className="mr-2 h-4 w-4" /> LinkedIn</a></Button>
          </div>
        </motion.div>
      </section>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
