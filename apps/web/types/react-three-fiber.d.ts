import * as THREE from 'three'
import { ReactThreeFiber } from '@react-three/fiber'

// Extend global JSX namespace to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactThreeFiber.IntrinsicElements {
      // Core elements
      group: any
      mesh: any
      primitive: any
      
      // Geometries
      boxGeometry: any
      sphereGeometry: any
      planeGeometry: any
      cylinderGeometry: any
      coneGeometry: any
      circleGeometry: any
      ringGeometry: any
      torusGeometry: any
      edgesGeometry: any
      
      // Materials
      meshBasicMaterial: any
      meshStandardMaterial: any
      meshPhongMaterial: any
      meshLambertMaterial: any
      lineBasicMaterial: any
      lineDashedMaterial: any
      pointsMaterial: any
      
      // Lights
      ambientLight: any
      directionalLight: any
      pointLight: any
      spotLight: any
      hemisphereLight: any
      
      // Other elements
      line: any
      points: any
      sprite: any
      instancedMesh: any
      lineSegments: any
      
      // Cameras
      perspectiveCamera: any
      orthographicCamera: any
      
      // Helpers
      axesHelper: any
      gridHelper: any
      
      // Textures
      texture: any
      canvasTexture: any
      
      // Audio
      audio: any
      positionalAudio: any
    }
  }
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
  
  export const Line: React.FC<LineProps>
  export const Text: React.FC<TextProps>
}

export {}
