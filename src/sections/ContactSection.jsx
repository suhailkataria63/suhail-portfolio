import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { profile } from "@/data/portfolio";
import { cx } from "./shared";

export default function ContactSection({ theme }) {
  return (
    <section id="contact" className="px-6 py-24 md:px-10">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className={cx("glass-card mx-auto max-w-5xl rounded-[2rem] border p-8 text-center backdrop-blur-xl md:p-14", theme.contactBox)}>
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
  );
}
