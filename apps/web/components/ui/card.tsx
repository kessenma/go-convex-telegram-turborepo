"use client";
import React from "react";
import { cn } from "../../lib/utils";
import CountUp from "./text-animations/count-up";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
  backgroundColor?: string;
  borderColor?: string;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, style, backgroundColor, borderColor }, ref) => {
    // Create a combined style object that includes both the style prop and any color props
    const combinedStyle = {
      ...style,
      ...(backgroundColor ? { backgroundColor } : {}),
      ...(borderColor ? { borderColor } : {}),
    };

    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-br rounded-lg border shadow-lg backdrop-blur-md from-slate-800/60 to-slate-900/60 border-cyan-500/30 relative overflow-hidden",
          className
        )}
        style={Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined}
      >
        {/* Tron-like glowing border effect */}
        <div className="absolute inset-0 rounded-lg border border-cyan-400/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/5 pointer-events-none" />
        
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 bg-cyan-500/5 blur-xl rounded-lg opacity-30 pointer-events-none" />
        
        {/* Top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold tracking-tight leading-none", className)}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

interface StatCardProps {
  title: string;
  value: string | number;
  className?: string;
  useCountUp?: boolean;
}

export const StatCard = ({
  title,
  value,
  className,
  useCountUp = true,
}: StatCardProps) => {
  const numericValue =
    typeof value === "number"
      ? value
      : parseInt(value.toString().replace(/[^0-9]/g, ""), 10);
  const isNumeric =
    (!Number.isNaN(numericValue) && typeof value !== "string") ||
    (typeof value === "string" && /^\d+$/.test(value));

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="mb-2 text-sm font-semibold tracking-wide uppercase text-slate-300">
        {title}
      </h3>
      <p className="font-mono text-3xl font-bold text-slate-100">
        {useCountUp && isNumeric ? (
          <CountUp
            to={numericValue}
            duration={2}
            className="font-mono text-3xl font-bold text-slate-100"
          />
        ) : (
          value
        )}
      </p>
    </Card>
  );
};
