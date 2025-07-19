"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../../hooks/use-outside-clicks";
import { cn } from "../../lib/utils";

export interface ExpandableCardProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLElement>;
  buttonPosition?: { top: number | 'auto'; bottom?: number; right: number };
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  liquidGlass?: boolean;
  className?: string;
  layoutId?: string;
  zIndex?: number;
}

export function ExpandableCard({
  isOpen,
  onClose,
  children,
  buttonRef,
  buttonPosition = { top: 0, right: 0 },
  width = "w-96",
  maxWidth = "max-w-[384px]",
  maxHeight = "max-h-[90vh]",
  liquidGlass = false,
  className,
  layoutId,
  zIndex = 50
}: ExpandableCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useOutsideClick(ref, (event: MouseEvent | TouchEvent) => {
    // Prevent immediate closing on touch devices when touching the card itself
    if (event.target && ref.current?.contains(event.target as Node)) {
      return;
    }
    onClose();
  });

  // Determine background and border styles based on liquidGlass prop
  const bgStyle = liquidGlass
    ? "bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md border-white/10"
    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700";

  // Determine overlay style based on liquidGlass prop
  const overlayStyle = liquidGlass
    ? "backdrop-blur-sm bg-black/20"
    : "backdrop-blur-sm bg-black/20";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 z-${zIndex - 1} ${overlayStyle}`}
          />
          <motion.div
            ref={ref}
            layoutId={layoutId || `expandable-card-${id}`}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 1
            }}
            style={{
              position: "fixed",
              top: buttonPosition.top,
              bottom: buttonPosition.bottom,
              right: buttonPosition.right,
              zIndex: zIndex,
            }}
            className={cn(
              width,
              maxWidth,
              maxHeight,
              bgStyle,
              "rounded-xl border shadow-2xl",
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
        scale: 0.8
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: {
          duration: 0.1,
        },
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-black dark:text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};