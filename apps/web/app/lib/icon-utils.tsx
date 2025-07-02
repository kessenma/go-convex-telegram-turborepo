import React from 'react';
import type { LucideIcon } from 'lucide-react';

// Utility function to render Lucide icons with proper typing for React 19
export function renderIcon(IconComponent: LucideIcon, props: { className?: string; [key: string]: any }): React.ReactElement {
  return React.createElement(IconComponent as any, props);
}

// Higher-order component to wrap Lucide icons
export function createIconComponent(IconComponent: LucideIcon) {
  return React.forwardRef<SVGSVGElement, { className?: string; [key: string]: any }>((props, ref) => {
    return React.createElement(IconComponent as any, { ...props, ref });
  });
}

// Utility to fix component return types for React 19
export function fixComponentReturnType<T extends (...args: any[]) => React.ReactNode>(
  component: T
): (...args: Parameters<T>) => React.ReactElement | null {
  return (...args) => {
    const result = component(...args);
    if (React.isValidElement(result)) {
      return result;
    }
    return null;
  };
}
