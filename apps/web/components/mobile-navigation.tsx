"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bot, HouseWifi, MessagesSquare, Upload, Menu, X, Info, MessageSquareShare, MessageSquareText, BotMessageSquare, Library } from 'lucide-react';
import { renderIcon } from "../lib/icon-utils";
import { Settings } from "./Settings";
import { Notifications } from "./Notifications";
import { useOutsideClick } from "../hooks/use-outside-clicks";
import { cn } from "../lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function MobileNavigation(): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  // Update button position when opening
  useEffect(() => {
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
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
  }, [pathname]);

  // Simple navigation items - just direct links
  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: HouseWifi },
    { href: "/about", label: "About", icon: Info },
    { href: "/messages", label: "All Messages", icon: MessageSquareText },
    { href: "/threads", label: "Message Threads", icon: MessagesSquare },
    { href: "/send", label: "Send Message", icon: MessageSquareShare },
    { href: "/RAG-upload", label: "RAG Upload", icon: Upload },
    { href: "/RAG-data", label: "RAG Data", icon: Library },
    { href: "/RAG-chat", label: "RAG Chat", icon: BotMessageSquare },
    { href: "/convex-web-console-directions", label: "Console Guide", icon: Info },
  ];

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  useOutsideClick(menuRef, (event: MouseEvent | TouchEvent) => setIsMenuOpen(false));

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-sm bg-slate-950/95 border-white/10">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        {/* Logo */}
        <div 
          className="flex gap-2 items-center font-semibold text-cyan-200 cursor-pointer" 
          onClick={() => router.push('/')}
        >
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">
            Bot Manager
          </span>
        </div>
        
        {/* Right side - Notifications, Settings, and Hamburger */}
        <div className="flex gap-2 items-center">
          <Notifications />
          <Settings />
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-slate-700 bg-slate-800/50"
            >
              {renderIcon(Menu, { className: "w-5 h-5 text-white" })}
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 backdrop-blur-sm bg-black/20"
                  />
                  <motion.div
                    ref={menuRef}
                    layoutId={`mobile-menu-${id}`}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    style={{
                      position: 'fixed',
                      top: buttonPosition.top,
                      right: buttonPosition.right,
                      zIndex: 60
                    }}
                    className="w-80 bg-gradient-to-b rounded-xl border shadow-2xl backdrop-blur-sm from-slate-900 to-slate-950 border-white/10"
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

                      <div className="space-y-2">
                        {navItems.map((item) => {
                          const IconComponent = item.icon;
                          const isActive = pathname === item.href;
                          
                          return (
                            <button
                              key={item.href}
                              onClick={() => handleNavClick(item.href)}
                              className={cn(
                                "flex gap-3 items-center p-3 w-full text-left rounded-lg transition-colors",
                                isActive 
                                  ? 'text-cyan-500 bg-slate-900' 
                                  : 'text-white/80 hover:text-cyan-300 hover:bg-slate-900/50'
                              )}
                            >
                              {renderIcon(IconComponent, { className: "w-5 h-5" })}
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
