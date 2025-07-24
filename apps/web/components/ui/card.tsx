"use client";
import React from "react";
import { cn } from "../../lib/utils";
import CountUp from "./text-animations/count-up";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md border border-white/10 rounded-lg shadow-lg",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

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
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-slate-100 font-mono">
        {useCountUp && isNumeric ? (
          <CountUp
            to={numericValue}
            duration={2}
            className="text-3xl font-bold text-slate-100 font-mono"
          />
        ) : (
          value
        )}
      </p>
    </Card>
  );
};
