"use client";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import type React from "react";
import { type SVGProps, useState } from "react";
import { cn } from "../../lib/utils";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const [userClosed, setUserClosed] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (hideOnScroll && latest > 40 && !userClosed) {
      setOpen(false);
    } else if (!userClosed) {
      setOpen(true);
    }
  });

  const handleClose = () => {
    setOpen(false);
    setUserClosed(true);
  };

  return (
    <motion.div
      className={cn(
        "flex sticky inset-x-0 top-0 z-40 justify-center items-center px-4 py-1 w-full bg-transparent min-h-14",
        className
      )}
      initial={{
        y: -100,
        opacity: 0,
      }}
      animate={{
        y: open ? 0 : -100,
        opacity: open ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}

      <motion.button
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
        onClick={handleClose}
      >
        <CloseIcon className="w-5 h-5 text-white" />
      </motion.button>
    </motion.div>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
