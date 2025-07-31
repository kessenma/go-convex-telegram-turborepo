"use client";
import Link from "next/link";
import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "skewed";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const buttonVariants = {
  primary:
    "relative overflow-hidden bg-gradient-to-br from-cyan-400/80 to-cyan-800/80 backdrop-blur-md text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:from-cyan-300/90 hover:to-cyan-700/90 border border-cyan-500/20 hover:border-cyan-400/40 group",
  secondary:
    "relative overflow-hidden bg-slate-800/40 border border-slate-600/30 text-slate-200 hover:bg-slate-700/50 hover:border-slate-500/50 hover:-translate-y-0.5 backdrop-blur-md transition-all duration-300 group",
  tertiary:
    "relative overflow-hidden bg-slate-900/40 text-white hover:bg-slate-800/50 hover:-translate-y-0.5 backdrop-blur-md border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 group",
  skewed:
    "relative overflow-hidden bg-slate-950/80 text-white -skew-x-12 border border-b-[3px] border-white/80 hover:-translate-y-0.5 transform transition-all duration-200 backdrop-blur-md group",
};

const buttonSizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  onClick,
  disabled = false,
}: ButtonProps): React.ReactElement | null => {
  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 min-w-48 gap-2",
    buttonVariants[variant],
    buttonSizes[size],
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  // For skewed variant, we need to unskew the content
  const contentClasses = variant === "skewed" ? "skew-x-12" : "";

  if (href) {
    return React.createElement(
      Link as any,
      { href, className: baseClasses },
      <>
        {/* Expanding border effect on hover */}
        <div className="absolute inset-0 rounded-[inherit] border-2 border-transparent bg-gradient-to-r from-transparent via-current/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105" />
        <span className={cn("relative z-10", contentClasses)}>{children}</span>
      </>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick} disabled={disabled}>
      {/* Expanding border effect on hover */}
      {!disabled && (
        <div className="absolute inset-0 rounded-[inherit] border-2 border-transparent bg-gradient-to-r from-transparent via-current/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105" />
      )}
      <span className={cn("relative z-10", contentClasses)}>{children}</span>
    </button>
  );
};
