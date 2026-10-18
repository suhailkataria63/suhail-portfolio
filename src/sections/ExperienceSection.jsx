import { motion } from "framer-motion";
import { experience } from "@/data/portfolio";
import { cx, fadeUp } from "./shared";
import SectionTitle from "./SectionTitle";

export default function ExperienceSection({ theme }) {
  return (
    <section id="experience" className="px-6 py-24 md:px-10">
        <SectionTitle theme={theme} eyebrow="Experience" title="Training and Practical execution" />
        <div className="mx-auto max-w-4xl space-y-5">
          {experience.map((item) => (
            <motion.div key={item.company} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className={cx("experience-card rounded-[1.5rem] border p-6", theme.experienceCard)}>
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
  );
}
