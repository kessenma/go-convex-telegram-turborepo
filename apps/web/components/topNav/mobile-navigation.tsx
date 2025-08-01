"use client";

import { motion } from "framer-motion";
import {
  Blocks,
  Bot,
  BotMessageSquare,
  ExternalLink,
  HouseWifi,
  Info,
  Library,
  Menu,
  MessageSquareShare,
  MessageSquareText,
  MessagesSquare,
  Upload,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ExpandableCard } from "../../components/ui/expandable-card-reusable";
import { useOutsideClick } from "../../hooks/use-outside-clicks";
import { renderIcon, fixComponentReturnType } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { Notifications } from "./Notifications";
import { Settings } from "../settings/0Settings";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

// Content-aware L-shape component for mobile navigation
function ContentAwareLShape({
  pathname,
  navItems,
}: {
  pathname: string;
  navItems: NavItem[];
}) {
  const [menuDimensions, setMenuDimensions] = useState({
    width: 0,
    activeItemTop: 0,
  });
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuContainerRef.current) {
      const container = menuContainerRef.current.closest(".relative");
      if (container) {
        const rect = container.getBoundingClientRect();

        // Find the active item's position
        const activeButton = container.querySelector(".text-cyan-500");
        let activeTop = 0;

        if (activeButton) {
          const activeRect = activeButton.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          activeTop =
            activeRect.top - containerRect.top + activeRect.height / 2;
        }

        setMenuDimensions({
          width: rect.width - 16, // Account for padding
          activeItemTop: activeTop,
        });
      }
    }
  }, []);

  return (
    <div ref={menuContainerRef}>
      {/* Horizontal line - full width of content */}
      <motion.div
        className="absolute -top-2 right-0 h-[2px] bg-white/70 z-[100]"
        initial={{ width: 0, opacity: 0 }}
        animate={{
          width: menuDimensions.width || "calc(100% + 1px)",
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.4,
          opacity: { duration: 0.2 },
        }}
      />

      {/* Vertical line - to active item */}
      <motion.div
        className="absolute left-0 -top-2 w-[2px] bg-white/70 z-[100]"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: menuDimensions.activeItemTop || 100,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: 0.4,
          opacity: { duration: 0.2, delay: 0.4 },
        }}
      />
    </div>
  );
}

