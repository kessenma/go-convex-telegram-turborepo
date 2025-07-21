"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { useIntersectionObserver } from "../../../hooks/use-intersection-observer";

// Register GSAP ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ActivateAnimationProps {
  scrollProgress: number;
  isVisible: boolean;
  isMobile: boolean;
  connectionProgress: number;
  animationEnabled: boolean;
}

// Scene controller for camera and rotation
function SceneController({
  connectionProgress,
  animationEnabled,
  children,
}: {
  connectionProgress: number;
  animationEnabled: boolean;
  children: React.ReactNode;
}) {
  const { camera, scene } = useThree();
  const sceneRef = useRef<THREE.Group>(null!);
  const plateRotation = useRef(0);

  useFrame(() => {
    if (!sceneRef.current || !animationEnabled) return;

    // Constant plate rotation - both objects rotate together as if on a plate
    plateRotation.current += 0.01;

    // Apply the rotation to the scene
    sceneRef.current.rotation.y = plateRotation.current;
  });

  return <group ref={sceneRef}>{children}</group>;
}

// Green container component that starts the animation (matching the container.tsx style)
function GreenContainer({
  scrollProgress,
  isVisible,
  isMobile,
  connectionProgress,
  animationEnabled,
}: ActivateAnimationProps) {
  const containerRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!containerRef.current || !isVisible || !animationEnabled) return;

    // Phase 1: Container appears gradually (0-40% of scroll) - similar to coolify-timeline
    const containerProgress = Math.max(0, Math.min(1, scrollProgress / 0.4));

    // Container slides in from left
    const startX = -6; // Start further left
    const endX = -2; // End position
    const currentX = startX + (endX - startX) * containerProgress;
    containerRef.current.position.set(currentX, 0, 0);

    // Scale-up animation - starts small and grows (like coolify-timeline and brain)
    const scaleMultiplier = Math.min(1, containerProgress * 2); // Scale up during first half of appearance
    containerRef.current.scale.setScalar(scaleMultiplier);

    // No individual rotation - rotation handled by plate in SceneController
    containerRef.current.rotation.set(0, 0, 0);

    // Apply opacity based on scroll progress (like coolify-timeline)
    const opacity = Math.min(1, containerProgress * 2);
    containerRef.current.children.forEach((child) => {
      if ("material" in child && child.material) {
        const material = child.material as any;
        if (material.opacity !== undefined) {
          const baseOpacity = child.type === "LineSegments" ? 0.8 : 0.2; // Increased opacity for bolder lines
          material.opacity = baseOpacity * opacity;
        }
      }
    });
  });

  const containerWidth = isMobile ? 1.5 : 2;
  const containerHeight = isMobile ? 1 : 1.25;
  const containerDepth = isMobile ? 1 : 1.25;

  return React.createElement(
    "group" as any,
    { ref: containerRef },
    // Container wireframe (matching container.tsx exactly)
    React.createElement(
      "lineSegments" as any,
      {},
      React.createElement("edgesGeometry" as any, {
        args: [
          new THREE.BoxGeometry(
            containerWidth,
            containerHeight,
            containerDepth
          ),
        ],
      }),
      React.createElement("lineBasicMaterial" as any, {
        color: 0x53eafd,
        transparent: true,
        opacity: 0.8,
        linewidth: 5,
      })
    )
  );
}

