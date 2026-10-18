import { motion } from "framer-motion";
import { cx, fadeUp } from "./shared";

export default function SectionTitle({ eyebrow, title, text, theme }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mx-auto mb-12 max-w-3xl text-center">
      <p className={cx("mb-3 text-sm font-semibold uppercase tracking-[0.35em]", theme.eyebrow)}>{eyebrow}</p>
      <h2 className={cx("text-3xl font-bold md:text-5xl", theme.sectionTitle)}>{title}</h2>
      {text && <p className={cx("mt-4 text-base leading-7 md:text-lg", theme.sectionText)}>{text}</p>}
    </motion.div>
  );
}

