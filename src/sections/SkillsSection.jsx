import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { skills, skillAreas } from "@/data/portfolio";
import { cx, fadeUp } from "./shared";
import SectionTitle from "./SectionTitle";

export default function SkillsSection({ theme }) {
  return (
    <section id="skills" className="px-6 py-24 md:px-10">
        <SectionTitle theme={theme} eyebrow="Capabilities" title="AI, Backend, Frontend, and Analytics." />
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {skillAreas.map((area) => {
            const Icon = area.icon;
            return (
              <motion.div key={area.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className={cx("skill-card h-full min-h-[260px] rounded-[1.75rem] border", theme.skillCard)}>
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
  );
}