// Brain model component
function BrainModel({
  scrollProgress,
  isVisible,
  isMobile,
  connectionProgress,
  animationEnabled,
}: ActivateAnimationProps) {
  const brainRef = useRef<THREE.Group>(null!);
  const [brainLoaded, setBrainLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load the brain OBJ model
  let brainObj: THREE.Group | null = null;
  try {
    brainObj = useLoader(OBJLoader, "/brain.obj");
  } catch (_error) {
    console.warn("Failed to load brain.obj, using fallback");
  }

  useEffect(() => {
    if (brainObj) {
      setBrainLoaded(true);
      setUseFallback(false);

      // Set up brain materials with normal opacity
      brainObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            shininess: 30,
          });
        }
      });
    } else {
      setUseFallback(true);
    }
  }, [brainObj]);

  useFrame(() => {
    if (!brainRef.current || !isVisible || !animationEnabled) return;

    // Phase 1: Brain appears and scales up (0-40% of scroll) - similar to coolify-timeline
    const brainProgress = Math.max(0, Math.min(1, scrollProgress / 0.4));

    // Scale-up animation - starts small and grows (like coolify-timeline)
    const baseScale = isMobile ? 0.8 : 1.2;
    const scaleMultiplier = Math.min(1, brainProgress * 2); // Scale up during first half of appearance
    brainRef.current.scale.setScalar(baseScale * scaleMultiplier);

    // Brain slides in from right
    const startX = isMobile ? 6 : 8; // Start further right
    const endX = isMobile ? 2.5 : 3.5; // End position
    const currentX = startX - (startX - endX) * brainProgress;
    brainRef.current.position.set(currentX, 0, 0);

    // No individual rotation - rotation handled by plate in SceneController
    brainRef.current.rotation.set(0, 0, 0);

    // Apply opacity based on scroll progress (like coolify-timeline)
    const opacity = Math.min(1, brainProgress * 2);
    brainRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as any;
        if (material.opacity !== undefined) {
          material.opacity = 0.8 * opacity;
          material.needsUpdate = true;
        }
      }
    });

    // Also handle fallback meshes if they exist
    if (brainRef.current.userData.fallbackMeshes) {
      brainRef.current.userData.fallbackMeshes.forEach((mesh: THREE.Mesh) => {
        if (mesh.material) {
          const material = mesh.material as any;
          if (material.opacity !== undefined) {
            material.opacity = 0.8 * opacity;
            material.needsUpdate = true;
          }
        }
      });
    }

    // Phase 4: Lighting intensifies and color changes when line connects (using connectionProgress)
    if (connectionProgress > 0) {
      // Handle both OBJ model and fallback brain
      const processColorChange = (object: THREE.Object3D) => {
        if ("material" in object && object.material) {
          const material = object.material as any;
          if (material.emissive !== undefined) {
            // Intense lighting effect - change to green emissive
            material.emissive.setHex(0x53eafd);
            material.emissiveIntensity = connectionProgress * 0.3;
          }
          // Change brain color to match container green
          if (material.color) {
            const baseColor = new THREE.Color(0xffffff); // Original orange
            const containerColor = new THREE.Color(0x53eafd); // Container green
            material.color.lerpColors(
              baseColor,
              containerColor,
              connectionProgress
            );
          }
        }
      };

      // Process direct children (for OBJ model)
      brainRef.current.children.forEach(processColorChange);

      // Process fallback meshes if they exist
      if (brainRef.current.userData.fallbackMeshes) {
        brainRef.current.userData.fallbackMeshes.forEach(processColorChange);
      }

      // Also traverse all descendants to catch nested meshes
      brainRef.current.traverse(processColorChange);
    }
  });

  // Fallback brain representation with refs for material access
  const FallbackBrain = () => {
    const mainBrainRef = useRef<THREE.Mesh>(null!);
    const brainStemRef = useRef<THREE.Mesh>(null!);

    // Store refs in parent component for color changes
    useEffect(() => {
      if (mainBrainRef.current && brainStemRef.current) {
        // Add these meshes to the brain group so they can be found by the color change logic
        if (brainRef.current) {
          brainRef.current.userData.fallbackMeshes = [
            mainBrainRef.current,
            brainStemRef.current,
          ];
        }
      }
    }, []);

    return React.createElement(
      "group" as any,
      {},
      // Main brain shape
      React.createElement(
        "mesh" as any,
        {
          ref: mainBrainRef,
          position: [0, 0, 0],
        },
        React.createElement("sphereGeometry" as any, { args: [0.8, 16, 12] }),
        React.createElement("meshPhongMaterial" as any, {
          color: 0xffffff,
          transparent: true,
          opacity: 0.8, // Normal opacity like the OBJ model
          shininess: 30,
        })
      ),
      // Brain stem
      React.createElement(
        "mesh" as any,
        {
          ref: brainStemRef,
          position: [0, -0.6, 0],
        },
        React.createElement("cylinderGeometry" as any, {
          args: [0.2, 0.3, 0.4, 8],
        }),
        React.createElement("meshPhongMaterial" as any, {
          color: 0xcc8400,
          transparent: true,
          opacity: 0.8,
        })
      )
    );
  };

  return React.createElement(
    "group" as any,
    { ref: brainRef },
    useFallback || !brainLoaded
      ? React.createElement(FallbackBrain)
      : brainObj &&
          React.createElement("primitive", { object: brainObj.clone() })
  );
}

