"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { StatusIndicator } from "./ui/status-indicator";
import { useLLMStatus } from "../hooks/use-llm-status";
import { useConvexStatus } from "../hooks/use-convex-status";
import { Bot, HouseWifi, MessagesSquare, DatabaseZapIcon, Upload, Layers, ChevronDown, ExternalLink, Info, MessageSquareShare, MessageSquareText, BotMessageSquare, Library } from "lucide-react";
import { renderIcon } from "../lib/icon-utils";
import { motion } from "motion/react";
import { Settings } from "./Settings";

export default function Navigation(): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

interface NavItem {
  href?: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  dropdown?: { href: string; label: string; external?: boolean; icon?: React.FC<{ className?: string }> }[];
}

  // Fetch real data from Convex
  const messages = useQuery(api.messages.getAllMessages, { limit: 100 });
  const threadStats = useQuery(api.threads.getThreadStats);
  const documentStats = useQuery(api.documents.getDocumentStats);
  const { llmStatus } = useLLMStatus();
  const { convexStatus } = useConvexStatus();
  
  const messageCount = messages?.length || 0;
  const threadCount = threadStats?.totalThreads || 0;
  
  const dashboardPort = process.env.NEXT_PUBLIC_CONVEX_DASHBOARD_PORT || '6791';
  const dashboardUrl = `http://localhost:${dashboardPort}`;

  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: HouseWifi as React.FC<{ className?: string }> },
    { 
      label: "Messages", 
      icon: MessagesSquare as React.FC<{ className?: string }>,
      dropdown: [
        { href: "/messages", label: "All Messages", icon: MessageSquareText as React.FC<{ className?: string }> },
        { href: "/threads", label: "Message Threads", icon: MessagesSquare as React.FC<{ className?: string }> },
        { href: "/send", label: "Send Message", icon: MessageSquareShare as React.FC<{ className?: string }> }
      ]
    },
    { 
      label: "RAG", 
      icon: Layers as React.FC<{ className?: string }>,
      dropdown: [
        { href: "/RAG-upload", label: "Upload", icon: Upload as React.FC<{ className?: string }> },
        { href: "/RAG-data", label: "Data", icon: Library as React.FC<{ className?: string }> },
        { href: "/RAG-chat", label: "Chat", icon: BotMessageSquare as React.FC<{ className?: string }> }
      ]
    },
    { 
      label: "Console", 
      icon: DatabaseZapIcon as React.FC<{ className?: string }>,
      dropdown: [
        { href: "/convex-web-console-directions", label: "Connection Guide", icon: Info as React.FC<{ className?: string }> },
        { href: dashboardUrl, label: "Open Console", external: true, icon: ExternalLink as React.FC<{ className?: string }> }
      ]
    },
  ];

  // Check if current path matches any nav item
  const isActiveItem = (item: NavItem) => {
    if (item.href === pathname) return true;
    if (item.dropdown) {
      return item.dropdown.some(dropdownItem => dropdownItem.href === pathname);
    }
    return false;
  };

  const handleItemClick = (item: NavItem) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleDropdownClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
    setHoveredItem(null);
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-50">
      <div className="flex justify-between items-center px-4 mx-auto max-w-6xl h-16">
        <div className="flex gap-2 items-center font-semibold text-cyan-500">
          {renderIcon(Bot, { className: "w-6 h-6" })}
          <span className={`text-lg font-bold bg-gradient-to-r from-cyan-500 to-cyan-100 bg-clip-text text-transparent hidden ${isScrolled ? 'sm:hidden' : 'sm:inline'}`}>
            Bot Manager
          </span>
        </div>
        
        <div className="flex gap-1 items-center">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isConsole = item.label === "Console";
            const isMessages = item.label === "Messages";
            const isRAG = item.label === "RAG";
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
                   if (!relatedTarget?.closest?.('[data-dropdown]')) {
                     setHoveredItem(null);
                   }
                 }}
               >
                <button
                  onClick={() => handleItemClick(item)}
                  className={`relative px-3 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2 ${
                    isActive 
                      ? 'text-cyan-500 bg-slate-900' 
                      : 'text-white/80 hover:text-cyan-300'
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavItem"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      className="absolute inset-0 rounded-lg bg-slate-900"
                    />
                  )}
                  
                  <span className="flex relative gap-2 items-center">
                    {renderIcon(IconComponent as any, { className: "w-4 h-4" })}
                    <span className={`hidden md:inline ${isScrolled && !isActive ? 'lg:hidden' : ''}`}>
                      {item.label}
                    </span>
                    {isMessages && messageCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                        {messageCount}
                      </span>
                    )}
                    {isRAG && (
                      <StatusIndicator 
                        status={llmStatus.status === 'healthy' && llmStatus.ready ? 'connected' : 
                               llmStatus.status === 'error' ? 'disconnected' : 'connecting'} 
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
                    {hasDropdown && renderIcon(ChevronDown, { className: "w-3 h-3" })}
                  </span>
                </button>
                
                {/* Dropdown with buffer zone */}
                 {(isMessages || item.label === "Console" || isRAG) && isHovered && item.dropdown && (
                   <>
                     {/* Invisible buffer zone */}
                     <div className="absolute left-0 top-full z-40 w-48 h-4" />
                     <motion.div
                       initial={{ opacity: 0, scale: 0.95, y: -10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: -10 }}
                       transition={{ duration: 0.2 }}
                       className="absolute left-0 top-full z-50 mt-4 w-48 rounded-lg border shadow-lg backdrop-blur-sm bg-black/90 border-white/10"
                       data-dropdown
                       onMouseEnter={() => setHoveredItem(item.label)}
                       onMouseLeave={() => setHoveredItem(null)}
                     >
                       {item.dropdown.map((dropdownItem, index) => (
                         <button
                           key={dropdownItem.href}
                           onClick={() => handleDropdownClick(dropdownItem.href, dropdownItem.external)}
                           className={`flex items-center justify-between px-4 py-2 w-full text-left transition-colors ${
                             dropdownItem.href === pathname 
                               ? 'text-cyan-500 bg-slate-900/50' 
                               : 'text-white/80 hover:text-white hover:bg-white/10'
                           } ${
                             index === 0 ? 'rounded-t-lg' : ''
                           } ${
                             index === item.dropdown!.length - 1 ? 'rounded-b-lg' : ''
                           }`}
                         >
                           <div className="flex gap-2 items-center">
                             {dropdownItem.icon && renderIcon(dropdownItem.icon as any, { className: "w-3 h-3" })}
                             {dropdownItem.label}
                           </div>
                           {isMessages && dropdownItem.href === "/messages" && messageCount > 0 && (
                             <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                               {messageCount}
                             </span>
                           )}
                           {isMessages && dropdownItem.href === "/threads" && threadCount > 0 && (
                             <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                               {threadCount}
                             </span>
                           )}
                           {isRAG && dropdownItem.href === "/RAG-data" && (documentStats?.totalDocuments || 0) > 0 && (
                             <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-slate-950 rounded-full">
                               {documentStats?.totalDocuments || 0}
                             </span>
                           )}
                         </button>
                       ))}
                     </motion.div>
                   </>
                 )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center">
          <Settings />
        </div>
      </div>
    </nav>
  );
}
