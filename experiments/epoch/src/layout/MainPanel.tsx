/**
 * Right side: animated page host.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function MainPanel({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <main className="flex-1 h-full overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="flex-1 h-full overflow-y-auto"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