// Connection line component
function ConnectionLine({
  scrollProgress,
  isVisible,
  isMobile,
  connectionProgress,
}: ActivateAnimationProps) {
  const lineRef = useRef<THREE.Line>(null!);
  const [lineGeometry, setLineGeometry] = useState<THREE.BufferGeometry | null>(
    null
  );

  useEffect(() => {
    // Create line geometry
    const geometry = new THREE.BufferGeometry();
    const startPoint = new THREE.Vector3(-1, 0, 0);
    const endPoint = new THREE.Vector3(isMobile ? 2.5 : 3.5, 0, 0);

    const points = [startPoint, endPoint];
    geometry.setFromPoints(points);
    setLineGeometry(geometry);

    return () => {
      geometry.dispose();
    };
  }, [isMobile]);

  useFrame(() => {
    if (!lineRef.current || !isVisible || !lineGeometry) return;

    // Phase 2: Line moves from container to brain (40-60% of scroll) - starts after objects are in place
    const lineProgress = Math.max(0, Math.min(1, (scrollProgress - 0.4) / 0.2));

    // Update line geometry to show progressive drawing
    const startPoint = new THREE.Vector3(-1, 0, 0); // Start from container edge
    const endPoint = new THREE.Vector3(isMobile ? 2.5 : 3.5, 0, 0); // End at brain

    const currentEndPoint = startPoint.clone().lerp(endPoint, lineProgress);
    const points = [startPoint, currentEndPoint];

    lineGeometry.setFromPoints(points);
    if (lineGeometry.attributes.position) {
      lineGeometry.attributes.position.needsUpdate = true;
    }

    // Line opacity - only visible during line movement phase
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    const lineVisible = scrollProgress >= 0.4;
    material.opacity = lineVisible ? 1.0 : 0; // Increased opacity for bolder line

    // Phase 4: Line pulses when connection is made (using connectionProgress)
    if (connectionProgress > 0) {
      // Pulse effect when connected
      const pulse = Math.sin(Date.now() * 0.008) * 0.4 + 0.6;
      material.color.setHex(0x53eafd);
      material.opacity = pulse;
    }
  });

  if (!lineGeometry) return null;

  return React.createElement(
    "line" as any,
    { ref: lineRef },
    React.createElement("primitive", { object: lineGeometry }),
    React.createElement("lineBasicMaterial" as any, {
      color: 0x53eafd,
      transparent: true,
      opacity: 0.8,
      linewidth: 3,
    })
  );
}

