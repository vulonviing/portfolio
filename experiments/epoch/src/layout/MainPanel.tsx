/**
 * Right side: animated page host.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconShieldCheck } from "@tabler/icons-react";
import { useLocation } from "react-router-dom";

export default function MainPanel({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <main className="relative flex-1 h-full overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute right-4 top-2.5 z-50 flex items-center gap-1.5 rounded-full border border-[#2dd4bf]/30 bg-[#0f2e2c]/95 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[#8fddd2] shadow-lg backdrop-blur-sm">
        <IconShieldCheck size={12} aria-hidden="true" />
        <span className="sm:hidden">Data masked</span>
        <span className="hidden sm:inline">Sensitive data masked</span>
      </div>
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
