import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { categories } from "@/data/portfolio";
import { cx, fadeUp } from "./shared";
import SectionTitle from "./SectionTitle";

export default function ProjectsSection({ theme, filter, setFilter, filteredProjects }) {
  return (
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
                <Card className={cx("project-card h-full overflow-hidden rounded-[1.75rem] border transition", theme.projectCard)}>
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
  );
}
