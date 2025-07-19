'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
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

// Fallback Cloud Component using basic Three.js geometries
function FallbackCloud({ scrollProgress, isVisible, animationEnabled }: { scrollProgress: number; isVisible: boolean; animationEnabled: boolean }) {
  const cloudRef = useRef<THREE.Group>(null);
  const { setCoolifyTimelineVisible } = useArchitectureStore();

  useFrame(() => {
    if (cloudRef.current && scrollProgress > 0.1 && isVisible && animationEnabled) {
      // Gentle floating motion
      cloudRef.current.position.y = 4 + Math.sin(Date.now() * 0.001) * 0.2;
      // Slow rotation
      cloudRef.current.rotation.y -= 0.001;
    }
  });

  useEffect(() => {
    if (scrollProgress > 0.1 && isVisible) {
      setCoolifyTimelineVisible(true);
    } else {
      setCoolifyTimelineVisible(false);
    }
  }, [scrollProgress, setCoolifyTimelineVisible, isVisible]);

  const opacity = Math.min(1, scrollProgress * 2);

  return (
    <group
      ref={cloudRef}
      position={[0, 4, 0]}
      scale={[opacity * 0.5, opacity * 0.5, opacity * 0.5]} // Scale based on scroll progress
    >
      {/* Main cloud body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshPhongMaterial
          color={0x87ceeb}
          transparent={true}
          opacity={0.8 * opacity}
          wireframe={true}
          emissive={0x4da6ff}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Additional cloud puffs */}
      <mesh position={[1, 0.3, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshPhongMaterial
          color={0x87ceeb}
          transparent={true}
          opacity={0.8 * opacity}
          wireframe={true}
          emissive={0x4da6ff}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh position={[-1, 0.2, 0.3]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshPhongMaterial
          color={0x87ceeb}
          transparent={true}
          opacity={0.8 * opacity}
          wireframe={true}
          emissive={0x4da6ff}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh position={[0, 0.5, -0.8]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshPhongMaterial
          color={0x87ceeb}
          transparent={true}
          opacity={0.8 * opacity}
          wireframe={true}
          emissive={0x4da6ff}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh position={[0.5, -0.5, 0.5]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshPhongMaterial
          color={0x87ceeb}
          transparent={true}
          opacity={0.8 * opacity}
          wireframe={true}
          emissive={0x4da6ff}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

// Cloud Component using OBJ model with MTL materials
function Cloud({ scrollProgress, isVisible, animationEnabled }: { scrollProgress: number; isVisible: boolean; animationEnabled: boolean }) {
  const cloudRef = useRef<THREE.Group>(null!);
  const { setCoolifyTimelineVisible } = useArchitectureStore();
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load the cloud model
  let cloudObj: THREE.Group | null = null;
  try {
    cloudObj = useLoader(OBJLoader, '/cloud2.obj');
  } catch (error) {
    console.warn('Failed to load cloud2.obj, using fallback');
    if (!useFallback) {
      setUseFallback(true);
    }
  }

  useEffect(() => {
    if (cloudObj) {
      setCloudLoaded(true);
      setUseFallback(false);

      // Set up cloud materials with normal opacity
      cloudObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.8,
            shininess: 30,
            wireframe: true,
            emissive: 0x4da6ff,
            emissiveIntensity: 0.2
          });
        }
      });
    } else {
      setUseFallback(true);
    }
  }, [cloudObj]);

  useFrame(() => {
    if (!cloudRef.current || !isVisible) return;

    // Phase 1: Cloud appears and scales up
    const cloudProgress = Math.max(0, Math.min(1, scrollProgress / 0.4));
    
    // Scale-up animation
    const baseScale = 0.1;
    const scaleMultiplier = Math.min(1, cloudProgress * 2);
    cloudRef.current.scale.setScalar(baseScale * scaleMultiplier);

    if (animationEnabled) {
      // Gentle floating motion
      cloudRef.current.position.y = 4 + Math.sin(Date.now() * 0.001) * 0.2;
      // Slow rotation
      cloudRef.current.rotation.y += 0.003;
    }

    // Apply opacity based on scroll progress
    const opacity = Math.min(1, cloudProgress * 2);
    cloudRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshPhongMaterial;
        if (material.opacity !== undefined) {
          material.opacity = 0.8 * opacity;
          material.needsUpdate = true;
        }
      }
    });

    // Also handle fallback meshes if they exist
    if (cloudRef.current.userData.fallbackMeshes) {
      cloudRef.current.userData.fallbackMeshes.forEach((mesh: THREE.Mesh) => {
        if (mesh.material) {
          const material = mesh.material as THREE.MeshPhongMaterial;
          if (material.opacity !== undefined) {
            material.opacity = 0.8 * opacity;
            material.needsUpdate = true;
          }
        }
      });
    }
  });

  useEffect(() => {
    if (scrollProgress > 0.1 && isVisible) {
      setCoolifyTimelineVisible(true);
    } else {
      setCoolifyTimelineVisible(false);
    }
  }, [scrollProgress, setCoolifyTimelineVisible, isVisible]);

  // If loading failed or model isn't ready yet, use fallback
  if (useFallback || !cloudLoaded) {
    return <FallbackCloud scrollProgress={scrollProgress} isVisible={isVisible} animationEnabled={animationEnabled} />;
  }

  return (
    <group ref={cloudRef} position={[0, 4, 0]}>
      <primitive 
        object={cloudObj?.clone()}
        scale={[1, 1, 1]}
      />
    </group>
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
  isVisible,
  onPositionUpdate,
  animationEnabled
}: {
  service: DockerService;
  index: number;
  scrollProgress: number;
  isMobile: boolean;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isVisible: boolean;
  onPositionUpdate: (index: number, position: THREE.Vector3) => void;
  animationEnabled: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { addLog } = useArchitectureStore();
  const cubeSize = isMobile ? 0.6 : 0.8;

  useFrame((state) => {
    if (meshRef.current && !isHovered && scrollProgress > 0.1 && isVisible && animationEnabled) {
      // Slower cube self-rotation
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.y += 0.003;

      // Rotate the entire cube assembly around the center using clock time
      const rotationSpeed = 0.3;
      const angle = (state.clock.elapsedTime * rotationSpeed) + (index * Math.PI * 2 / dockerServices.length);
      const radius = 1.2;
      const newX = Math.cos(angle) * radius;
      const newZ = Math.sin(angle) * radius;
      
      meshRef.current.position.x = newX;
      meshRef.current.position.z = newZ;
      
      // Update the position for connection lines
      onPositionUpdate(index, new THREE.Vector3(newX, service.position.y, newZ));
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
function ConnectionLines({ 
  scrollProgress, 
  isVisible, 
  cubePositions 
}: { 
  scrollProgress: number; 
  isVisible: boolean;
  cubePositions: THREE.Vector3[];
}) {
  const linesRef = useRef<THREE.Group>(null);

  const easedProgress = scrollProgress < 0.5 ? 4 * scrollProgress * scrollProgress * scrollProgress : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;

  if (!isVisible) return null;

  return (
    React.createElement('group' as any, { ref: linesRef },
      dockerServices.map((service, i) => {
        const delay = i * 0.1;
        const lineProgress = Math.max(0, Math.min(1, (easedProgress - delay) * 2));

        // Use dynamic cube position if available, otherwise fall back to original position
        const cubePos = cubePositions[i] || service.position;

        return React.createElement(Line as any, {
          key: i,
          points: [
            [cubePos.x, cubePos.y, cubePos.z],
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
  className = '',
  animationEnabled = true
}: { width?: number | string; height?: number; className?: string; animationEnabled?: boolean }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cubePositions, setCubePositions] = useState<THREE.Vector3[]>(
    dockerServices.map(service => service.position.clone())
  );
  const { addLog } = useArchitectureStore();

  // Use intersection observer for performance
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Handle cube position updates
  const handleCubePositionUpdate = (index: number, position: THREE.Vector3) => {
    setCubePositions(prev => {
      const newPositions = [...prev];
      newPositions[index] = position.clone();
      return newPositions;
    });
  };

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
          <Cloud scrollProgress={scrollProgress} isVisible={isIntersecting} animationEnabled={animationEnabled} />

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
              onPositionUpdate={handleCubePositionUpdate}
              animationEnabled={animationEnabled}
            />
          ))}

          <ConnectionLines 
            scrollProgress={scrollProgress} 
            isVisible={isIntersecting} 
            cubePositions={cubePositions}
          />
        </Canvas>
      )}
    </div>
  );
}

export default CoolifyTimeline;
