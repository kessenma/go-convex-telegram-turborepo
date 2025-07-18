"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bot, HouseWifi, MessagesSquare, Upload, Menu, X, Info, MessageSquareShare, MessageSquareText, BotMessageSquare, Library, Blocks, DatabaseZapIcon, Layers, ExternalLink } from 'lucide-react';
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Navigation items organized by category to match desktop navigation
  const navItems: NavItem[] = [
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
    
    // Console section
    { href: "/convex-web-console-directions", label: "Connection Guide", icon: Info },
    { href: `http://localhost:${process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || '6791'}`, label: "Open Console", icon: ExternalLink },
  ];

  const handleNavClick = (href: string) => {
    // Handle external links
    if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
    setIsMenuOpen(false);
  };

  useOutsideClick(menuRef, (event: MouseEvent | TouchEvent) => setIsMenuOpen(false));

  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        {/* Logo */}
        <div 
          className="flex gap-2 items-center font-semibold text-cyan-200 cursor-pointer" 
          onClick={() => router.push('/')}
        >
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white transition-opacity duration-200 ${isScrolled ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            Bot Manager
          </span>
        </div>
        
        {/* Right side - Notifications, Settings, and Hamburger */}
        <div className="flex gap-2 items-center">
          <div className={`${isScrolled ? 'bg-slate-950 rounded-lg' : ''} transition-colors duration-200`}>
            <Notifications />
          </div>
          <div className={`${isScrolled ? 'bg-slate-950 rounded-lg' : ''} transition-colors duration-200`}>
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
                    className="w-80 max-h-[90vh] overflow-y-auto bg-gradient-to-b rounded-xl border shadow-2xl backdrop-blur-sm from-slate-900 to-slate-950 border-white/10"
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

                      <div className="space-y-1">
                        {/* Home Section */}
                        <div className="mb-3">
                          <div className="text-xs uppercase text-cyan-500/70 font-semibold mb-1 px-2">Home</div>
                          {navItems.slice(0, 3).map((item) => {
                            const IconComponent = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                  "flex gap-2 items-center py-2 px-2 w-full text-left rounded-lg transition-colors text-sm",
                                  isActive 
                                    ? 'text-cyan-500 bg-slate-900' 
                                    : 'text-white/80 hover:text-cyan-300 hover:bg-slate-900/50'
                                )}
                              >
                                {renderIcon(IconComponent, { className: "w-4 h-4" })}
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Messages Section */}
                        <div className="mb-3">
                          <div className="text-xs uppercase text-cyan-500/70 font-semibold mb-1 px-2">Messages</div>
                          {navItems.slice(3, 6).map((item) => {
                            const IconComponent = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                  "flex gap-2 items-center py-2 px-2 w-full text-left rounded-lg transition-colors text-sm",
                                  isActive 
                                    ? 'text-cyan-500 bg-slate-900' 
                                    : 'text-white/80 hover:text-cyan-300 hover:bg-slate-900/50'
                                )}
                              >
                                {renderIcon(IconComponent, { className: "w-4 h-4" })}
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* RAG Section */}
                        <div className="mb-3">
                          <div className="text-xs uppercase text-cyan-500/70 font-semibold mb-1 px-2">RAG</div>
                          {navItems.slice(6, 9).map((item) => {
                            const IconComponent = item.icon;
                            const isActive = pathname === item.href;
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                  "flex gap-2 items-center py-2 px-2 w-full text-left rounded-lg transition-colors text-sm",
                                  isActive 
                                    ? 'text-cyan-500 bg-slate-900' 
                                    : 'text-white/80 hover:text-cyan-300 hover:bg-slate-900/50'
                                )}
                              >
                                {renderIcon(IconComponent, { className: "w-4 h-4" })}
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Console Section */}
                        <div>
                          <div className="text-xs uppercase text-cyan-500/70 font-semibold mb-1 px-2">Console</div>
                          {navItems.slice(9).map((item) => {
                            const IconComponent = item.icon;
                            const isActive = pathname === item.href;
                            const isExternal = item.href.startsWith('http');
                            
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                  "flex gap-2 items-center py-2 px-2 w-full text-left rounded-lg transition-colors text-sm",
                                  isActive 
                                    ? 'text-cyan-500 bg-slate-900' 
                                    : 'text-white/80 hover:text-cyan-300 hover:bg-slate-900/50'
                                )}
                              >
                                {renderIcon(IconComponent, { className: "w-4 h-4" })}
                                <span className="font-medium">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
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
