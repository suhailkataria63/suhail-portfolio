export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

