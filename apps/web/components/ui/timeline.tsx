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
}

export const Timeline = ({ data, titleSize = "large" }: TimelineProps) => {
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

  return (
    <div className="w-full md:px-10" ref={containerRef}>
      <div ref={ref} className="relative pb-20 mx-auto max-w-7xl">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="flex sticky top-40 z-40 flex-col items-center self-start max-w-xs md:flex-row lg:max-w-sm md:w-full">
              <div className="flex absolute left-3 justify-center items-center w-10 h-10 bg-white rounded-full md:left-3 dark:bg-black">
                <div className="p-2 w-4 h-4 rounded-full border bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" />
              </div>
              <h3
                className={`hidden md:block text-xl md:pl-20 ${titleSize === "small" ? "md:text-2xl" : titleSize === "medium" ? "md:text-3xl" : "md:text-5xl"} font-bold text-neutral-500 dark:text-neutral-500`}
              >
                {item.title}
              </h3>
            </div>

            <div className="relative pr-4 pl-20 w-full md:pl-4">
              <h3
                className={`md:hidden block ${titleSize === "small" ? "text-xl" : titleSize === "medium" ? "text-2xl" : "text-3xl"} mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500`}
              >
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: `${height}px`,
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-cyan-50 via-cyan-500 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