// Main activate component
export function Activate({
  width = "100%",
  height = window.innerHeight * 2, // 200vh
  className = "",
  animationEnabled = true,
}: {
  width?: number | string;
  height?: number;
  className?: string;
  animationEnabled?: boolean;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [activateVisible, setActivateVisible] = useState(false);

  // Use intersection observer for performance
  const { ref: activateRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Debug logging
  useEffect(() => {
    console.log("Activate component state:", {
      isIntersecting,
      activateVisible,
      scrollProgress,
      shouldRenderCanvas: isIntersecting,
    });
  }, [isIntersecting, activateVisible, scrollProgress]);

  // Responsive width/height
  const [actualWidth, setActualWidth] = useState<number>(0);
  const [actualHeight, setActualHeight] = useState<number>(height);

  useEffect(() => {
    function handleResize() {
      const w = activateRef.current?.offsetWidth || window.innerWidth;
      setActualWidth(w < 500 ? w : typeof width === "number" ? width : 800);
      // Always use 200vh for height
      setActualHeight(window.innerHeight * 2);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, activateRef.current?.offsetWidth]);

  // GSAP ScrollTrigger setup
  useEffect(() => {
    if (!activateRef.current || typeof window === "undefined") return;

    const element = activateRef.current;

    // Main scroll animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: element,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Smooth scrubbing
        onUpdate: (self) => {
          const progress = self.progress;
          setScrollProgress(progress);
          setActivateVisible(isIntersecting); // Always show when intersecting

          // Scene rotation is now handled continuously in SceneController

          // Connection progress starts at 60% of scroll (earlier for longer brain color duration)
          const connectionStart = 0.6;
          if (progress >= connectionStart) {
            const connProgress =
              (progress - connectionStart) / (1 - connectionStart);
            setConnectionProgress(connProgress);
          } else {
            setConnectionProgress(0);
          }
        },
        onToggle: (self) => {
          setActivateVisible(self.isActive && isIntersecting);
        },
      },
    });

    // Add rotation animation
    tl.to(
      {},
      {
        duration: 1,
        ease: "power2.inOut",
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [isIntersecting, activateRef.current]);

  // Separate effect for scene positioning with improved fade handling
  useEffect(() => {
    if (!activateRef.current || typeof window === "undefined") return;

    const element = activateRef.current;

    // Setup scene positioning ScrollTrigger with graceful exit
    const positionTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      onEnter: () => {
        // When entering the section, fix the scene in place
        const sceneElement = element.querySelector(
          ".three-js-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.position = "fixed";
          sceneElement.style.top = "0";
          sceneElement.style.left = "0";
          sceneElement.style.width = "100vw";
          sceneElement.style.height = "100vh";
          sceneElement.style.transform = "none";
          sceneElement.style.opacity = "1";
          sceneElement.style.transition =
            "opacity 0.3s ease-out, transform 0.3s ease-out";
        }
      },
      onLeave: () => {
        // When leaving the section (scrolling down), fade out gracefully
        const sceneElement = element.querySelector(
          ".three-js-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.transition =
            "opacity 0.4s ease-out, transform 0.4s ease-out";
          sceneElement.style.opacity = "0";
          sceneElement.style.transform = "scale(0.95)";

          // After fade completes, move to absolute positioning
          setTimeout(() => {
            if (sceneElement && sceneElement.style.opacity === "0") {
              sceneElement.style.position = "absolute";
              sceneElement.style.top = "100vh";
              sceneElement.style.left = "0";
              sceneElement.style.width = "100vw";
              sceneElement.style.height = "100vh";
            }
          }, 400);
        }
      },
      onLeaveBack: () => {
        // When leaving the section (scrolling up), fade out gracefully
        const sceneElement = element.querySelector(
          ".three-js-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          sceneElement.style.transition =
            "opacity 0.4s ease-out, transform 0.4s ease-out";
          sceneElement.style.opacity = "0";
          sceneElement.style.transform = "scale(0.95)";

          setTimeout(() => {
            if (sceneElement && sceneElement.style.opacity === "0") {
              sceneElement.style.position = "absolute";
              sceneElement.style.top = "0";
              sceneElement.style.left = "0";
              sceneElement.style.width = "100vw";
              sceneElement.style.height = "100vh";
            }
          }, 400);
        }
      },
      onEnterBack: () => {
        // When re-entering from below, set up for smooth fade-in
        const sceneElement = element.querySelector(
          ".three-js-canvas"
        ) as HTMLElement;
        if (sceneElement) {
          // Clear any pending timeouts and reset positioning immediately
          sceneElement.style.position = "fixed";
          sceneElement.style.top = "0";
          sceneElement.style.left = "0";
          sceneElement.style.width = "100vw";
          sceneElement.style.height = "100vh";
          sceneElement.style.transform = "scale(0.95)";
          sceneElement.style.opacity = "0";
          sceneElement.style.transition = "none";

          // Force a reflow to ensure the styles are applied
          sceneElement.offsetHeight;

          // Then fade in smoothly
          requestAnimationFrame(() => {
            if (sceneElement) {
              sceneElement.style.transition =
                "opacity 0.5s ease-out, transform 0.5s ease-out";
              sceneElement.style.opacity = "1";
              sceneElement.style.transform = "none";
            }
          });
        }
      },
    });

    return () => {
      positionTrigger.kill();
    };
  }, [activateRef.current]); // Run when canvas becomes visible

  const isMobile = actualWidth < 500;
  const shouldRenderCanvas = isIntersecting; // Show canvas whenever the component is in view

  return (
    <div
      ref={activateRef}
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
          className="three-js-canvas"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 1,
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 16], fov: 75 }}
            style={{
              width: "100vw",
              height: "100vh",
              background: "transparent",
            }}
            gl={{ antialias: true, alpha: true }}
          >
            <SceneController
              connectionProgress={connectionProgress}
              animationEnabled={animationEnabled}
            >
              {/* Enhanced lighting for brain */}
              <ambientLight color={0x4da6ff} intensity={0.3} />
              <directionalLight
                color={0x87ceeb}
                intensity={0.5}
                position={[5, 5, 5]}
              />
              <pointLight
                color={0xffffff}
                intensity={0.4}
                position={[3, 0, 3]}
              />

              {/* Green container */}
              <GreenContainer
                scrollProgress={scrollProgress}
                isVisible={isIntersecting}
                isMobile={isMobile}
                connectionProgress={connectionProgress}
                animationEnabled={animationEnabled}
              />

              {/* Connection line */}
              <ConnectionLine
                scrollProgress={scrollProgress}
                isVisible={isIntersecting}
                isMobile={isMobile}
                connectionProgress={connectionProgress}
                animationEnabled={animationEnabled}
              />

              {/* Brain model */}
              <BrainModel
                scrollProgress={scrollProgress}
                isVisible={isIntersecting}
                isMobile={isMobile}
                connectionProgress={connectionProgress}
                animationEnabled={animationEnabled}
              />
            </SceneController>
          </Canvas>
        </div>
      )}
    </div>
  );
}

export default Activate;
