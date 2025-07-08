// Type fixes for React 19 compatibility issues

declare module 'react' {
  namespace JSX {
    interface ElementType {
      (props: any): ReactNode | Promise<ReactNode>;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
  }
  interface ReactPortal {
    children?: ReactNode;
  }
  
  // Fix ReactNode type conflicts
  type ReactNode = 
    | React.ReactElement
    | string
    | number
    | React.ReactFragment
    | React.ReactPortal
    | boolean
    | null
    | undefined;
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



export {};
