'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import type { LineProps } from '@react-three/drei';
import * as THREE from 'three';
import { useArchitectureStore } from '../../../stores/architecture-store';
import { useIntersectionObserver } from '../../../hooks/use-intersection-observer';

interface DockerService {
  name: string;
  color: number;
  label: string;
}

const dockerServices: DockerService[] = [
  { name: 'convex-backend', color: 0x4da6ff, label: 'convex backend' },
  { name: 'convex-console', color: 0x4da6ff, label: 'convex console' },
  { name: 'next-js-app', color: 0x4da6ff, label: 'next.js app' },
  { name: 'telegram-bot (Go)', color: 0x4da6ff, label: 'telegram bot' },
  { name: 'vector-convert-llm', color: 0x4da6ff, label: 'vector convert' },
  { name: 'lightweight-llm', color: 0x4da6ff, label: 'llm service' }
];

// Network connections (bold lines)
const connectionPairs: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], // Convex Backend to all
  [2, 5], [2, 4] // Next.js to LLM and Vector Convert
];

// Animated Cube Component
function AnimatedCube({ 
  position, 
  color, 
  label, 
  index, 
  hoveredIdx, 
  setHoveredIdx,
  isMobile,
  isVisible
}: {
  position: [number, number, number];
  color: number;
  label: string;
  index: number;
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
  isMobile: boolean;
  isVisible: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);
  const { setHoveredCube, addLog } = useArchitectureStore();
  const cubeSize = isMobile ? 0.8 : 1.2;
  
  useFrame(() => {
    if (meshRef.current && isVisible) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
    // Keep text stationary by not rotating it
  });
  
  const handlePointerOver = () => {
    setHoveredIdx(index);
    setHoveredCube(index);
  };
  
  const handlePointerOut = () => {
    setHoveredIdx(null);
    setHoveredCube(null);
  };
  
  const isHovered = hoveredIdx === index;
  
  // Determine text position based on service name
  // Above cubes: vector convert (index 4), telegram bot (index 3), next.js app (index 2)
  // Below cubes: llm service (index 5), convex backend (index 0), convex console (index 1)
  const shouldTextBeAbove = [2, 3, 4].includes(index); // next.js app, telegram bot, vector convert
  const textDistance = isMobile ? 1.8 : 1.5;
  const textY = shouldTextBeAbove ? textDistance : -textDistance;
  
  return (
    <>
      {/* Rotating cube group */}
      <group ref={meshRef} position={position}>
        {/* Wireframe cube */}
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
          <meshBasicMaterial
            color={color}
            transparent={true}
            opacity={0.18}
          />
        </mesh>
        
        {/* Wireframe edges */}
        <Line
          points={[
            [-cubeSize/2, -cubeSize/2, -cubeSize/2], [cubeSize/2, -cubeSize/2, -cubeSize/2],
            [cubeSize/2, -cubeSize/2, -cubeSize/2], [cubeSize/2, cubeSize/2, -cubeSize/2],
            [cubeSize/2, cubeSize/2, -cubeSize/2], [-cubeSize/2, cubeSize/2, -cubeSize/2],
            [-cubeSize/2, cubeSize/2, -cubeSize/2], [-cubeSize/2, -cubeSize/2, -cubeSize/2],
            [-cubeSize/2, -cubeSize/2, cubeSize/2], [cubeSize/2, -cubeSize/2, cubeSize/2],
            [cubeSize/2, -cubeSize/2, cubeSize/2], [cubeSize/2, cubeSize/2, cubeSize/2],
            [cubeSize/2, cubeSize/2, cubeSize/2], [-cubeSize/2, cubeSize/2, cubeSize/2],
            [-cubeSize/2, cubeSize/2, cubeSize/2], [-cubeSize/2, -cubeSize/2, cubeSize/2],
            [-cubeSize/2, -cubeSize/2, -cubeSize/2], [-cubeSize/2, -cubeSize/2, cubeSize/2],
            [cubeSize/2, -cubeSize/2, -cubeSize/2], [cubeSize/2, -cubeSize/2, cubeSize/2],
            [cubeSize/2, cubeSize/2, -cubeSize/2], [cubeSize/2, cubeSize/2, cubeSize/2],
            [-cubeSize/2, cubeSize/2, -cubeSize/2], [-cubeSize/2, cubeSize/2, cubeSize/2]
          ]}
          color={isHovered ? 0x4da6ff : color}
          transparent={true}
          opacity={isHovered ? 1 : 0.9}
          lineWidth={2}
        />
      </group>
      
      {/* Stationary text group - positioned in world space, not relative to cube */}
      <group ref={textRef} position={[position[0], position[1] + textY, position[2]]}>
        <Text
          position={[0, 0, 0]}
          fontSize={isMobile ? 0.4 : 0.3}
          color={isHovered ? '#4da6ff' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          maxWidth={isMobile ? 4 : 2}
        >
          {label}
        </Text>
      </group>
      
      {/* Connection line from cube to label */}
      <Line
        points={[
          position,
          [position[0], position[1] + textY, position[2]]
        ]}
        color={isHovered ? 0x4da6ff : 0x94a3b8}
        transparent={true}
        opacity={isHovered ? 0.7 : 0.3}
        lineWidth={1}
      />
    </>
  );
}

// Connection Lines Component
function ConnectionLines({ 
  connectionPairs, 
  cubePositions, 
  hoveredIdx 
}: {
  connectionPairs: [number, number][];
  cubePositions: [number, number, number][];
  hoveredIdx: number | null;
}) {
  return (
    <>
      {connectionPairs.map(([fromIdx, toIdx], i) => {
        const fromPos = cubePositions[fromIdx];
        const toPos = cubePositions[toIdx];
        if (!fromPos || !toPos) return null;
        
        const isHighlighted = hoveredIdx === fromIdx || hoveredIdx === toIdx;
        
        return React.createElement(Line as any, {
          key: i,
          points: [fromPos, toPos],
          color: 0x4da6ff,
          transparent: true,
          opacity: isHighlighted ? 1 : 0.7,
          lineWidth: isHighlighted ? 4 : 2
        });
      })}
    </>
  );
}

export function ArchitectureTimeline({
  width = '100%',
  height = 480,
  className = ''
}: { width?: number | string; height?: number; className?: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { firstTimelineActive, firstTimelineVersion, addLog } = useArchitectureStore();
  
  // Use intersection observer for performance
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Responsive width/height
  const [actualWidth, setActualWidth] = useState<number>(typeof width === 'number' ? width : 600);
  const [actualHeight, setActualHeight] = useState<number>(height);

  useEffect(() => {
    function handleResize() {
      const w = containerRef.current?.offsetWidth || window.innerWidth;
      setActualWidth(w < 500 ? w : typeof width === 'number' ? width : 600);
      setActualHeight(w < 500 ? 340 : height);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);
  
  useEffect(() => {
    if (isIntersecting) {
      addLog('Architecture timeline activated');
    }
  }, [isIntersecting, addLog]);

  // Calculate cube positions in a circle - memoized for performance
  const cubePositions: [number, number, number][] = useMemo(() => {
    const isMobile = actualWidth < 500;
    const radius = isMobile ? 2.5 : 4;
    return dockerServices.map((_, i) => {
      const angle = (i / dockerServices.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return [x, y, 0];
    });
  }, [actualWidth]);
  
  const isMobile = actualWidth < 500;

  // Always render the container, but conditionally render the Canvas
  return (
    <div
      ref={containerRef}
      className={`flex relative flex-col justify-center items-center ${className}`}
      style={{
        width: typeof width === 'number' ? width : '100%',
        height: actualHeight + (actualWidth < 500 ? 120 : 80),
        maxWidth: '100vw',
        minHeight: actualHeight + (actualWidth < 500 ? 120 : 80),
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
        >
          {dockerServices.map((service, i) => (
            <AnimatedCube
              key={i}
              position={cubePositions[i]!}
              color={service.color}
              label={service.label}
              index={i}
              hoveredIdx={hoveredIdx}
              setHoveredIdx={setHoveredIdx}
              isMobile={isMobile}
              isVisible={isIntersecting}
            />
          ))}
          
          <ConnectionLines
            connectionPairs={connectionPairs}
            cubePositions={cubePositions}
            hoveredIdx={hoveredIdx}
          />
        </Canvas>
      )}
    </div>
  );
}

export default ArchitectureTimeline;
