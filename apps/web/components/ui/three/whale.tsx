"use client";

/// <reference path="../../../types/react-three-fiber.d.ts" />

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useIntersectionObserver } from "../../../hooks/use-intersection-observer";
import { useArchitectureStore } from "../../../stores/architecture-store";

function FallbackWhale({
  scrollProgress,
  isVisible,
  animationEnabled,
}: {
  scrollProgress: number;
  isVisible: boolean;
  animationEnabled: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const { addLog } = useArchitectureStore();

  useFrame((state) => {
    if (
      !groupRef.current ||
      scrollProgress === 0 ||
      !isVisible ||
      !animationEnabled
    )
      return;

    const time = state.clock.elapsedTime;
    const circularSpeed = 0.3; // Speed of circular motion
    const circleRadius = 3; // Radius of the circular path
    const undulationFrequency = 0.8;
    const undulationAmplitude = 0.05;

    // Circular motion around the screen
    const angle = time * circularSpeed * scrollProgress;
    const x = Math.cos(angle) * circleRadius;
    const z = Math.sin(angle) * circleRadius;

    groupRef.current.position.set(x, 0, z);

    // Make whale face the direction it's moving
    groupRef.current.rotation.y = angle + Math.PI / 2;

    // Gentle swimming undulation
    const verticalOffset =
      Math.sin(time * undulationFrequency) *
      undulationAmplitude *
      scrollProgress;
    groupRef.current.position.y = verticalOffset;

    // Very subtle pitch and roll
    const pitchRotation = Math.sin(time * undulationFrequency * 0.7) * 0.02;
    const rollRotation = Math.sin(time * undulationFrequency * 0.9) * 0.01;
    groupRef.current.rotation.x = pitchRotation;
    groupRef.current.rotation.z = rollRotation;
  });

  return (
    <group ref={groupRef} scale={[0.5, 0.5, 0.5]} position={[-3, 0, 0]}>
      {/* Body (ellipsoid) */}
      <mesh>
        <sphereGeometry args={[1, 16, 8]} />
        <meshPhongMaterial color={0x4da6ff} transparent={true} opacity={0.8} />
      </mesh>

      {/* Tail */}
      <mesh position={[-2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshPhongMaterial color={0x4da6ff} transparent={true} opacity={0.8} />
      </mesh>

      {/* Left Fin */}
      <mesh position={[0, -0.5, 0.5]} rotation={[Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.3, 0.8, 6]} />
        <meshPhongMaterial color={0x4da6ff} transparent={true} opacity={0.8} />
      </mesh>

      {/* Right Fin */}
      <mesh position={[0, -0.5, -0.5]} rotation={[-Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.3, 0.8, 6]} />
        <meshPhongMaterial color={0x4da6ff} transparent={true} opacity={0.8} />
      </mesh>
    </group>
  );
}

function WhaleModel({
  scrollProgress,
  isVisible,
  animationEnabled,
}: {
  scrollProgress: number;
  isVisible: boolean;
  animationEnabled: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const { addLog } = useArchitectureStore();
  const [useFallback, setUseFallback] = useState(false);

  let obj;
  try {
    obj = useLoader(OBJLoader, "/whale.obj");
  } catch (error) {
    console.error("Error loading whale model:", error);
    if (!useFallback) {
      setUseFallback(true);
      addLog("Whale model failed to load, using fallback");
    }
  }

  useFrame((state) => {
    if (
      !groupRef.current ||
      scrollProgress === 0 ||
      !isVisible ||
      !animationEnabled
    )
      return;

    const time = state.clock.elapsedTime;
    const circularSpeed = 0.3; // Speed of circular motion
    const circleRadius = 3; // Radius of the circular path
    const undulationFrequency = 0.8;
    const undulationAmplitude = 0.05;

    // Circular motion around the screen
    const angle = time * circularSpeed * scrollProgress;
    const x = Math.cos(angle) * circleRadius;
    const z = Math.sin(angle) * circleRadius;

    groupRef.current.position.set(x, 0, z);

    // Make whale face the direction it's moving
    groupRef.current.rotation.y = angle + Math.PI / 2;

    // Gentle swimming undulation
    const verticalOffset =
      Math.sin(time * undulationFrequency) *
      undulationAmplitude *
      scrollProgress;
    groupRef.current.position.y = verticalOffset;

    // Very subtle pitch and roll
    const pitchRotation = Math.sin(time * undulationFrequency * 0.7) * 0.02;
    const rollRotation = Math.sin(time * undulationFrequency * 0.9) * 0.01;
    groupRef.current.rotation.x = pitchRotation;
    groupRef.current.rotation.z = rollRotation;
  });

  if (useFallback || !obj) {
    return (
      <FallbackWhale
        scrollProgress={scrollProgress}
        isVisible={isVisible}
        animationEnabled={animationEnabled}
      />
    );
  }

  return (
    <group ref={groupRef} scale={[0.5, 0.5, 0.5]}>
      <primitive object={obj} />
    </group>
  );
}

export function Whale({
  width = "100%",
  height = 400,
  className = "",
  animationEnabled = true,
}: {
  width?: number | string;
  height?: number;
  className?: string;
  animationEnabled?: boolean;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { whaleVisible, setWhaleVisible, addLog } = useArchitectureStore();

  // Use intersection observer for performance
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Full screen width/height
  const [actualWidth, setActualWidth] = React.useState<number>(0);
  const [actualHeight, setActualHeight] = React.useState<number>(height);

  useEffect(() => {
    function handleResize() {
      setActualWidth(window.innerWidth);
      setActualHeight(window.innerWidth < 500 ? 300 : height);
    }

    // Initialize on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [height]);

  // Smooth scroll progress tracking
  useEffect(() => {
    function handleScroll() {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate smooth scroll progress
      const startTrigger = windowHeight * 0.8;
      const endTrigger = -rect.height * 0.2;

      let progress = 0;
      if (rect.top <= startTrigger && rect.bottom >= endTrigger) {
        const totalDistance = startTrigger - endTrigger;
        const currentDistance = startTrigger - rect.top;
        progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
      }

      setScrollProgress(progress);

      // Update visibility state
      const isVisible = progress > 0 && isIntersecting;
      setWhaleVisible(isVisible);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setWhaleVisible, isIntersecting, containerRef.current]);

  const shouldRenderCanvas = whaleVisible && isIntersecting;

  return (
    <div
      ref={containerRef}
      className={`fixed left-0 right-0 flex justify-center items-center ${className}`}
      style={{
        width: "100vw",
        height: actualHeight,
        minHeight: actualHeight,
        touchAction: "pan-y",
        zIndex: 10,
      }}
    >
      {shouldRenderCanvas && (
        <Canvas
          style={{
            width: actualWidth,
            height: actualHeight,
            background: "transparent",
          }}
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight color={0x4da6ff} intensity={0.6} />
          <directionalLight
            color={0x87ceeb}
            intensity={0.8}
            position={[5, 5, 5]}
          />

          {/* Whale Model */}
          <WhaleModel
            scrollProgress={scrollProgress}
            isVisible={isIntersecting}
            animationEnabled={animationEnabled}
          />
        </Canvas>
      )}
    </div>
  );
}

export default Whale;
