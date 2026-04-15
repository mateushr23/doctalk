"use client";

import { motion } from "framer-motion";

/* ─── Copy ─── */
const COPY = {
  title: "Ask anything about this document",
  subtext: "Get summaries, find specific info, or ask follow-up questions.",
  chips: [
    "Summarize this document",
    "What are the key points?",
    "Extract all dates and deadlines",
  ],
} as const;

/* ─── Motion presets ─── */
const entryEase = [0.16, 1, 0.3, 1] as const;
const springConfig = { type: "spring" as const, stiffness: 120, damping: 20 };

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUpBlur = {
  hidden: { opacity: 0, y: 64, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: entryEase },
  },
};

/* ─── Abstract geometric illustration ─── */
function GeometricIllustration() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-[200px] h-[160px] relative"
    >
      <svg
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Large rounded rectangle — shell color */}
        <rect x="20" y="30" width="80" height="60" rx="16" fill="#F5F5F5" stroke="#E5E7EB" strokeWidth="0.5" />
        {/* Small circle — accent soft */}
        <circle cx="140" cy="50" r="24" fill="#EFF6FF" />
        {/* Medium circle — accent outline */}
        <circle cx="140" cy="50" r="24" stroke="#2563EB" strokeWidth="1" strokeOpacity="0.2" fill="none" />
        {/* Small rounded rect — accent soft */}
        <rect x="110" y="90" width="60" height="40" rx="12" fill="#EFF6FF" stroke="#2563EB" strokeWidth="0.5" strokeOpacity="0.15" />
        {/* Tiny circle — shell */}
        <circle cx="50" cy="120" r="14" fill="#F5F5F5" stroke="#E5E7EB" strokeWidth="0.5" />
        {/* Accent dot */}
        <circle cx="85" cy="108" r="6" fill="#2563EB" opacity="0.15" />
        {/* Small floating square */}
        <rect x="160" y="20" width="20" height="20" rx="6" fill="#F5F5F5" stroke="#E5E7EB" strokeWidth="0.5" />
      </svg>
    </motion.div>
  );
}

/* ─── Component ─── */
interface EmptyStateProps {
  filename: string;
  onSelectChip: (question: string) => void;
}

export function EmptyState({ filename, onSelectChip }: EmptyStateProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center text-center px-4 py-24 gap-6"
    >
      <motion.div variants={fadeUpBlur}>
        <GeometricIllustration />
      </motion.div>

      <motion.h2
        variants={fadeUpBlur}
        className="text-[32px] font-bold leading-[1.1] tracking-tight text-text-1"
      >
        {COPY.title}
      </motion.h2>

      <motion.p
        variants={fadeUpBlur}
        className="text-base leading-relaxed text-text-2 max-w-[50ch]"
      >
        {COPY.subtext}
      </motion.p>

      <motion.p
        variants={fadeUpBlur}
        className="text-xs font-medium text-text-3"
      >
        {filename}
      </motion.p>

      {/* StarterChips with Double-Bezel small variant */}
      <motion.div
        variants={staggerContainer}
        className="flex flex-wrap justify-center gap-3 mt-4 md:flex-nowrap md:overflow-x-auto"
      >
        {COPY.chips.map((chip) => (
          <motion.button
            key={chip}
            variants={fadeUpBlur}
            whileHover={{ scale: 1.02, backgroundColor: "#EFF6FF" }}
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
            onClick={() => onSelectChip(chip)}
            className="rounded-[1.25rem] p-1 bg-shell ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="block bg-white rounded-[calc(1.25rem-0.25rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] px-4 py-2 text-sm text-text-2 whitespace-nowrap">
              {chip}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
