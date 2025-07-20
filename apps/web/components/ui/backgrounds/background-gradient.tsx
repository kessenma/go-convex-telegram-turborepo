"use client";
import type React from "react";
import { cn } from "../../../lib/utils";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  color?: "cyan" | "white" | "purple" | "green" | "orange" | "red";
}

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  color = "cyan",
}: BackgroundGradientProps) => {
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500 will-change-transform",
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
