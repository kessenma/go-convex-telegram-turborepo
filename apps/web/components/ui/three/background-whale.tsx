"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useIntersectionObserver } from "../../../hooks/use-intersection-observer";
import { useThreeJSPerformance } from "../../../hooks/use-threejs-performance";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Continuous animation state to prevent resets
let globalAnimationTime = 0;
let lastFrameTime = 0;

// Fallback whale using basic shapes with wireframe style
function FallbackWhale({
  animationEnabled,
  scrollProgress,
}: {
  animationEnabled: boolean;
  scrollProgress: number;
}) {
  const whaleRef = useRef<THREE.Group>(null!);
  const rigRef = useRef<THREE.Group>(null!);
  const frontHalfRef = useRef<THREE.Group>(null!);
  const backHalfRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!whaleRef.current || !rigRef.current || !animationEnabled) return;

    // Skip frames for performance
    const frameCount = Math.floor(state.clock.elapsedTime * 30); // 30fps instead of 60fps
    if (frameCount % 2 !== 0) return;

    // Continuous time that doesn't reset when component unmounts/remounts
    const currentTime = state.clock.elapsedTime;
    const deltaTime = currentTime - lastFrameTime;
    globalAnimationTime += deltaTime;
    lastFrameTime = currentTime;

    const time = globalAnimationTime;

    // Realistic whale swimming - subtle vertical motion
    const swimSpeed = 0.06;

    // Gentle horizontal drift (minimal)
    const x = Math.sin(time * swimSpeed * 0.3) * 1.5;
    const z = Math.cos(time * swimSpeed * 0.2) * 0.8;

    // Very subtle vertical swimming motion (like real whales)
    const y =
      Math.sin(time * swimSpeed * 2) * 0.15 +
      Math.cos(time * swimSpeed * 1.5) * 0.08;

    whaleRef.current.position.set(x, y, z);

    // Face forward with very slight vertical orientation changes
    const lookAtY = y + Math.sin(time * swimSpeed * 2) * 0.02;
    whaleRef.current.lookAt(x, lookAtY, z - 5);

    // Subtle vertical whale swimming motion (realistic)
    const swimFrequency = 1.0;
    const swimAmplitude = 0.04; // Much smaller amplitude

    // Very gentle vertical undulation
    const verticalWave = Math.sin(time * swimFrequency) * swimAmplitude;

    // Apply subtle vertical motion to front and back halves
    if (frontHalfRef.current) {
      const frontVertical =
        Math.sin(time * swimFrequency + Math.PI * 0.2) * swimAmplitude * 0.5;
      frontHalfRef.current.rotation.x = frontVertical * 0.15; // Very gentle pitch
      frontHalfRef.current.rotation.z = frontVertical * 0.03; // Minimal roll
    }

    if (backHalfRef.current) {
      const backVertical =
        Math.sin(time * swimFrequency + Math.PI * 0.8) * swimAmplitude * 1.0;
      backHalfRef.current.rotation.x = backVertical * 0.2; // Gentle tail pitch
      backHalfRef.current.rotation.z = backVertical * 0.05; // Minimal roll
    }

    // Whole-body subtle vertical motion
    rigRef.current.rotation.x = verticalWave * 0.1; // Very gentle pitch motion
    rigRef.current.rotation.z = verticalWave * 0.02; // Minimal roll
    rigRef.current.rotation.y = Math.sin(time * 0.4) * 0.02; // Very slight yaw

    // Very subtle additional vertical swimming motion
    const additionalVertical = Math.sin(time * 0.6) * 0.03;
    rigRef.current.position.y += additionalVertical;

    // Scale based on scroll progress for smooth fade in/out
    const scale = 0.4 * Math.min(1, scrollProgress * 2);
    rigRef.current.scale.setScalar(scale);

    // Opacity based on scroll progress
    const opacity = Math.min(1, scrollProgress * 2);
    rigRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshPhongMaterial;
        material.opacity = 0.8 * opacity;
        material.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={whaleRef}>
      <group ref={rigRef} scale={[0.4, 0.4, 0.4]}>
        {/* Front half of whale */}
        <group ref={frontHalfRef}>
          {/* Head/Body */}
          <mesh>
            <sphereGeometry args={[1, 16, 8]} />
            <meshPhongMaterial
              color={0x87ceeb}
              transparent={true}
              opacity={0.8}
              wireframe={true}
              emissive={0x4da6ff}
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Fins */}
          <mesh position={[0, -0.5, 0.5]} rotation={[Math.PI / 4, 0, 0]}>
            <coneGeometry args={[0.3, 0.8, 6]} />
            <meshPhongMaterial
              color={0x87ceeb}
              transparent={true}
              opacity={0.8}
              wireframe={true}
              emissive={0x4da6ff}
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh position={[0, -0.5, -0.5]} rotation={[-Math.PI / 4, 0, 0]}>
            <coneGeometry args={[0.3, 0.8, 6]} />
            <meshPhongMaterial
              color={0x87ceeb}
              transparent={true}
              opacity={0.8}
              wireframe={true}
              emissive={0x4da6ff}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>

        {/* Back half of whale */}
        <group ref={backHalfRef}>
          {/* Tail */}
          <mesh position={[-2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.5, 1.5, 8]} />
            <meshPhongMaterial
              color={0x87ceeb}
              transparent={true}
              opacity={0.8}
              wireframe={true}
              emissive={0x4da6ff}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// OBJ whale model component with programmatic rigging
