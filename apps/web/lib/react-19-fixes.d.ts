// React 19 compatibility fixes
declare module 'react' {
  namespace JSX {
    interface ElementType {
      [key: string]: any;
    }
  }
}

// Global type overrides for React 19 compatibility
declare global {
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type JSXElementConstructor<P> = any;
  }
}

// Fix for Lucide React icons
declare module 'lucide-react' {
  export type LucideIcon = React.ComponentType<any>;
}

// Fix for React Three Fiber
declare module '@react-three/fiber' {
  export interface ThreeElements {
    [key: string]: any;
  }
}

// Fix for React Three Drei
declare module '@react-three/drei' {
  export const Html: React.ComponentType<any>;
  export const OrbitControls: React.ComponentType<any>;
  export const ContactShadows: React.ComponentType<any>;
}

// Fix for Convex React
declare module 'convex/react' {
  export const ConvexProvider: React.ComponentType<any>;
}

export {};
