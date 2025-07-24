"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useIntersectionObserver } from "../../../hooks/use-intersection-observer";
import { useArchitectureStore } from "../../../stores/architecture-store";
import { useThreeJSPerformance } from "../../../hooks/use-threejs-performance";

interface DockerService {
  name: string;
  color: number;
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
}

interface AnimatedCubeProps {
  service: DockerService;
  scrollProgress: number;
  isMobile: boolean;
  isVisible: boolean;
  animationEnabled: boolean;
}

function AnimatedCube({
  service,
  scrollProgress,
  isMobile,
  isVisible,
  animationEnabled,
}: AnimatedCubeProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { addLog } = useArchitectureStore();

  useFrame((state) => {
    if (!groupRef.current || !isVisible || !animationEnabled) return;

    // Skip frames for performance - run at 20fps instead of 60fps
    const frameCount = Math.floor(state.clock.elapsedTime * 20);
    if (frameCount % 3 !== 0) return;

    // Smooth easing function
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    };

    const easedProgress = easeInOutCubic(scrollProgress);

    // Interpolate position based on scroll progress
    const currentPos = service.startPosition
      .clone()
      .lerp(service.endPosition, easedProgress);
    groupRef.current.position.copy(currentPos);

    if (animationEnabled) {
      // Slower cube rotation for better performance
      groupRef.current.rotation.x += 0.003;
      groupRef.current.rotation.y += 0.003;
    }

    // Optimize material updates - only update when opacity changes significantly
    const opacity = Math.min(1, easedProgress * 2);
    groupRef.current.children.forEach((child, childIndex) => {
      if ("material" in child && child.material) {
        const material = child.material as any;
        if (material.opacity !== undefined) {
          const baseOpacity = childIndex === 0 ? 0.9 : 0.18;
          material.opacity = baseOpacity * opacity;
        }
      }
    });
  });

  const cubeSize = isMobile ? 0.6 : 0.8;

  return React.createElement(
    "group" as any,
    { ref: groupRef },
    // Wireframe cube
    React.createElement(
      "lineSegments" as any,
      {},
      React.createElement("edgesGeometry" as any, {
        args: [new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)],
      }),
      React.createElement("lineBasicMaterial" as any, {
        color: service.color,
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
      })
    ),
    // Transparent fill
    React.createElement(
      "mesh" as any,
      {},
      React.createElement("boxGeometry" as any, {
        args: [cubeSize, cubeSize, cubeSize],
      }),
      React.createElement("meshBasicMaterial" as any, {
        color: service.color,
        transparent: true,
        opacity: 0.18,
      })
    )
  );
}

const dockerServices: DockerService[] = [
  {
    name: "convex-backend",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(-8, 4, 0),
    endPosition: new THREE.Vector3(-0.8, 0.8, 0),
  },
  {
    name: "convex-console",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(8, 4, 0),
    endPosition: new THREE.Vector3(0.8, 0.8, 0),
  },
  {
    name: "next-js-app",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(-8, -4, 0),
    endPosition: new THREE.Vector3(-0.8, -0.8, 0),
  },
  {
    name: "telegram-bot",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(8, -4, 0),
    endPosition: new THREE.Vector3(0.8, -0.8, 0),
  },
  {
    name: "vector-convert-llm",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(0, 8, 0),
    endPosition: new THREE.Vector3(0, 0.8, 0.8),
  },
  {
    name: "lightweight-llm",
    color: 0x4da6ff,
    startPosition: new THREE.Vector3(0, -8, 0),
    endPosition: new THREE.Vector3(0, -0.8, -0.8),
  },
];

export function DockerComposeTimeline({
  width = "100%",
  height = 600,
  className = "",
  animationEnabled = true,
}: {
  width?: number | string;
  height?: number;
  className?: string;
  animationEnabled?: boolean;
}) {
  const {
    scrollProgress,
    secondTimelineActive,
    dockerComposeTimelineVisible,
    setDockerComposeTimelineVisible,
    addLog,
  } = useArchitectureStore();

  // Use performance manager for Three.js scenes
  const { shouldRender, updateVisibility } = useThreeJSPerformance("docker-compose-timeline", 2); // Medium priority

  // Use intersection observer for performance
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    throttleMs: 32, // Reduce update frequency
  });

  // Update performance manager when visibility changes
  useEffect(() => {
    updateVisibility(isIntersecting && secondTimelineActive);
  }, [isIntersecting, secondTimelineActive, updateVisibility]);

  // Responsive width/height
  const [actualWidth, setActualWidth] = React.useState<number>(
    typeof width === "number" ? width : 600
  );
  const [actualHeight, setActualHeight] = React.useState<number>(height);

  useEffect(() => {
    function handleResize() {
      const w = containerRef.current?.offsetWidth || window.innerWidth;
      setActualWidth(w < 500 ? w : typeof width === "number" ? width : 600);
      setActualHeight(w < 500 ? 400 : height);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, height, containerRef.current?.offsetWidth]);

  useEffect(() => {
    const shouldBeVisible =
      secondTimelineActive && scrollProgress > 0 && isIntersecting;
    if (shouldBeVisible !== dockerComposeTimelineVisible) {
      setDockerComposeTimelineVisible(shouldBeVisible);
    }
  }, [
    secondTimelineActive,
    scrollProgress,
    dockerComposeTimelineVisible,
    setDockerComposeTimelineVisible,
    isIntersecting,
  ]);

  const isMobile = actualWidth < 500;
  const shouldRenderCanvas = shouldRender && dockerComposeTimelineVisible && isIntersecting;

  return (
    <div
      ref={containerRef}
      className={`flex relative flex-col justify-center items-center ${className}`}
      style={{
        width: typeof width === "number" ? width : "100%",
        height: actualHeight,
        maxWidth: "100vw",
        minHeight: actualHeight,
        touchAction: "pan-y",
      }}
    >
      {shouldRenderCanvas && (
        <Canvas
          camera={{ position: [0, 0, 12], fov: 75 }}
          style={{
            width: actualWidth,
            height: actualHeight,
            background: "transparent",
          }}
          gl={{ antialias: true, alpha: true }}
        >
          {dockerServices.map((service, index) => (
            <AnimatedCube
              key={`${service.name}-${index}`}
              service={service}
              scrollProgress={scrollProgress}
              isMobile={isMobile}
              isVisible={isIntersecting}
              animationEnabled={animationEnabled}
            />
          ))}
        </Canvas>
      )}
    </div>
  );
}

export default DockerComposeTimeline;
