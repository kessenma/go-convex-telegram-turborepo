"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export function LampDemo({
  title,
  className,
}: {
  title?: React.ReactNode;
  className?: string;
}) {
  return (
    <LampContainer className={className}>
      {title && (
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="py-4 mt-8 text-4xl font-medium tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-br from-slate-300 to-slate-500 md:text-7xl"
        >
          {title}
        </motion.h1>
      )}
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex overflow-hidden relative z-0 flex-col justify-center items-center w-full h-full rounded-md bg-slate-950",
        className
      )}
    >
      <div className="flex isolate relative z-0 flex-1 justify-center items-center w-full h-full">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top] -translate-y-20 md:translate-y-0"
        >
          <div className="absolute w-[100%] left-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          animate={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top] -translate-y-20 md:translate-y-0"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 w-full h-48 blur-2xl scale-x-150 translate-y-12 bg-slate-950 -translate-y-8 md:translate-y-12"></div>
        <div className="absolute top-1/2 z-50 w-full h-48 bg-transparent opacity-10 backdrop-blur-md -translate-y-20 md:translate-y-0"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 blur-3xl -translate-y-32 md:-translate-y-1/2"></div>
        <motion.div
          initial={{ width: "8rem" }}
          animate={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl -translate-y-32 md:-translate-y-[6rem]"
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          animate={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-cyan-400 -translate-y-36 md:-translate-y-[7rem]"
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950 -translate-y-48 md:-translate-y-[12.5rem]"></div>
      </div>

      <div className="flex relative z-50 flex-col items-center px-5 -translate-y-[40%]">
        {children}
      </div>
    </div>
  );
};
