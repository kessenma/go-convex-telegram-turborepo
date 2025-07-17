'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useArchitectureStore } from '../../../stores/architecture-store';
import { useIntersectionObserver } from '../../../hooks/use-intersection-observer';

interface DockerService {
    name: string;
    color: number;
    position: THREE.Vector3;
}

const dockerServices: DockerService[] = [
    {
        name: 'convex-backend',
        color: 0x4da6ff,
        position: new THREE.Vector3(-0.8, 0.8, 0)
    },
    {
        name: 'convex-console',
        color: 0x4da6ff,
        position: new THREE.Vector3(0.8, 0.8, 0)
    },
    {
        name: 'next-js-app',
        color: 0x4da6ff,
        position: new THREE.Vector3(-0.8, -0.8, 0)
    },
    {
        name: 'telegram-bot',
        color: 0x4da6ff,
        position: new THREE.Vector3(0.8, -0.8, 0)
    },
    {
        name: 'vector-convert-llm',
        color: 0x4da6ff,
        position: new THREE.Vector3(0, 0.8, 0.8)
    },
    {
        name: 'lightweight-llm',
        color: 0x4da6ff,
        position: new THREE.Vector3(0, -0.8, -0.8)
    }
];

// Cloud Puff Component
function CloudPuff({ position, scale, stretch }: {
  position: [number, number, number];
  scale: number;
  stretch: { x: number; y: number; z: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  
  useEffect(() => {
    if (meshRef.current && wireframeRef.current) {
      // Create irregular sphere geometry
      const sphereGeometry = new THREE.SphereGeometry(0.4 * scale, 12, 8);
      
      // Apply stretching to make it more organic
      sphereGeometry.scale(stretch.x, stretch.y, stretch.z);
      
      // Add some randomness to vertices for organic feel
      const positionAttribute = sphereGeometry.attributes.position;
      if (positionAttribute) {
        const vertices = positionAttribute.array as Float32Array;
        for (let i = 0; i < vertices.length; i += 3) {
          if (vertices[i] !== undefined) vertices[i]! += (Math.random() - 0.5) * 0.1 * scale;     // x
          if (vertices[i + 1] !== undefined) vertices[i + 1]! += (Math.random() - 0.5) * 0.08 * scale; // y
          if (vertices[i + 2] !== undefined) vertices[i + 2]! += (Math.random() - 0.5) * 0.1 * scale;  // z
        }
        positionAttribute.needsUpdate = true;
      }
      sphereGeometry.computeVertexNormals();
      
      // Update geometries if refs exist
      meshRef.current.geometry = sphereGeometry;
      const sphereEdges = new THREE.EdgesGeometry(sphereGeometry);
      wireframeRef.current.geometry = sphereEdges;
    }
  }, [scale, stretch]);
  
  return (
    React.createElement('group' as any, { position },
      React.createElement('lineSegments' as any, { ref: wireframeRef },
        React.createElement('edgesGeometry' as any),
        React.createElement('lineBasicMaterial' as any, { color: 0x87ceeb, transparent: true, opacity: 0.4 })
      ),
      React.createElement('mesh' as any, { ref: meshRef },
        React.createElement('sphereGeometry' as any, { args: [0.4 * scale, 12, 8] }),
        React.createElement('meshBasicMaterial' as any, { color: 0x87ceeb, transparent: true, opacity: 0.08 })
      )
    )
  );
}

// Cloud Component
function Cloud({ scrollProgress, isVisible }: { scrollProgress: number; isVisible: boolean }) {
  const cloudRef = useRef<THREE.Group>(null);
  const { setCoolifyTimelineVisible, addLog } = useArchitectureStore();
  
  useFrame(() => {
    if (cloudRef.current && scrollProgress > 0.1 && isVisible) {
      cloudRef.current.position.y = 4 + Math.sin(Date.now() * 0.001) * 0.2;
      cloudRef.current.rotation.y += 0.003;
    }
  });
  
  useEffect(() => {
    if (scrollProgress > 0.1 && isVisible) {
      setCoolifyTimelineVisible(true);
    } else {
      setCoolifyTimelineVisible(false);
    }
  }, [scrollProgress, setCoolifyTimelineVisible, addLog, isVisible]);
  
  const cloudPuffs = useMemo(() => [
    // Main body of cloud
    { pos: [0, 0, 0] as [number, number, number], scale: 1.4, stretch: { x: 1.2, y: 0.8, z: 1.0 } },
    { pos: [-1.2, 0.2, 0] as [number, number, number], scale: 1.0, stretch: { x: 0.9, y: 0.7, z: 0.8 } },
    { pos: [1.1, 0.1, 0] as [number, number, number], scale: 0.9, stretch: { x: 0.8, y: 0.6, z: 0.9 } },
    
    // Top puffs
    { pos: [-0.6, 0.8, 0] as [number, number, number], scale: 0.7, stretch: { x: 0.8, y: 0.6, z: 0.7 } },
    { pos: [0.4, 0.9, 0] as [number, number, number], scale: 0.6, stretch: { x: 0.7, y: 0.5, z: 0.6 } },
    { pos: [0, 1.1, 0] as [number, number, number], scale: 0.5, stretch: { x: 0.6, y: 0.4, z: 0.5 } },
    { pos: [-0.2, 1.3, 0] as [number, number, number], scale: 0.4, stretch: { x: 0.5, y: 0.3, z: 0.4 } },
    { pos: [0.3, 1.2, 0] as [number, number, number], scale: 0.35, stretch: { x: 0.4, y: 0.25, z: 0.35 } },
    
    // Side extensions
    { pos: [-1.8, -0.1, 0] as [number, number, number], scale: 0.6, stretch: { x: 0.7, y: 0.5, z: 0.6 } },
    { pos: [1.7, -0.2, 0] as [number, number, number], scale: 0.7, stretch: { x: 0.8, y: 0.6, z: 0.7 } },
    { pos: [-2.1, 0.3, 0] as [number, number, number], scale: 0.5, stretch: { x: 0.6, y: 0.4, z: 0.5 } },
    { pos: [2.0, 0.4, 0] as [number, number, number], scale: 0.55, stretch: { x: 0.65, y: 0.45, z: 0.55 } },
    
    // Bottom wisps
    { pos: [-0.3, -0.6, 0] as [number, number, number], scale: 0.4, stretch: { x: 0.6, y: 0.3, z: 0.4 } },
    { pos: [0.5, -0.5, 0] as [number, number, number], scale: 0.3, stretch: { x: 0.5, y: 0.2, z: 0.3 } },
    { pos: [-0.8, -0.7, 0] as [number, number, number], scale: 0.35, stretch: { x: 0.55, y: 0.25, z: 0.35 } },
    { pos: [0.9, -0.6, 0] as [number, number, number], scale: 0.25, stretch: { x: 0.45, y: 0.15, z: 0.25 } },
    
    // Depth variations
    { pos: [0.2, 0.3, 0.4] as [number, number, number], scale: 0.8, stretch: { x: 0.7, y: 0.6, z: 0.8 } },
    { pos: [-0.4, 0.1, -0.3] as [number, number, number], scale: 0.6, stretch: { x: 0.6, y: 0.5, z: 0.6 } },
    { pos: [0.6, 0.5, -0.4] as [number, number, number], scale: 0.5, stretch: { x: 0.5, y: 0.4, z: 0.5 } },
    { pos: [-0.7, 0.6, 0.3] as [number, number, number], scale: 0.45, stretch: { x: 0.45, y: 0.35, z: 0.45 } },
    
    // Additional small wisps for more organic feel
    { pos: [1.3, 0.7, 0] as [number, number, number], scale: 0.3, stretch: { x: 0.4, y: 0.2, z: 0.3 } },
    { pos: [-1.4, 0.9, 0] as [number, number, number], scale: 0.25, stretch: { x: 0.35, y: 0.15, z: 0.25 } }
  ], []);
  
  const opacity = Math.min(1, scrollProgress * 2);
  
  return (
    React.createElement('group' as any, { ref: cloudRef, position: [0, 4, 0] },
      cloudPuffs.map((puff, i) => (
        React.createElement('group' as any, { key: i, scale: [opacity, opacity, opacity] },
          React.createElement(CloudPuff, {
            position: puff.pos,
            scale: puff.scale,
            stretch: puff.stretch
          })
        )
      ))
    )
  );
}

// Animated Cube Component
function AnimatedCube({ 
  service, 
  index, 
  scrollProgress, 
  isMobile,
  isHovered,
  setIsHovered,
  isVisible
}: {
  service: DockerService;
  index: number;
  scrollProgress: number;
  isMobile: boolean;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isVisible: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { addLog } = useArchitectureStore();
  const cubeSize = isMobile ? 0.6 : 0.8;
  
  useFrame((state) => {
    if (meshRef.current && !isHovered && scrollProgress > 0.1 && isVisible) {
      // Slower cube self-rotation
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.y += 0.003;
      
      // Rotate the entire cube assembly around the center using clock time
      const rotationSpeed = 0.3;
      const angle = (state.clock.elapsedTime * rotationSpeed) + (index * Math.PI * 2 / dockerServices.length);
      const radius = 1.2;
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
    }
  });
  
  const handlePointerOver = () => {
    setIsHovered(true);
  };
  
  const handlePointerOut = () => {
    setIsHovered(false);
  };
  
  const opacity = Math.min(1, scrollProgress * 2);
  const glowMultiplier = isHovered ? 1.5 : 1;
  const color = isHovered ? 0x66d9ff : service.color;
  
  return (
    React.createElement('group' as any, {
      ref: meshRef,
      position: [service.position.x, service.position.y, service.position.z],
      onPointerOver: handlePointerOver,
      onPointerOut: handlePointerOut
    },
      // Wireframe cube
      React.createElement('lineSegments' as any, {},
        React.createElement('edgesGeometry' as any, { args: [new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)] }),
        React.createElement('lineBasicMaterial' as any, {
          color,
          transparent: true,
          opacity: 0.9 * opacity * glowMultiplier,
          linewidth: 2
        })
      ),
      // Transparent fill
      React.createElement('mesh' as any, {},
        React.createElement('boxGeometry' as any, { args: [cubeSize, cubeSize, cubeSize] }),
        React.createElement('meshBasicMaterial' as any, {
          color,
          transparent: true,
          opacity: 0.18 * opacity * glowMultiplier
        })
      )
    )
  );
}

// Connection Lines Component
function ConnectionLines({ scrollProgress, isVisible }: { scrollProgress: number; isVisible: boolean }) {
  const linesRef = useRef<THREE.Group>(null);
  
  const easedProgress = scrollProgress < 0.5 ? 4 * scrollProgress * scrollProgress * scrollProgress : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  
  if (!isVisible) return null;
  
  return (
    React.createElement('group' as any, { ref: linesRef },
      dockerServices.map((service, i) => {
        const delay = i * 0.1;
        const lineProgress = Math.max(0, Math.min(1, (easedProgress - delay) * 2));
        
        return React.createElement(Line as any, {
          key: i,
          points: [
            [service.position.x, service.position.y, service.position.z],
            [0, 4, 0] // cloud position
          ],
          color: 0x4da6ff,
          transparent: true,
          opacity: lineProgress * 0.6,
          lineWidth: 3
        });
      })
    )
  );
}

export function CoolifyTimeline({
    width = '100%',
    height = 600,
    className = ''
}: { width?: number | string; height?: number; className?: string }) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const { addLog } = useArchitectureStore();
    
    // Use intersection observer for performance
    const { ref: containerRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '100px'
    });

    // Responsive width/height
    const [actualWidth, setActualWidth] = React.useState<number>(typeof width === 'number' ? width : 600);
    const [actualHeight, setActualHeight] = React.useState<number>(height);

    useEffect(() => {
        function handleResize() {
            const w = containerRef.current?.offsetWidth || window.innerWidth;
            // Double the size on desktop, keep mobile size reasonable
            const desktopWidth = typeof width === 'number' ? width * 2 : 1200;
            const desktopHeight = height * 2;
            
            setActualWidth(w < 500 ? w : desktopWidth);
            setActualHeight(w < 500 ? 400 : desktopHeight);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, height]);

    // Scroll effect
    useEffect(() => {
        function handleScroll() {
            if (!containerRef.current) return;
            
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate scroll progress based on when the component enters and exits viewport
            const startTrigger = windowHeight * 0.8;
            const endTrigger = -rect.height * 0.2;
            
            let progress = 0;
            if (rect.top <= startTrigger && rect.bottom >= endTrigger) {
                const totalDistance = startTrigger - endTrigger;
                const currentDistance = startTrigger - rect.top;
                progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
            }
            
            setScrollProgress(progress);
        }

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isMobile = actualWidth < 500;

    return (
        <div
            ref={containerRef}
            className={`flex relative flex-col justify-center items-center ${className}`}
            style={{
                width: typeof width === 'number' ? width : '100%',
                height: actualHeight,
                maxWidth: '100vw',
                minHeight: actualHeight,
                touchAction: 'pan-y'
            }}
        >
            {isIntersecting && (
                <Canvas
                    style={{
                        width: actualWidth,
                        height: actualHeight,
                        background: 'transparent'
                    }}
                    camera={{ position: [0, 0, 12], fov: 75 }}
                    gl={{ alpha: true, antialias: true }}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <Cloud scrollProgress={scrollProgress} isVisible={isIntersecting} />
                    
                    {dockerServices.map((service, i) => (
                        <AnimatedCube
                            key={i}
                            service={service}
                            index={i}
                            scrollProgress={scrollProgress}
                            isMobile={isMobile}
                            isHovered={isHovered}
                            setIsHovered={setIsHovered}
                            isVisible={isIntersecting}
                        />
                    ))}
                    
                    <ConnectionLines scrollProgress={scrollProgress} isVisible={isIntersecting} />
                </Canvas>
            )}
        </div>
    );
}

export default CoolifyTimeline;
