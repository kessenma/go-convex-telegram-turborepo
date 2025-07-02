"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "./ui/tabs";
import { Bot, HouseWifi, MessageSquareCode, MessagesSquare, MessageSquareShare, DatabaseZapIcon, Upload } from "lucide-react";
import { renderIcon } from "../lib/icon-utils";

export default function Navigation(): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

interface NavItem {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: HouseWifi as React.FC<{ className?: string }> },
    { href: "/messages", label: "Messages", icon: MessageSquareCode as React.FC<{ className?: string }> },
    { href: "/threads", label: "Threads", icon: MessagesSquare as React.FC<{ className?: string }> },
    { href: "/send", label: "Send Message", icon: MessageSquareShare as React.FC<{ className?: string }> },
    { href: "/RAG-upload", label: "RAG Upload", icon: Upload as React.FC<{ className?: string }> },
    { href: "/convex-web-console-directions", label: "Console", icon: DatabaseZapIcon as React.FC<{ className?: string }> },
  ];

  // Convert nav items to tabs format
  const tabs = navItems.map((item) => {
    const IconComponent = item.icon;
    return {
      title: (
        <div className="flex gap-2 items-center">
          {renderIcon(IconComponent as any, { className: "w-4 h-4" })}
          <span className={`hidden md:inline ${isScrolled && item.href !== pathname ? 'lg:hidden' : ''}`}>{item.label}</span>
        </div>
      ),
      value: item.href,
      content: (
        <div className="flex gap-2 items-center">
          {renderIcon(IconComponent as any, { className: "w-4 h-4" })}
          <span className="hidden md:inline">{item.label}</span>
        </div>
      ),
    };
  });

  // Find current active tab based on pathname
  const activeTabIndex = navItems.findIndex(item => item.href === pathname);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        <div className="flex gap-2 items-center font-semibold text-blue-500">
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span className={`text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-100 bg-clip-text text-transparent hidden ${isScrolled ? 'sm:hidden' : 'sm:inline'}`}>
            Bot Manager
          </span>
        </div>
        
        <div className="flex items-center">
          {React.createElement(Tabs as any, {
            tabs: tabs,
            activeTabIndex: activeTabIndex,
            containerClassName: "flex-1 justify-center",
            activeTabClassName: "bg-blue-500 text-white rounded-lg",
            tabClassName: "text-white/80 hover:text-blue-300 transition-colors duration-200 font-medium px-3 py-2 rounded-lg",
            contentClassName: "hidden",
            onTabChange: (tab: any) => {
              router.push(tab.value);
            }
          })}
        </div>

        <div className="flex items-center">
          {/* Database icon moved to nav items */}
        </div>
      </div>
    </nav>
  );
}
