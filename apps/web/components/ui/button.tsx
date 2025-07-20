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
    "bg-gradient-to-br from-cyan-300 to-cyan-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
  secondary:
    "bg-white/25 border border-gray-200/25 text-gray-900 hover:bg-gray-50/25 hover:border-cyan-500/25 hover:-translate-y-0.5 dark:bg-gray-900/25 dark:border-gray-700/25 dark:text-white dark:hover:bg-gray-800/25 backdrop-blur-sm",
  tertiary:
    "bg-black text-cyan-900 hover:bg-cyan-50/25 hover:-translate-y-0.5 dark:bg-gray-900/40 dark:text-white dark:hover:bg-gray-800/50 backdrop-blur-sm",
  skewed:
    "bg-slate-950 text-white -skew-x-12 border border-b-[3px] border-white hover:-translate-y-0.5 transform transition-all duration-200",
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
      <span className={contentClasses}>{children}</span>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick} disabled={disabled}>
      <span className={contentClasses}>{children}</span>
    </button>
  );
};
