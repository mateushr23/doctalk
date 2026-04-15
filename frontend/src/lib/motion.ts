/* ─── Shared motion presets ─── */

export const softEase = [0.32, 0.72, 0, 1] as const;
export const entryEase = [0.16, 1, 0.3, 1] as const;

export const springConfig = {
  type: "spring" as const,
  stiffness: 120,
  damping: 20,
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const scrollEntry = {
  hidden: { opacity: 0, y: 64, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: entryEase },
  },
};

export const messageEntry = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: entryEase },
  },
};

export const fadeUpBlur = {
  hidden: { opacity: 0, y: 64, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: entryEase },
  },
};
