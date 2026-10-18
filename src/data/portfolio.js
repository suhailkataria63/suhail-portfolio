import { Brain, Server, BarChart3, ShieldCheck, Code2, Database, Bot } from "lucide-react";

export const profile = {
  name: "Suhail Kataria",
  title: "AI & Data Science Student • Full-Stack AI Builder",
  email: "suhail.kataria63@gmail.com",
  phone: "6280208838",
  github: "https://github.com/suhailkataria63",
  linkedin: "https://linkedin.com/in/suhail-kataria63",
  resume: "/Suhail_Kataria_Resume.pdf",
  summary:
    "I build AI-powered web applications, LLM-integrated workflows, predictive models, REST APIs, dashboards, and scalable full-stack products using Python, FastAPI, Next.js, React, TypeScript, Golang, SQL, and modern deployment tools.",
};

export const projects = [  
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
  title: "Cynbit AI Solutions Architect",
  type: "AI-Powered Business Solution Planning",
  description:
    "AI-powered platform that transforms business requirements into actionable solution blueprints, technical architectures, implementation roadmaps, and KPIs using Groq's GPT-OSS 120B",
  stack: [
    "Next.js",
    "React",
    "TypeScript",
    "Groq API",
    "GPT-OSS 120B",
    "Zod",
    "Tailwind CSS",
    "Vercel"
  ],
  icon: Brain,
  github: "https://github.com/suhailkataria63/cynbit-assignment",
  live: "https://cynbit-ai.vercel.app/"
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
    title: "Social Video RAG Chatbot",
    type: "AI Video Intelligence Platform",
    description:
      "RAG chatbot for YouTube and Instagram videos with transcript ingestion, ChromaDB vector search, metadata-aware retrieval, citation-backed answers, and streaming chat.",
    stack: ["Python", "FastAPI", "LangChain", "ChromaDB", "Gemini API", "Ollama", "Next.js", "TypeScript", "Vercel"],
    icon: Bot,
    github: "https://github.com/suhailkataria63/techsolv-chatbot",
    live: "https://social-rag-chatbot.vercel.app/"
  },
  {
    title: "Smart Leads Dashboard",
    type: "Full-Stack SaaS Dashboard",
    description:
      "Full-stack lead management dashboard with authentication, RBAC, CRUD operations, search, filtering, pagination, CSV export, and a responsive analytics-focused UI.",
    stack: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "JWT", "Render"],
    icon: Server,
    github: "https://github.com/suhailkataria63/smart-leads-dash",
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

export const skills = [
  "Python", "Golang", "SQL", "JavaScript", "TypeScript", "React.js", "Next.js", "Tailwind CSS", "FastAPI", "Node.js", "Express.js", "MongoDB", "SQLite", "JWT", "RBAC", "Pandas", "NumPy", "Scikit-learn", "TensorFlow/Keras", "Streamlit", "Hugging Face", "Vercel", "GitHub"
];

export const education = [
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

export const experience = [
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

export const highlights = ["94% phishing model accuracy", "9% MAPE demand forecasting", "Full-stack AI apps", "JWT + RBAC backend systems"];

export const skillAreas = [{ title: "AI / ML", icon: Brain, text: "Predictive modeling, NLP, classification, regression, time-series forecasting, model evaluation." }, { title: "Full Stack", icon: Code2, text: "React, Next.js, Tailwind, FastAPI, REST APIs, dashboards, deployment workflows." }, { title: "Data + Backend", icon: Database, text: "SQL, SQLite, MongoDB, JWT auth, RBAC, API integration, EDA, visualization." }];

export const categories = ["All", "AI", "Full-Stack", "Backend", "Data"];
