"use client";
import type React from "react";
import { cn } from "../../../lib/utils";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  color?: "cyan" | "white" | "purple" | "green" | "orange" | "red";
  intensity?: "subtle" | "normal" | "strong";
  tronMode?: boolean;
}

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  color = "cyan",
  intensity = "normal",
  tronMode = true,
}: BackgroundGradientProps) => {
  // Tron-inspired styling with geometric precision
  if (tronMode) {
    return (
      <div className={cn("relative group", containerClassName)}>
        {/* Tron-style border with subtle glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl z-[1] transition-all duration-300",
            intensity === "subtle" && "opacity-30 group-hover:opacity-50",
            intensity === "normal" && "opacity-40 group-hover:opacity-60", 
            intensity === "strong" && "opacity-60 group-hover:opacity-80",
            color === "cyan" && "bg-gradient-to-r from-cyan-500/20 via-cyan-400/30 to-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
            color === "purple" && "bg-gradient-to-r from-purple-500/20 via-purple-400/30 to-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
            color === "white" && "bg-gradient-to-r from-slate-300/20 via-slate-200/30 to-slate-300/20 shadow-[0_0_20px_rgba(148,163,184,0.15)]",
            color === "green" && "bg-gradient-to-r from-green-500/20 via-green-400/30 to-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
            color === "orange" && "bg-gradient-to-r from-orange-500/20 via-orange-400/30 to-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]",
            color === "red" && "bg-gradient-to-r from-red-500/20 via-red-400/30 to-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          )}
        />
        
        {/* Geometric corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 z-[2]">
          <div className={cn(
            "absolute top-0 left-0 w-full h-0.5 rounded-full",
            color === "cyan" && "bg-cyan-400",
            color === "purple" && "bg-purple-400",
            color === "white" && "bg-slate-300",
            color === "green" && "bg-green-400",
            color === "orange" && "bg-orange-400",
            color === "red" && "bg-red-400"
          )} />
          <div className={cn(
            "absolute top-0 left-0 w-0.5 h-full rounded-full",
            color === "cyan" && "bg-cyan-400",
            color === "purple" && "bg-purple-400", 
            color === "white" && "bg-slate-300",
            color === "green" && "bg-green-400",
            color === "orange" && "bg-orange-400",
            color === "red" && "bg-red-400"
          )} />
        </div>
        
        <div className="absolute top-0 right-0 w-4 h-4 z-[2]">
          <div className={cn(
            "absolute top-0 right-0 w-full h-0.5 rounded-full",
            color === "cyan" && "bg-cyan-400",
            color === "purple" && "bg-purple-400",
            color === "white" && "bg-slate-300",
            color === "green" && "bg-green-400",
            color === "orange" && "bg-orange-400",
            color === "red" && "bg-red-400"
          )} />
          <div className={cn(
            "absolute top-0 right-0 w-0.5 h-full rounded-full",
            color === "cyan" && "bg-cyan-400",
            color === "purple" && "bg-purple-400",
            color === "white" && "bg-slate-300",
            color === "green" && "bg-green-400",
            color === "orange" && "bg-orange-400",
            color === "red" && "bg-red-400"
          )} />
        </div>

        <div className={cn("relative bg-slate-900/90 backdrop-blur-sm rounded-2xl z-10 border", 
          color === "cyan" && "border-cyan-500/20",
          color === "purple" && "border-purple-500/20",
          color === "white" && "border-slate-400/20",
          color === "green" && "border-green-500/20",
          color === "orange" && "border-orange-500/20",
          color === "red" && "border-red-500/20",
          className
        )}>
          {children}
        </div>
      </div>
    );
  }

  // Original gradient mode for backwards compatibility
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] transition duration-500 will-change-transform",
          intensity === "subtle" && "opacity-30 group-hover:opacity-50 blur-lg",
          intensity === "normal" && "opacity-60 group-hover:opacity-100 blur-xl",
          intensity === "strong" && "opacity-80 group-hover:opacity-100 blur-2xl",
          color === "cyan" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#48b4e8,transparent),radial-gradient(circle_farthest-side_at_100%_0,#24a1de,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#137cb6,transparent),radial-gradient(circle_farthest-side_at_0_0,#106394,#0d2d44)]",
          color === "white" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#ffffff,transparent),radial-gradient(circle_farthest-side_at_100%_0,#e2e8f0,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#cbd5e1,transparent),radial-gradient(circle_farthest-side_at_0_0,#94a3b8,#64748b)]",
          color === "purple" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#c084fc,transparent),radial-gradient(circle_farthest-side_at_100%_0,#a855f7,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#9333ea,transparent),radial-gradient(circle_farthest-side_at_0_0,#7e22ce,#6b21a8)]",
          color === "green" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#4ade80,transparent),radial-gradient(circle_farthest-side_at_100%_0,#22c55e,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#16a34a,transparent),radial-gradient(circle_farthest-side_at_0_0,#15803d,#166534)]",
          color === "orange" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#fb923c,transparent),radial-gradient(circle_farthest-side_at_100%_0,#f97316,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ea580c,transparent),radial-gradient(circle_farthest-side_at_0_0,#c2410c,#9a3412)]",
          color === "red" &&
            "bg-[radial-gradient(circle_farthest-side_at_0_100%,#f87171,transparent),radial-gradient(circle_farthest-side_at_100%_0,#ef4444,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#dc2626,transparent),radial-gradient(circle_farthest-side_at_0_0,#b91c1c,#991b1b)]"
        )}
      />
      <div className={cn("relative bg-slate-900 rounded-3xl z-10", className)}>
        {children}
      </div>
    </div>
  );
};
