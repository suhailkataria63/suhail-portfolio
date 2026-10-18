import { motion } from "framer-motion";
import { education } from "@/data/portfolio";
import { cx, fadeUp } from "./shared";
import SectionTitle from "./SectionTitle";

export default function EducationSection({ theme }) {
  return (
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
              className={cx("education-card rounded-[1.5rem] border p-6", theme.experienceCard)}
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
  );
}
