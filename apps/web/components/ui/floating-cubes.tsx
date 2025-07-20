"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FloatingCubesProps {
  width?: number | "100%";
  height?: number;
  className?: string;
  animationEnabled?: boolean;
  direction?: "left-to-right" | "right-to-left";
}

export function FloatingCubes({
  width = 400,
  height = 600,
  className = "",
  animationEnabled = true,
  direction = "left-to-right",
}: FloatingCubesProps): React.ReactElement {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cubesRef = useRef<THREE.Group[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [actualWidth, setActualWidth] = useState<number>(
    typeof width === "number"
      ? width
      : typeof window !== "undefined"
        ? window.innerWidth
        : 400
  );
  const [actualHeight, setActualHeight] = useState(height);
  const [isInViewport, setIsInViewport] = useState(false);
  const lastTimeRef = useRef<number>(0);

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (mountRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        setActualWidth(
          rect.width || (typeof width === "number" ? width : window.innerWidth)
        );
        setActualHeight(rect.height || height);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [width, height]);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (!mountRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry?.isIntersecting ?? false);
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
        rootMargin: "50px", // Start animation slightly before entering viewport
      }
    );

    observer.observe(mountRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - much wider field of view to cover full screen width
    const camera = new THREE.PerspectiveCamera(
      120,
      actualWidth / actualHeight,
      0.1,
      1000
    );
    camera.position.z = 4; // Moved closer to see more area
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(actualWidth, actualHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create floating cubes
    const createCube = (x: number, y: number, z: number) => {
      const cubeGroup = new THREE.Group();

      // Cube geometry
      const cubeSize = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
      const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

      // Create edges geometry for wireframe effect
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffff, // Bright cyan color for better visibility
        transparent: true,
        opacity: 1.0, // Full opacity for edges
      });

      const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);

      // Add solid cube with transparent material (starts fully transparent)
      const solidMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aacc, // Lighter cyan for solid parts
        transparent: true,
        opacity: 0.0, // Start fully transparent (wireframe only)
      });
      const solidCube = new THREE.Mesh(geometry, solidMaterial);

      cubeGroup.add(wireframe);
      cubeGroup.add(solidCube);

      // Random initial rotation
      wireframe.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      solidCube.rotation.copy(wireframe.rotation);

      cubeGroup.position.set(x, y, z);
      scene.add(cubeGroup);

      return cubeGroup;
    };

    // Create more cubes across the full width of the screen
    const aspectRatio = actualWidth / actualHeight;
    const numCubes = Math.max(15, Math.floor(aspectRatio * 8)); // Scale with aspect ratio
    const rangeX = Math.max(20, aspectRatio * 15); // Wider range for wider screens
    const startX = direction === "left-to-right" ? -rangeX : rangeX;

    // Calculate safe Y boundaries to prevent clipping
    const safeYRange = 8; // Reduced from 12 to add buffer
    const _safeYBuffer = 2; // Buffer zone at top and bottom

    for (let i = 0; i < numCubes; i++) {
      const x = startX + (Math.random() - 0.5) * (rangeX * 0.4); // Start off-screen with wider spread
      const y = (Math.random() - 0.5) * safeYRange; // Constrained Y range to prevent clipping
      const z = (Math.random() - 0.5) * 8; // Deeper range for 3D effect

      const cube = createCube(x, y, z);
      cubesRef.current.push(cube);
    }

    // Trigger fade-in
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Start animation if enabled
    if (animationEnabled) {
      lastTimeRef.current = performance.now();
    }

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (
        mountRef.current &&
        renderer.domElement &&
        mountRef.current.contains(renderer.domElement)
      ) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      cubesRef.current = [];
    };
  }, [direction, actualHeight, actualWidth, animationEnabled]);

  // Animation loop
  useEffect(() => {
    if ((!animationEnabled || !isInViewport) && animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    } else if (
      animationEnabled &&
      isInViewport &&
      !animationIdRef.current &&
      sceneRef.current &&
      rendererRef.current
    ) {
      const animate = (time: number) => {
        if (animationEnabled && isInViewport) {
          animationIdRef.current = requestAnimationFrame(animate);
        }

        const _deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Animate cubes
        const safeYRange = 8; // Safe Y range for boundary constraints
        cubesRef.current.forEach((cubeGroup, index) => {
          // Move cubes horizontally across wider range
          const speed = 0.02 + Math.random() * 0.01; // Varying speeds
          if (direction === "left-to-right") {
            cubeGroup.position.x += speed;

            // Calculate visibility based on position
            // Cubes are invisible when x < -15, fully visible from -10 to 15, then fade out from 15 to 20
            const wireframe = cubeGroup.children[0] as THREE.LineSegments;
            const solidCube = cubeGroup.children[1] as THREE.Mesh;

            let opacity = 0;
            if (cubeGroup.position.x < -15) {
              // Completely invisible when far left
              opacity = 0;
            } else if (cubeGroup.position.x < -10) {
              // Fade in from left edge (-15 to -10)
              opacity = (cubeGroup.position.x + 15) / 5;
            } else if (cubeGroup.position.x < 15) {
              // Fully visible in middle section (-10 to 15)
              opacity = 1;
            } else if (cubeGroup.position.x < 20) {
              // Fade out on right edge (15 to 20)
              opacity = (20 - cubeGroup.position.x) / 5;
            } else {
              // Completely invisible when far right
              opacity = 0;
            }

            if (wireframe.material instanceof THREE.LineBasicMaterial) {
              wireframe.material.opacity = opacity;
            }

            if (solidCube.material instanceof THREE.MeshBasicMaterial) {
              solidCube.material.opacity = opacity * 0.7; // Solid is slightly more transparent
            }

            // Reset position when cube goes off-screen
            if (cubeGroup.position.x > 20) {
              cubeGroup.position.x = -20;
              cubeGroup.position.y = (Math.random() - 0.5) * safeYRange; // Use safe Y range
              cubeGroup.position.z = (Math.random() - 0.5) * 8;
            }
          } else {
            cubeGroup.position.x -= speed;

            // Calculate visibility based on position for right-to-left
            // Cubes are invisible when x > 15, fully visible from 10 to -15, then fade out from -15 to -20
            const wireframe = cubeGroup.children[0] as THREE.LineSegments;
            const solidCube = cubeGroup.children[1] as THREE.Mesh;

            let opacity = 0;
            if (cubeGroup.position.x > 15) {
              // Completely invisible when far right
              opacity = 0;
            } else if (cubeGroup.position.x > 10) {
              // Fade in from right edge (15 to 10)
              opacity = (15 - cubeGroup.position.x) / 5;
            } else if (cubeGroup.position.x > -15) {
              // Fully visible in middle section (10 to -15)
              opacity = 1;
            } else if (cubeGroup.position.x > -20) {
              // Fade out on left edge (-15 to -20)
              opacity = (cubeGroup.position.x + 20) / 5;
            } else {
              // Completely invisible when far left
              opacity = 0;
            }

            if (wireframe.material instanceof THREE.LineBasicMaterial) {
              wireframe.material.opacity = opacity;
            }

            if (solidCube.material instanceof THREE.MeshBasicMaterial) {
              solidCube.material.opacity = opacity * 0.7; // Solid is slightly more transparent
            }

            // Reset position when cube goes off-screen
            if (cubeGroup.position.x < -20) {
              cubeGroup.position.x = 20;
              cubeGroup.position.y = (Math.random() - 0.5) * safeYRange; // Use safe Y range
              cubeGroup.position.z = (Math.random() - 0.5) * 8;
            }
          }

          // Rotate cubes for dynamic effect
          cubeGroup.children.forEach((child) => {
            if (
              child instanceof THREE.LineSegments ||
              child instanceof THREE.Mesh
            ) {
              child.rotation.x += 0.01;
              child.rotation.y += 0.015;
              child.rotation.z += 0.005;
            }
          });

          // Add subtle floating motion with boundary constraints
          const floatingY = Math.sin(time * 0.001 + index) * 0.002;
          const newY = cubeGroup.position.y + floatingY;

          // Keep cubes within safe Y boundaries (-4 to 4 with buffer)
          if (newY > -4 && newY < 4) {
            cubeGroup.position.y = newY;
          }

          cubeGroup.position.z += Math.cos(time * 0.0015 + index) * 0.001;
        });

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };

      lastTimeRef.current = performance.now();
      animate(lastTimeRef.current);
    }
  }, [animationEnabled, isInViewport, direction]);

  return (
    <div
      ref={mountRef}
      className={`inline-block transition-opacity duration-1000 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ width: width === "100%" ? "100%" : width, height }}
    />
  );
}
