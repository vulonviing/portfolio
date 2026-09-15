/**
 * Reveal — fade-up-on-scroll wrapper for FoundationsPage sections.
 * Presentation-mode sugar only; `viewport.once` keeps a rewatch from
 * re-triggering (a presenter scrolling back up shouldn't see it re-fade).
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export default function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
