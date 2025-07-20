import type { LucideIcon } from "lucide-react";
import React from "react";

// Utility function to render Lucide icons with proper typing for React 19
export function renderIcon(
  IconComponent: LucideIcon,
  props: { className?: string; [key: string]: any }
): React.ReactElement {
  return React.createElement(IconComponent as any, props);
}

// Higher-order component to wrap Lucide icons
export function createIconComponent(IconComponent: LucideIcon) {
  return React.forwardRef<
    SVGSVGElement,
    { className?: string; [key: string]: any }
  >((props, ref) => {
    return React.createElement(IconComponent as any, { ...props, ref });
  });
}

// Type utility to fix React 19 component return types
export function fixComponentReturnType<T extends React.ReactElement>(
  element: T
): T {
  return element as T;
}