function OBJWhale({
  animationEnabled,
  scrollProgress,
}: {
  animationEnabled: boolean;
  scrollProgress: number;
}) {
  const whaleRef = useRef<THREE.Group>(null!);
  const rigRef = useRef<THREE.Group>(null!);
  const [originalGeometries, setOriginalGeometries] = useState<
    Map<THREE.Mesh, Float32Array>
  >(new Map());

  // Load the whale OBJ model - this will suspend until loaded
  const whaleObj = useLoader(OBJLoader, "/whale.obj");

  useEffect(() => {
    if (whaleObj) {
      const geometryMap = new Map<THREE.Mesh, Float32Array>();

      // Apply wireframe style and store original vertex positions for deformation
      whaleObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.8,
            wireframe: true,
            emissive: 0x4da6ff,
            emissiveIntensity: 0.2,
            shininess: 30,
          });

          // Store original vertex positions for swimming deformation
          if (child.geometry?.attributes.position) {
            const positions = child.geometry.attributes.position
              .array as Float32Array;
            geometryMap.set(child, new Float32Array(positions));

            // Make sure geometry is dynamic for vertex animation
            child.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
          }
        }
      });

      setOriginalGeometries(geometryMap);
    }
  }, [whaleObj]);

  useFrame((state) => {
    if (!whaleRef.current || !rigRef.current || !animationEnabled) return;

    // Use continuous global time
    const currentTime = state.clock.elapsedTime;
    const deltaTime = currentTime - lastFrameTime;
    globalAnimationTime += deltaTime;
    lastFrameTime = currentTime;

    const time = globalAnimationTime;

    // Realistic whale swimming - subtle vertical motion
    const swimSpeed = 0.06;

    // Gentle horizontal drift (minimal)
    const x = Math.sin(time * swimSpeed * 0.3) * 1.5;
    const z = Math.cos(time * swimSpeed * 0.2) * 0.8;

    // Very subtle vertical swimming motion (like real whales)
    const y =
      Math.sin(time * swimSpeed * 2) * 0.15 +
      Math.cos(time * swimSpeed * 1.5) * 0.08;

    whaleRef.current.position.set(x, y, z);

    // Face forward with very slight vertical orientation changes
    const lookAtY = y + Math.sin(time * swimSpeed * 2) * 0.02;
    whaleRef.current.lookAt(x, lookAtY, z - 5);

    // SUBTLE VERTICAL SWIMMING MOTION (realistic whale movement)
    const swimFrequency = 1.2;
    const swimAmplitude = 0.08; // Much smaller amplitude

    // Primary vertical wave motion - very subtle
    const verticalWave = Math.sin(time * swimFrequency) * swimAmplitude;

    // Apply SUBTLE vertical swimming motion
    rigRef.current.rotation.x = verticalWave * 0.15; // Much gentler pitch motion
    rigRef.current.rotation.z = verticalWave * 0.03; // Very minimal roll
    rigRef.current.rotation.y = Math.sin(time * 0.4) * 0.02; // Very slight yaw

    // PROGRAMMATIC VERTEX DEFORMATION FOR REALISTIC SWIMMING (if available)
    if (originalGeometries.size > 0) {
      rigRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && originalGeometries.has(child)) {
          const originalPositions = originalGeometries.get(child)!;
          const positions = child.geometry.attributes.position
            .array as Float32Array;

          // Apply vertical swimming wave deformation to vertices
          for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i] ?? 0;
            const y = originalPositions[i + 1] ?? 0;
            const z = originalPositions[i + 2] ?? 0;

            // Calculate wave based on X position (length of whale)
            const wavePhase = (x + 2) * 0.8;
            const verticalWave = Math.sin(time * 1.8 + wavePhase) * 0.06; // Much smaller
            const tailVertical =
              Math.sin(time * 1.8 + wavePhase + Math.PI * 0.6) * 0.08; // Much smaller

            // Apply very subtle vertical undulation
            // Y-axis (vertical) undulation - gentle towards tail
            const tailFactor = Math.max(0, -x + 1);
            positions[i + 1] =
              y +
              verticalWave * Math.abs(x) * 0.08 +
              tailVertical * tailFactor * 0.12;

            // Minimal side-to-side motion (whales don't swim like fish)
            positions[i + 2] = z + Math.sin(time * 1.5 + wavePhase) * 0.02;

            // Very subtle body compression/extension
            const bodyFlex = Math.sin(time * 1.8 + wavePhase * 0.5) * 0.02;
            positions[i] = x + bodyFlex * Math.abs(x) * 0.05;
          }

          // Mark geometry as needing update
          child.geometry.attributes.position.needsUpdate = true;
          child.geometry.computeVertexNormals();
        }
      });
    }

    // Very subtle additional vertical swimming motion
    const additionalVertical = Math.sin(time * 0.6) * 0.03;
    rigRef.current.position.y += additionalVertical;

    // Very gentle pitch for diving/surfacing
    const pitch = Math.sin(time * 0.8) * 0.02;
    rigRef.current.rotation.x += pitch;

    // Scale and opacity based on scroll progress for smooth fade in/out
    const scale = 0.5 * Math.min(1, scrollProgress * 2);
    rigRef.current.scale.setScalar(scale);

    const opacity = Math.min(1, scrollProgress * 2);
    rigRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshPhongMaterial;
        material.opacity = 0.8 * opacity;
        material.needsUpdate = true;
      }
    });
  });

  return (
    <group ref={whaleRef}>
      <group ref={rigRef} scale={[0.5, 0.5, 0.5]}>
        <primitive object={whaleObj.clone()} />
      </group>
    </group>
  );
}

