"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

type Tab = {
  title: string | React.ReactNode;
  value: string;
  content?: string | React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTabIndex?: number;
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  onTabChange?: (tab: Tab) => void;
  variant?: "default" | "skewed";
};

export function Tabs({
  tabs: propTabs,
  activeTabIndex,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  onTabChange,
  variant = "default",
}: TabsProps): React.JSX.Element | null {
  // Use activeTabIndex prop or default to first tab
  const currentActiveIndex = activeTabIndex !== undefined && activeTabIndex >= 0 ? activeTabIndex : 0;
  const [active, setActive] = useState<Tab>(() => {
    if (!propTabs || propTabs.length === 0) {
      return { title: '', value: '', content: '' };
    }
    return propTabs[currentActiveIndex] || propTabs[0]!;
  });

  // Update active tab when activeTabIndex prop changes
  useEffect(() => {
    if (propTabs && propTabs.length > 0 && activeTabIndex !== undefined && activeTabIndex >= 0 && propTabs[activeTabIndex]) {
      setActive(propTabs[activeTabIndex]!);
    }
  }, [activeTabIndex, propTabs]);

  // Add safety check for empty tabs array
  if (!propTabs || propTabs.length === 0) {
    return null;
  }

  const handleTabClick = (idx: number) => {
    const selectedTab = propTabs[idx];
    if (selectedTab) {
      setActive(selectedTab);
      onTabChange?.(selectedTab);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex overflow-auto relative flex-row justify-start items-center w-full max-w-full [perspective:1000px] sm:overflow-visible no-visible-scrollbar",
          containerClassName
        )}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={typeof tab.title === 'string' ? tab.title : tab.value}
            onClick={() => {
              handleTabClick(idx);
            }}
            className={cn(
              variant === "default" ? "relative px-4 py-2 rounded-full" : "relative px-4 py-2 -skew-x-12",
              variant === "skewed" && active.value === tab.value ? "border border-b-[3px] border-primary" : "",
              variant === "skewed" && active.value !== tab.value ? "border border-transparent" : "",
              tabClassName
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {active.value === tab.value && variant === "default" && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 bg-gray-200 rounded-full dark:bg-zinc-800",
                  activeTabClassName
                )}
              />
            )}

            <span className={cn(
              "block relative", 
              variant === "default" ? "text-black dark:text-white" : ""
            )}>
              {tab.title}
            </span>
          </button>
        ))}
      </div>
      {!contentClassName?.includes("hidden") && (
        <FadeInDiv
          active={active}
          key={active.value}
          className={cn("mt-32", contentClassName)}
          variant={variant}
        />
      )}
    </>
  );
};

type FadeInDivProps = {
  className?: string;
  key?: string;
  active: Tab;
  hovering?: boolean;
  variant?: "default" | "skewed";
};

export function FadeInDiv({
  className,
  active,
  variant = "default",
}: FadeInDivProps): React.JSX.Element | null {
  return (
    <div className="relative w-full h-full">
      {variant === "default" ? (
        <div className={cn("w-full h-full", className)}>
          {active.content}
        </div>
      ) : (
        <div className={cn("w-full h-full", className)}>
          <div className="-ml-2 flex items-center justify-between border gap-2 -skew-x-12 pl-3 pr-1.5">
            {active.content}
          </div>
        </div>
      )}
    </div>
  );
};
