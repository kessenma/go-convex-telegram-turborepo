"use client";
import { motion, useScroll, useTransform } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  titleSize?: "small" | "medium" | "large";
  compact?: boolean;
  spacing?: "tight" | "normal" | "loose";
  lineColor?: string;
  dotColor?: string;
}

export const Timeline = ({ 
  data, 
  titleSize = "large", 
  compact = false, 
  spacing = "normal", 
  lineColor = "cyan-500", 
  dotColor = "neutral-800" 
}: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  
  // Determine spacing values based on the spacing prop
  const spacingValues = {
    tight: {
      paddingTop: compact ? "pt-4" : "pt-6",
      mdPaddingTop: compact ? "md:pt-8" : "md:pt-16",
      gap: "md:gap-4"
    },
    normal: {
      paddingTop: compact ? "pt-6" : "pt-10",
      mdPaddingTop: compact ? "md:pt-20" : "md:pt-40",
      gap: "md:gap-10"
    },
    loose: {
      paddingTop: compact ? "pt-8" : "pt-16",
      mdPaddingTop: compact ? "md:pt-24" : "md:pt-48",
      gap: "md:gap-16"
    }
  }[spacing];

  return (
    <div className={`w-full ${compact ? 'md:px-4' : 'md:px-10'}`} ref={containerRef}>
      <div ref={ref} className={`relative ${compact ? 'pb-10' : 'pb-20'} mx-auto max-w-7xl`}>
        {data.map((item, index) => (
          <div
            key={index}
            className={`flex justify-start ${spacingValues.paddingTop} ${spacingValues.mdPaddingTop} ${spacingValues.gap}`}
          >
            <div className={`flex sticky ${compact ? 'top-20' : 'top-40'} z-40 flex-col items-center self-start ${compact ? 'max-w-[100px]' : 'max-w-xs'} md:flex-row ${compact ? 'lg:max-w-xs' : 'lg:max-w-sm'} md:w-full`}>
              <div className={`flex absolute left-3 justify-center items-center ${compact ? 'w-6 h-6' : 'w-10 h-10'} bg-white rounded-full md:left-3 dark:bg-black`}>
                <div className={`${compact ? 'p-1 w-3 h-3' : 'p-2 w-4 h-4'} rounded-full border bg-neutral-200 dark:bg-${dotColor} border-neutral-300 dark:border-neutral-700`} />
              </div>
              <h3
                className={`hidden md:block ${compact ? 'text-lg md:pl-12' : 'text-xl md:pl-20'} ${titleSize === "small" ? "md:text-xl" : titleSize === "medium" ? "md:text-2xl" : "md:text-4xl"} font-bold text-neutral-500 dark:text-neutral-500`}
              >
                {item.title}
              </h3>
            </div>

            <div className={`relative pr-4 ${compact ? 'pl-12' : 'pl-20'} w-full md:pl-4`}>
              <h3
                className={`md:hidden block ${titleSize === "small" ? "text-lg" : titleSize === "medium" ? "text-xl" : "text-2xl"} mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500`}
              >
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{
            height: `${height}px`,
          }}
          className={`absolute ${compact ? 'md:left-5 left-5' : 'md:left-8 left-8'} top-0 overflow-hidden ${compact ? 'w-[1px]' : 'w-[2px]'} bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]`}
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className={`absolute inset-x-0 top-0 ${compact ? 'w-[1px]' : 'w-[2px]'} bg-gradient-to-t from-${lineColor}/30 via-${lineColor} to-transparent from-[0%] via-[10%] rounded-full`}
          />
        </div>
      </div>
    </div>
  );
};
