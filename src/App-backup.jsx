import React, { useMemo, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Mail, ExternalLink, ArrowUpRight, Sparkles, Brain, Server, BarChart3, ShieldCheck, Code2, Database, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const profile = {
  name: "Suhail Kataria",
  title: "AI & Data Science Student • Full-Stack AI Builder",
  email: "suhail.kataria63@gmail.com",
  phone: "6280208838",
  github: "https://github.com/suhailkataria63",
  linkedin: "https://linkedin.com/in/suhail-kataria63",
  resume: "/Suhail_Resume.pdf",
  summary:
    "I build AI-powered applications, predictive models, REST APIs, dashboards, and scalable web products using Python, Golang, React, Next.js, FastAPI, SQL, and modern deployment workflows.",
};

const projects = [
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
      "Lead management dashboard with authentication, RBAC, CRUD operations, search, filtering, pagination, CSV export, and responsive UI.",
    stack: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "JWT", "Render"],
    icon: Server,
    github: "https://github.com/suhailkataria63",
    live: "https://smart-leads-dash.vercel.app/login"
  },
  {
    title: "InternAI Resume Analyzer",
    type: "AI Matching Workflow",
    description:
      "Resume and job-description matching system with skill extraction, match scoring, fit-level analysis, and improvement suggestions.",
    stack: ["Python", "FastAPI", "Next.js", "Tailwind", "SQLite", "REST APIs"],
    icon: Brain,
    github: "https://github.com/suhailkataria63",
    live: ""
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

function SectionTitle({ eyebrow, title, text }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">{eyebrow}</p>
      <h2 className="text-3xl font-bold text-white md:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">{text}</p>}
    </motion.div>
  );
}

function FloatingOrb({ className }) {
  return <motion.div animate={{ y: [0, -22, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className={className} />;
}

export default function SuhailPortfolio() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.001 });
  const [filter, setFilter] = useState("All");

  const categories = useMemo(() => ["All", "AI", "Full-Stack", "Backend", "Data"], []);
  const filteredProjects = projects.filter((project) => {
    if (filter === "All") return true;
    const text = `${project.title} ${project.type} ${project.stack.join(" ")}`.toLowerCase();
    return text.includes(filter.toLowerCase()) || (filter === "Data" && text.includes("forecast"));
  });

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <motion.div style={{ scaleX }} className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400" />

      <nav className="fixed left-1/2 top-5 z-40 hidden w-[92%] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-white/8 px-5 py-3 backdrop-blur-2xl md:flex">
        <a href="#home" className="font-semibold tracking-wide text-white">Suhail Kataria</a>
        <div className="flex gap-6 text-sm text-slate-300">
          <a href="#projects" className="hover:text-cyan-300">Projects</a>
          <a href="#skills" className="hover:text-cyan-300">Skills</a>
          <a href="#experience" className="hover:text-cyan-300">Experience</a>
          <a href="#contact" className="hover:text-cyan-300">Contact</a>
        </div>
      </nav>

      <section id="home" className="relative flex min-h-screen items-center px-6 py-24 md:px-10">
        <FloatingOrb className="absolute left-[-80px] top-32 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <FloatingOrb className="absolute bottom-20 right-[-120px] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200">
              <Sparkles className="h-4 w-4" /> Available for AI/ML, full-stack, and backend roles
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl">
              Building intelligent products with <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">AI + software engineering</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{profile.summary}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild className="rounded-full bg-cyan-300 px-6 py-6 text-slate-950 hover:bg-cyan-200">
                <a href="#projects">View Projects <ArrowUpRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/10">
                <a href={profile.resume} download="Suhail_Resume.pdf">
                  <Download className="mr-2 h-4 w-4" /> Resume
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30 blur-2xl" />
            <Card className="relative overflow-hidden rounded-[2rem] border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
              <CardContent className="p-7">
                <div className="mb-7 flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 text-2xl font-black text-slate-950">SK</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
                    <p className="text-sm text-slate-300">{profile.title}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {["94% phishing model accuracy", "9% MAPE demand forecasting", "Full-stack AI apps", "JWT + RBAC backend systems"].map((item) => (
                    <motion.div whileHover={{ x: 8 }} key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-200">{item}</motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="projects" className="px-6 py-24 md:px-10">
  <SectionTitle eyebrow="Selected Work" title="Project case studies" text="A focused portfolio should show outcomes, architecture, stack choices, and business value - not just repository links." />

  <div className="mx-auto mb-8 flex max-w-6xl flex-wrap justify-center gap-3">
    {categories.map((cat) => (
      <button key={cat} onClick={() => setFilter(cat)} className={`rounded-full border px-4 py-2 text-sm transition ${filter === cat ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
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
          <Card className="h-full overflow-hidden rounded-[1.75rem] border-white/10 bg-white/[0.07] backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-white/[0.1]">
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                  <Icon className="h-6 w-6" />
                </div>
                <ExternalLink className="h-5 w-5 text-slate-400 transition group-hover:text-cyan-300" />
              </div>

              <p className="text-sm font-medium text-cyan-300">{project.type}</p>
              <h3 className="mt-2 text-xl font-bold text-white">{project.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{project.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span key={tech} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                  <FaGithub className="mr-2 h-4 w-4" /> GitHub
                </a>

                {project.live && (
                  <a href={project.live} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
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
        <SectionTitle eyebrow="Capabilities" title="AI, backend, frontend, and analytics" />
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[{ title: "AI / ML", icon: Brain, text: "Predictive modeling, NLP, classification, regression, time-series forecasting, model evaluation." }, { title: "Full Stack", icon: Code2, text: "React, Next.js, Tailwind, FastAPI, REST APIs, dashboards, deployment workflows." }, { title: "Data + Backend", icon: Database, text: "SQL, SQLite, MongoDB, JWT auth, RBAC, API integration, EDA, visualization." }].map((area) => {
            const Icon = area.icon;
            return (
              <motion.div key={area.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="h-full min-h-[260px] rounded-[1.75rem] border-white/10 bg-white/[0.07]">
                  <CardContent className="flex h-full flex-col justify-center p-8">
                    <Icon className="mb-5 h-8 w-8 text-cyan-300" />
                    <h3 className="text-xl font-bold text-white">{area.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{area.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-center gap-3">
          {skills.map((skill) => <motion.span whileHover={{ y: -4 }} key={skill} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{skill}</motion.span>)}
        </div>
      </section>

      <section id="experience" className="px-6 py-24 md:px-10">
        <SectionTitle eyebrow="Experience" title="Training and Practical execution" />
        <div className="mx-auto max-w-4xl space-y-5">
          {experience.map((item) => (
            <motion.div key={item.company} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{item.role}</h3>
                  <p className="text-cyan-300">{item.company}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">{item.period}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {item.points.map((point) => <li key={point}>• {point}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="contact" className="px-6 py-24 md:px-10">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-400/15 via-violet-400/15 to-fuchsia-400/15 p-8 text-center backdrop-blur-xl md:p-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Contact</p>
          <h2 className="text-3xl font-black text-white md:text-5xl">Let’s build something intelligent.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Open to AI/ML internships, full-stack projects, backend API work, and data science collaborations.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild className="rounded-full bg-white px-6 py-6 text-slate-950 hover:bg-slate-200"><a href={`mailto:${profile.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a></Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/10"><a href={profile.github} target="_blank" rel="noreferrer"><FaGithub className="mr-2 h-4 w-4" />GitHub</a></Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-6 py-6 text-white hover:bg-white/10"><a href={profile.linkedin} target="_blank" rel="noreferrer"><FaLinkedin className="mr-2 h-4 w-4" /> LinkedIn</a></Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
