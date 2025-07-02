// Type fixes for React 19 compatibility issues

declare module 'react' {
  namespace JSX {
    interface ElementType {
      (props: any): ReactNode | Promise<ReactNode>;
    }
  }
}

// Fix for Lucide React icons
declare module 'lucide-react' {
  export interface LucideProps {
    className?: string;
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    [key: string]: any;
  }
  
  export type LucideIcon = React.FC<LucideProps>;
}

// Fix for Next.js Link component
declare module 'next/link' {
  import { ComponentProps } from 'react';
  
  interface LinkProps {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    legacyBehavior?: boolean;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  const Link: React.FC<LinkProps>;
  export default Link;
}

export {};