export default function MobileNavigation(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update button position when opening
  useEffect(() => {
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isMenuOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  // Close menu when pathname changes (navigation occurs)
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  // Navigation items organized by category to match desktop navigation
  const navItems: readonly NavItem[] = [
    // Home section
    { href: "/", label: "Dashboard", icon: HouseWifi },
    { href: "/about", label: "About", icon: Info },
    { href: "/architecture", label: "Architecture", icon: Blocks },

    // Messages section
    { href: "/messages", label: "All Messages", icon: MessageSquareText },
    { href: "/threads", label: "Message Threads", icon: MessagesSquare },
    { href: "/send", label: "Send Message", icon: MessageSquareShare },

    // RAG section
    { href: "/RAG-upload", label: "Upload", icon: Upload },
    { href: "/RAG-data", label: "Data", icon: Library },
    { href: "/RAG-chat", label: "Chat", icon: BotMessageSquare },
    { href: "/ai-chat", label: "AI Chat (Vercel SDK)", icon: Bot },

    // Console section
    {
      href: "/convex-web-console-directions",
      label: "Connection Guide",
      icon: Info,
    },
    {
      href: `http://localhost:${process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || "6791"}`,
      label: "Open Console",
      icon: ExternalLink,
    },
  ];

  const handleNavClick = (href: string) => {
    // Handle external links
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
    setIsMenuOpen(false);
  };

  useOutsideClick(menuRef, (_event: MouseEvent | TouchEvent) =>
    setIsMenuOpen(false)
  );

  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        {/* Logo */}
        <div
          className="flex gap-2 items-center font-semibold text-cyan-200 cursor-pointer"
          onClick={() => router.push("/")}
        >
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span
            className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white transition-opacity duration-200 ${isScrolled ? "overflow-hidden w-0 opacity-0" : "opacity-100"}`}
          >
            Bot Manager
          </span>
        </div>

        {/* Right side - Notifications, Settings, and Hamburger */}
        <div className="flex gap-2 items-center">
          <div
            className={cn(
              "transition-colors duration-200",
              isScrolled && "rounded-lg bg-slate-950"
            )}
          >
            <Notifications />
          </div>
          <div
            className={cn(
              "transition-colors duration-200",
              isScrolled && "rounded-lg bg-slate-900"
            )}
          >
            <Settings />
          </div>
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-slate-700 bg-slate-800/50"
            >
              {renderIcon(Menu, { className: "w-5 h-5 text-white" })}
            </button>

            <ExpandableCard
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              buttonPosition={buttonPosition}
              liquidGlass={true}
              layoutId={`mobile-menu-${id}`}
              ref={menuRef}
              width="w-80"
              zIndex={60}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-lg transition-colors hover:bg-slate-800"
                  >
                    {renderIcon(X, { className: "w-5 h-5 text-gray-400" })}
                  </button>
                </div>

                <motion.div
                  className="relative space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                >
                  {/* Content-aware L-shaped line animation */}
                  {isMenuOpen && (
                    <ContentAwareLShape
                      pathname={pathname || ''}
                      navItems={[...navItems]}
                    />
                  )}
                  {/* Home Section */}
                  <motion.div
                    className="mb-3"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <motion.div
                      className="px-2 mb-1 text-xs font-semibold uppercase text-cyan-500/70"
                      variants={{
                        hidden: { opacity: 0, y: -5 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      Home
                    </motion.div>
                    {navItems.slice(0, 3).map((item, index) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <motion.button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex relative gap-2 items-center px-2 py-2 w-full text-sm text-left rounded-lg transition-colors",
                            isActive
                              ? "text-cyan-500 bg-slate-900"
                              : "text-white/80 hover:text-cyan-300 hover:bg-slate-900/50"
                          )}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            {renderIcon(IconComponent, {
                              className: "w-4 h-4",
                            })}
                          </motion.span>
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {/* Messages Section */}
                  <motion.div
                    className="mb-3"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <motion.div
                      className="px-2 mb-1 text-xs font-semibold uppercase text-cyan-500/70"
                      variants={{
                        hidden: { opacity: 0, y: -5 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      Messages
                    </motion.div>
                    {navItems.slice(3, 6).map((item, index) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <motion.button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex relative gap-2 items-center px-2 py-2 w-full text-sm text-left rounded-lg transition-colors",
                            isActive
                              ? "text-cyan-500 bg-slate-900"
                              : "text-white/80 hover:text-cyan-300 hover:bg-slate-900/50"
                          )}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            {renderIcon(IconComponent, {
                              className: "w-4 h-4",
                            })}
                          </motion.span>
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {/* RAG Section */}
                  <motion.div
                    className="mb-3"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <motion.div
                      className="px-2 mb-1 text-xs font-semibold uppercase text-cyan-500/70"
                      variants={{
                        hidden: { opacity: 0, y: -5 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      RAG
                    </motion.div>
                    {navItems.slice(6, 10).map((item, index) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <motion.button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex relative gap-2 items-center px-2 py-2 w-full text-sm text-left rounded-lg transition-colors",
                            isActive
                              ? "text-cyan-500 bg-slate-900"
                              : "text-white/80 hover:text-cyan-300 hover:bg-slate-900/50"
                          )}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            {renderIcon(IconComponent, {
                              className: "w-4 h-4",
                            })}
                          </motion.span>
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {/* Console Section */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <motion.div
                      className="px-2 mb-1 text-xs font-semibold uppercase text-cyan-500/70"
                      variants={{
                        hidden: { opacity: 0, y: -5 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      Console
                    </motion.div>
                    {navItems.slice(10).map((item, index) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href;
                      const _isExternal = item.href.startsWith("http");

                      return (
                        <motion.button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "flex relative gap-2 items-center px-2 py-2 w-full text-sm text-left rounded-lg transition-colors",
                            isActive
                              ? "text-cyan-500 bg-slate-900"
                              : "text-white/80 hover:text-cyan-300 hover:bg-slate-900/50"
                          )}
                          variants={{
                            hidden: { opacity: 0, x: -10 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          {isActive && (
                            <motion.div
                              className="absolute left-0 top-0 w-[2px] h-full bg-white/70 z-[100]"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "100%", opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                opacity: { duration: 0.2 },
                              }}
                            />
                          )}
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            {renderIcon(IconComponent, {
                              className: "w-4 h-4",
                            })}
                          </motion.span>
                          <span className="font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </div>
            </ExpandableCard>
          </div>
        </div>
      </div>
    </nav>
  );
}
