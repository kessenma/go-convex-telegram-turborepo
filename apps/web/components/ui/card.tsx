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
          "bg-white/25 border border-gray-200/25 rounded-xl p-6 shadow-sm backdrop-blur-sm",
          "dark:bg-gray-900/25 dark:border-gray-700/25",
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
    <Card className={className}>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
        {useCountUp && isNumeric ? (
          <CountUp
            to={numericValue}
            duration={2}
            className="text-3xl font-bold text-gray-900 dark:text-white font-mono"
          />
        ) : (
          value
        )}
      </p>
    </Card>
  );
};
