"use client";

import { motion } from "framer-motion";
import { LoadingSpinner } from "../components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-slate-900/50 border border-slate-700/30 backdrop-blur-sm"
      >
        <LoadingSpinner size="lg" text="Loading page..." use3D={true} />
      </motion.div>
    </div>
  );
}