// Main whale component with error boundary
function SwimmingWhale({
  animationEnabled,
  scrollProgress,
}: {
  animationEnabled: boolean;
  scrollProgress: number;
}) {
  return (
    <Suspense
      fallback={
        <FallbackWhale
          animationEnabled={animationEnabled}
          scrollProgress={scrollProgress}
        />
      }
    >
      <OBJWhale
        animationEnabled={animationEnabled}
        scrollProgress={scrollProgress}
      />
    </Suspense>
  );
}

export function BackgroundWhale({
  width = "100%",
  height = window.innerHeight * 2.5, // Reduced to 250vh to end before Deployment Details
  className = "",
  animationEnabled = true,
}: {
  width?: number | string;
  height?: number;
  className?: string;
  animationEnabled?: boolean;
}): React.ReactElement {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [_whaleVisible, setWhaleVisible] = useState(false);

  // Use performance manager for Three.js scenes
  const { shouldRender, updateVisibility } = useThreeJSPerformance("background-whale", 3); // Lowest priority

  // Use intersection observer for performance
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
    throttleMs: 32, // Reduce update frequency
  });

  // Update performance manager when visibility changes
  useEffect(() => {
    updateVisibility(isIntersecting);
  }, [isIntersecting, updateVisibility]);

  // Responsive dimensions
  const [actualHeight, setActualHeight] = useState<number>(height);

  useEffect(() => {
    function handleResize() {
      // Use 250vh for height to end before Deployment Details
      setActualHeight(window.innerHeight * 2.5);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GSAP ScrollTrigger setup (similar to activate component)
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const element = containerRef.current;

    // Main scroll animation timeline with smooth entry/exit
    gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top bottom", // Start when whale section enters bottom of viewport
        end: "bottom top", // End when whale section exits top of viewport
        scrub: 1.5,
        onUpdate: (self) => {
          const progress = self.progress;
          setScrollProgress(progress);
          setWhaleVisible(isIntersecting);
        },
        onToggle: (self) => {
          setWhaleVisible(self.isActive && isIntersecting);
        },
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [isIntersecting, containerRef.current]);

  // Scene positioning with improved fade handling (like activate component)
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const element = containerRef.current;

    // Setup scene positioning ScrollTrigger with smooth entry/exit animations
    const positionTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const sceneElement = element.querySelector(
          ".whale-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          const progress = self.progress;

          // Smooth scale animation - grow from nothing, stay full size, then shrink to nothing
          let scale = 1;
          if (progress < 0.15) {
            scale = progress / 0.15; // 0 to 1.0 (grow from nothing)
          } else if (progress > 0.85) {
            scale = 1.0 - ((progress - 0.85) / 0.15); // 1.0 to 0 (shrink to nothing)
          }

          // Smooth opacity animation
          let opacity = 1;
          if (progress < 0.1) {
            opacity = progress / 0.1; // Fade in
          } else if (progress > 0.9) {
            opacity = 1 - (progress - 0.9) / 0.1; // Fade out
          }

          sceneElement.style.transform = `scale(${scale})`;
          sceneElement.style.opacity = opacity.toString();
        }
      },
      onEnter: () => {
        // When entering the section, fix the scene in place
        const sceneElement = element.querySelector(
          ".whale-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.position = "fixed";
          sceneElement.style.top = "0";
          sceneElement.style.left = "0";
          sceneElement.style.width = "100vw";
          sceneElement.style.height = "100vh";
          sceneElement.style.zIndex = "-1"; // Behind all content
          sceneElement.style.transition = "none"; // Smooth updates via onUpdate
        }
      },
      onLeave: () => {
        // When leaving the section, shrink to nothing with smooth transition
        const sceneElement = element.querySelector(
          ".whale-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.transition = "opacity 0.6s ease-in, transform 0.6s ease-in";
          sceneElement.style.opacity = "0";
          sceneElement.style.transform = "scale(0)"; // Shrink completely to nothing
        }
      },
      onLeaveBack: () => {
        // When leaving back, shrink to nothing with smooth transition
        const sceneElement = element.querySelector(
          ".whale-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.transition = "opacity 0.6s ease-in, transform 0.6s ease-in";
          sceneElement.style.opacity = "0";
          sceneElement.style.transform = "scale(0)"; // Shrink completely to nothing
        }
      },
      onEnterBack: () => {
        // When re-entering from below, grow from nothing to full size
        const sceneElement = element.querySelector(
          ".whale-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.position = "fixed";
          sceneElement.style.top = "0";
          sceneElement.style.left = "0";
          sceneElement.style.width = "100vw";
          sceneElement.style.height = "100vh";
          sceneElement.style.zIndex = "-1";
          sceneElement.style.transform = "scale(0)"; // Start from nothing
          sceneElement.style.opacity = "0";
          sceneElement.style.transition = "none";

          // Force a reflow to ensure the styles are applied
          sceneElement.offsetHeight;

          // Then grow and fade in smoothly
          requestAnimationFrame(() => {
            if (sceneElement) {
              sceneElement.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
              sceneElement.style.opacity = "1";
              sceneElement.style.transform = "scale(1)"; // Grow to full size
            }
          });
        }
      },
    });

    return () => {
      positionTrigger.kill();
    };
  }, [containerRef.current]);

  const shouldRenderCanvas = shouldRender && isIntersecting;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: typeof width === "number" ? width : "100%",
        height: actualHeight,
        maxWidth: "100vw",
        minHeight: actualHeight,
        touchAction: "pan-y",
      }}
    >
      {shouldRenderCanvas && (
        <div
          className="whale-canvas"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: -1, // Behind all content
            pointerEvents: "none",
          }}
        >
          <Canvas
            style={{
              width: "100vw",
              height: "100vh",
              background: "transparent",
            }}
            camera={{ position: [0, 3, 10], fov: 65 }}
            gl={{ antialias: true, alpha: true }}
          >
            {/* Enhanced lighting to match cloud style */}
            <ambientLight color={0x87ceeb} intensity={0.4} />
            <directionalLight
              color={0xffffff}
              intensity={0.6}
              position={[5, 5, 5]}
            />
            <pointLight color={0x4da6ff} intensity={0.3} position={[0, 0, 5]} />

            {/* Swimming whale with error boundary */}
            <SwimmingWhale
              animationEnabled={animationEnabled}
              scrollProgress={scrollProgress}
            />
          </Canvas>
        </div>
      )}
    </div>
  );
}

export default BackgroundWhale;
