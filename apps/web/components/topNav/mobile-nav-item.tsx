"use client";

import { motion } from "framer-motion";
import type React from "react";
import { renderIcon } from "../../lib/icon-utils";
import { cn } from "../../lib/utils";
import { useNavigationLoading } from "../../contexts/NavigationLoadingContext";
import { LoadingSpinner } from "../ui/loading-spinner";

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: any;
  isActive: boolean;
  onClick: (href: string) => void;
  index: number;
}

export function MobileNavItem({ 
  href, 
  label, 
  icon: IconComponent, 
  isActive, 
  onClick, 
  index 
}: MobileNavItemProps): React.ReactElement {
  const { isLoading, loadingPath } = useNavigationLoading();
  const isItemLoading = isLoading && loadingPath === href;

  return (
    <motion.button
      onClick={() => onClick(href)}
      className={cn(
        "flex relative gap-2 items-center px-2 py-2 w-full text-sm text-left rounded-lg transition-colors",
        isActive
          ? "text-cyan-500 bg-slate-900"
          : "text-white/80 hover:text-cyan-300 hover:bg-slate-900/50",
        isItemLoading && "opacity-75"
      )}
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      whileHover={{ x: isItemLoading ? 0 : 5 }}
      whileTap={{ scale: isItemLoading ? 1 : 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      disabled={isItemLoading}
    >
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 + index * 0.05 }}
      >
        {isItemLoading ? (
          <LoadingSpinner size="sm" use3D={true} />
        ) : (
          renderIcon(IconComponent, {
            className: "w-4 h-4",
          })
        )}
      </motion.span>
      <span className="font-medium">{label}</span>
      {isItemLoading && (
        <motion.div
          className="ml-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-xs text-cyan-400">Loading...</span>
        </motion.div>
      )}
    </motion.button>
  );
}