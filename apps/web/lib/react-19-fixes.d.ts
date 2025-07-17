// Type fixes for React 19 compatibility issues

declare module 'react' {
  namespace JSX {
    interface ElementType {
      (props: any): ReactNode | Promise<ReactNode>;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
    interface IntrinsicElements {
      // React Three Fiber elements
      group: any;
      mesh: any;
      primitive: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      circleGeometry: any;
      ringGeometry: any;
      torusGeometry: any;
      edgesGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshLambertMaterial: any;
      lineBasicMaterial: any;
      lineDashedMaterial: any;
      pointsMaterial: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      line: any;
      points: any;
      sprite: any;
      instancedMesh: any;
      lineSegments: any;
      perspectiveCamera: any;
      orthographicCamera: any;
      axesHelper: any;
      gridHelper: any;
      texture: any;
      canvasTexture: any;
      audio: any;
      positionalAudio: any;
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

// Fix React 19 ReactNode compatibility for React Three Fiber components
declare module '@react-three/drei' {
  import { ReactNode } from 'react'
  
  export interface LineProps {
    points: any[]
    color?: any
    transparent?: boolean
    opacity?: number
    lineWidth?: number
    [key: string]: any
  }
  
  export interface TextProps {
    position?: [number, number, number]
    fontSize?: number
    color?: string | number
    anchorX?: string
    anchorY?: string
    maxWidth?: number
    children?: ReactNode
    [key: string]: any
  }
  
  export const Line: (props: LineProps) => ReactNode | Promise<ReactNode>
  export const Text: (props: TextProps) => ReactNode | Promise<ReactNode>
}

export {};
