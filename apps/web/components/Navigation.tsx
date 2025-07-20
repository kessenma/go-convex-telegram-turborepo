"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Blocks,
  Bot,
  BotMessageSquare,
  ChevronDown,
  DatabaseZapIcon,
  ExternalLink,
  HouseWifi,
  Info,
  Layers,
  Library,
  MessageSquareShare,
  MessageSquareText,
  MessagesSquare,
  Upload,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "../generated-convex";
import { useConvexStatus, useLLMStatus } from "../hooks/use-status-operations";
import { renderIcon } from "../lib/icon-utils";
import MobileNavigation from "./mobile-navigation";
import { Notifications } from "./Notifications";
import { Settings } from "./Settings";
import { StatusIndicator } from "./ui/status-indicator";

export default function Navigation(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownDimensions, setDropdownDimensions] = useState<{
    [key: string]: { height: number; width: number };
  }>({});
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const _id = useId();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const shouldBeMobile = width < 768; // md breakpoint for easier testing
      console.log("Screen width:", width, "Should be mobile:", shouldBeMobile);
      setIsMobile(shouldBeMobile);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Debug effect to track mobile state changes
  useEffect(() => {
    console.log("Navigation: isMobile changed to:", isMobile);
  }, [isMobile]);

  interface NavItem {
    href?: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    dropdown?: {
      href: string;
      label: string;
      external?: boolean;
      icon?: React.FC<{ className?: string }>;
    }[];
  }

  // Fetch real data from Convex
  const messages = useQuery(api.messages.getAllMessages, { limit: 100 });
  const threadStats = useQuery(api.threads.getThreadStats);
  const documentStats = useQuery(api.documents.getDocumentStats);
  const { status: llmStatus } = useLLMStatus();
  const { status: convexStatus } = useConvexStatus();

  const messageCount = messages?.length || 0;
  const threadCount = threadStats?.totalThreads || 0;

  const dashboardPort = process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || "6791";
  const dashboardUrl = `http://localhost:${dashboardPort}`;

  const navItems: NavItem[] = [
    {
      label: "Home",
      icon: HouseWifi as React.FC<{ className?: string }>,
      dropdown: [
        {
          href: "/",
          label: "Dashboard",
          icon: HouseWifi as React.FC<{ className?: string }>,
        },
        {
          href: "/about",
          label: "About",
          icon: Info as React.FC<{ className?: string }>,
        },
        {
          href: "/architecture",
          label: "Architecture",
          icon: Blocks as React.FC<{ className?: string }>,
        },
      ],
    },
    {
      label: "Messages",
      icon: MessagesSquare as React.FC<{ className?: string }>,
      dropdown: [
        {
          href: "/messages",
          label: "All Messages",
          icon: MessageSquareText as React.FC<{ className?: string }>,
        },
        {
          href: "/threads",
          label: "Message Threads",
          icon: MessagesSquare as React.FC<{ className?: string }>,
        },
        {
          href: "/send",
          label: "Send Message",
          icon: MessageSquareShare as React.FC<{ className?: string }>,
        },
      ],
    },
    {
      label: "RAG",
      icon: Layers as React.FC<{ className?: string }>,
      dropdown: [
        {
          href: "/RAG-upload",
          label: "Upload",
          icon: Upload as React.FC<{ className?: string }>,
        },
        {
          href: "/RAG-data",
          label: "Data",
          icon: Library as React.FC<{ className?: string }>,
        },
        {
          href: "/RAG-chat",
          label: "Chat",
          icon: BotMessageSquare as React.FC<{ className?: string }>,
        },
      ],
    },
    {
      label: "Console",
      icon: DatabaseZapIcon as React.FC<{ className?: string }>,
      dropdown: [
        {
          href: "/convex-web-console-directions",
          label: "Connection Guide",
          icon: Info as React.FC<{ className?: string }>,
        },
        {
          href: dashboardUrl,
          label: "Open Console",
          external: true,
          icon: ExternalLink as React.FC<{ className?: string }>,
        },
      ],
    },
  ];

  // Check if current path matches any nav item
  const isActiveItem = (item: NavItem) => {
    if (item.href === pathname) return true;
    if (item.dropdown) {
      return item.dropdown.some(
        (dropdownItem) => dropdownItem.href === pathname
      );
    }
    return false;
  };

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      router.push(item.href);
    }
    // Don't do anything if there's no href (dropdown items)
  };

  const handleDropdownClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
    setHoveredItem(null);
  };

  // Return mobile navigation for small screens
  if (isMobile) {
    console.log("Navigation: Rendering MobileNavigation");
    return <MobileNavigation />;
  }

  console.log("Navigation: Rendering Desktop Navigation");

  // Return desktop navigation for larger screens
  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        <div
          className="flex gap-2 items-center font-semibold text-cyan-200 cursor-pointer"
          onClick={() => router.push("/")}
        >
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span
            className={`text-lg font-bold bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent hidden ${isScrolled ? "sm:hidden" : "sm:inline"}`}
          >
            Bot Manager
          </span>
        </div>

        <div className="flex gap-1 items-center">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isConsole = item.label === "Console";
            const isMessages = item.label === "Messages";
            const isRAG = item.label === "RAG";
            const isHome = item.label === "Home";
            const _isAbout = item.label === "About";
            const _isArchitecture = item.label === "Architecture";
            const hasDropdown = Boolean(item.dropdown);
            const isActive = isActiveItem(item);
            const isHovered = hoveredItem === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={(e) => {
                  // Only hide if we're not moving to the dropdown
                  const relatedTarget = e.relatedTarget as HTMLElement | null;
                  if (!relatedTarget?.closest?.("[data-dropdown]")) {
                    setHoveredItem(null);
                  }
                }}
              >
                <button
                  onClick={() => handleItemClick(item)}
                  className={`relative px-3 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2 ${
                    isActive
                      ? "text-cyan-500 bg-slate-950"
                      : "text-white/80 hover:text-cyan-300"
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavItem"
                      transition={{
                        type: "spring",
                        bounce: 0.3,
                        duration: 0.6,
                      }}
                      className="absolute inset-0 rounded-lg bg-slate-900"
                    />
                  )}

                  <span className="flex relative gap-2 items-center">
                    {renderIcon(IconComponent as any, { className: "w-4 h-4" })}
                    <span
                      className={`hidden md:inline ${isScrolled && !isActive ? "lg:hidden" : ""}`}
                    >
                      {item.label}
                    </span>
                    {isMessages && messageCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                        {messageCount}
                      </span>
                    )}
                    {isRAG && (
                      <StatusIndicator
                        status={
                          llmStatus.status === "healthy" && llmStatus.ready
                            ? "connected"
                            : llmStatus.status === "error"
                              ? "disconnected"
                              : "connecting"
                        }
                        size="sm"
                        showLabel={false}
                      />
                    )}
                    {isConsole && (
                      <StatusIndicator
                        status={convexStatus.status}
                        size="sm"
                        showLabel={false}
                      />
                    )}
                    {hasDropdown &&
                      renderIcon(ChevronDown, { className: "w-3 h-3" })}
                  </span>
                </button>

                {/* Content-aware dropdown menu with L-shape animation */}
                <AnimatePresence>
                  {(isMessages ||
                    item.label === "Console" ||
                    isRAG ||
                    isHome) &&
                    isHovered &&
                    item.dropdown && (
                      <>
                        <motion.div
                          ref={(el) => {
                            if (el) {
                              dropdownRefs.current[item.label] = el;
                              // Measure content after render
                              setTimeout(() => {
                                const rect = el.getBoundingClientRect();
                                setDropdownDimensions((prev) => ({
                                  ...prev,
                                  [item.label]: {
                                    height: rect.height,
                                    width: rect.width,
                                  },
                                }));
                              }, 0);
                            }
                          }}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden absolute left-0 top-full z-[90] mt-1 w-48 rounded-lg shadow-lg bg-slate-950"
                          data-dropdown
                          onMouseEnter={() => setHoveredItem(item.label)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          {item.dropdown.map((dropdownItem, _index) => (
                            <button
                              key={dropdownItem.href}
                              onClick={() =>
                                handleDropdownClick(
                                  dropdownItem.href,
                                  dropdownItem.external
                                )
                              }
                              className={`flex items-center justify-between px-4 py-2 w-full text-left transition-colors ml-1 ${
                                dropdownItem.href === pathname
                                  ? "text-cyan-500 bg-slate-900/50"
                                  : "text-white/80 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <div className="flex gap-2 items-center">
                                {dropdownItem.icon &&
                                  renderIcon(dropdownItem.icon as any, {
                                    className: "w-3 h-3",
                                  })}
                                {dropdownItem.label}
                              </div>
                              {isMessages &&
                                dropdownItem.href === "/messages" &&
                                messageCount > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                                    {messageCount}
                                  </span>
                                )}
                              {isMessages &&
                                dropdownItem.href === "/threads" &&
                                threadCount > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                                    {threadCount}
                                  </span>
                                )}
                              {isRAG &&
                                dropdownItem.href === "/RAG-data" &&
                                (documentStats?.totalDocuments || 0) > 0 && (
                                  <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                                    {documentStats?.totalDocuments || 0}
                                  </span>
                                )}
                            </button>
                          ))}
                        </motion.div>

                        {/* Content-aware animated vertical line */}
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height:
                              dropdownDimensions[item.label]?.height ||
                              item.dropdown.length * 40,
                            opacity: 1,
                          }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            opacity: { duration: 0.2 },
                          }}
                          className="absolute left-4 top-full z-[100] w-[1px] bg-white/70"
                          style={{ pointerEvents: "none" }}
                        />

                        {/* Content-aware animated horizontal line */}
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{
                            width: dropdownDimensions[item.label]?.width || 192, // 192px = w-48
                            opacity: 1,
                          }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            delay: 0.2,
                            opacity: { duration: 0.2, delay: 0.2 },
                          }}
                          className="absolute left-4 z-[100] h-[1px] bg-white/70"
                          style={{
                            pointerEvents: "none",
                            top: `calc(100% + ${dropdownDimensions[item.label]?.height || item.dropdown.length * 40}px + 4px)`,
                          }}
                        />
                      </>
                    )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1 items-center">
          <Notifications />
          <Settings />
        </div>
      </div>
    </nav>
  );
}
