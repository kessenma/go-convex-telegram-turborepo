"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Ensure this component is only rendered on the client side
const ThreeJSUploadIconComponent = dynamic(
  () => Promise.resolve(ThreeJSUploadIconImpl),
  {
    ssr: false,
  }
) as React.ComponentType<ThreeJSUploadIconProps>;

// Export the client-side only component
export function ThreeJSUploadIcon(
  props: ThreeJSUploadIconProps
): React.ReactElement {
  return React.createElement(ThreeJSUploadIconComponent, props);
}

interface ThreeJSUploadIconProps {
  width?: number;
  height?: number;
  className?: string;
  animationEnabled?: boolean;
}

// Implementation that will only be rendered on client-side
function ThreeJSUploadIconImpl({
  width = 600,
  height = 300,
  className = "",
  animationEnabled = true,
}: ThreeJSUploadIconProps): React.ReactElement {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const documentsRef = useRef<THREE.Group[]>([]);
  const dataStreamsRef = useRef<THREE.Group[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<THREE.Points | null>(null);
  const documentTimersRef = useRef<
    {
      group: THREE.Group;
      timer: number;
      isVisible: boolean;
      fadeOpacity: number;
    }[]
  >([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content to prevent duplication
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup with optimized FOV
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 50);
    camera.position.z = 6;

    // Renderer setup with optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Reusable material creation
    const _createMaterial = (color: number, opacity: number) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
      });

    // Function to create a simple rotating cube document
    const createDocument = (x: number, y: number, _index: number) => {
      const documentGroup = new THREE.Group();

      // Simple cube geometry with consistent sizing
      const cubeSize = 0.6 + Math.random() * 0.2; // 0.6 to 0.8
      const docGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

      // All documents use cyan color
      const docColor = 0x06b6d4; // #06b6d4 (cyan-500)

      // Create edges geometry to show only cube borders (no cross-hatch)
      const edgesGeometry = new THREE.EdgesGeometry(docGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: docColor,
        transparent: true,
        opacity: 0.8,
      });

      const document = new THREE.LineSegments(edgesGeometry, edgesMaterial);

      // Simple initial rotation
      const randomRotationX = (Math.random() - 0.5) * 0.4;
      const randomRotationY = (Math.random() - 0.5) * 0.4;
      const randomRotationZ = (Math.random() - 0.5) * 0.4;
      document.rotation.set(randomRotationX, randomRotationY, randomRotationZ);

      documentGroup.add(document);
      documentGroup.position.set(x, y, 0);
      documentGroup.scale.setScalar(0);
      scene.add(documentGroup);

      return documentGroup;
    };

    // Create multiple documents at different positions
    const documentPositions = [
      { x: -2, y: 0.5 },
      { x: -1, y: -0.5 },
      { x: 0, y: 1 },
      { x: 1, y: -0.2 },
      { x: 2, y: 0.8 },
    ];

    documentPositions.forEach((pos, index) => {
      const doc = createDocument(pos.x, pos.y, index);
      documentsRef.current.push(doc);
      documentTimersRef.current.push({
        group: doc,
        timer: 2000 + index * 3000 + Math.random() * 3000, // Staggered timing: 1-2.5s, 3-4.5s, 5-6.5s, etc.
        isVisible: false,
        fadeOpacity: 1,
      });
    });

    // Create upward flowing particles
    const particleCount = 60; // Reduced from 100
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6; // X
      positions[i * 3 + 1] = -3 + Math.random() * 6; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // Z

      velocities[i * 3] = (Math.random() - 0.5) * 0.005; // X velocity (reduced)
      velocities[i * 3 + 1] = 0.005 + Math.random() * 0.01; // Y velocity (reduced)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005; // Z velocity (reduced)

      colors[i * 3] = 0.2 + Math.random() * 0.8; // R
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; // G
      colors[i * 3 + 2] = 1; // B
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
    particleGeometry.setAttribute(
      "velocity",
      new THREE.BufferAttribute(velocities, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    // Create upload streams for each document position
    documentPositions.forEach((pos, _index) => {
      const streamGroup = new THREE.Group();
      const points = [];

      // Create upward stream from document position
      for (let j = 0; j <= 30; j++) {
        const t = j / 30;
        const x = pos.x + Math.sin(t * Math.PI * 2) * 0.1;
        const y = pos.y + t * 3; // Go upward
        const z = Math.cos(t * Math.PI * 3) * 0.05;
        points.push(new THREE.Vector3(x, y, z));
      }

      const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const streamMaterial = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0,
        linewidth: 1,
      });

      const stream = new THREE.Line(streamGeometry, streamMaterial);
      streamGroup.add(stream);
      dataStreamsRef.current.push(streamGroup);
      scene.add(streamGroup);
    });

    // Trigger fade-in after a short delay
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Start animation if enabled
    if (animationEnabled) {
      // Animation will be handled by the separate useEffect
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
        if (object instanceof THREE.Mesh) {
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
      documentsRef.current = [];
      dataStreamsRef.current = [];
      particlesRef.current = null;
      documentTimersRef.current = [];
    };
  }, [width, height, animationEnabled]);

  // Separate useEffect for animation control to avoid dependency array size changes
  useEffect(() => {
    if (!animationEnabled && animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    } else if (
      animationEnabled &&
      !animationIdRef.current &&
      sceneRef.current &&
      rendererRef.current
    ) {
      // Restart animation if it was stopped
      const animate = (time: number) => {
        if (animationEnabled) {
          animationIdRef.current = requestAnimationFrame(animate);
        }

        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Handle document appearance/disappearance
        documentTimersRef.current.forEach((docTimer, index) => {
          docTimer.timer -= deltaTime;

          if (docTimer.timer <= 0) {
            if (!docTimer.isVisible) {
              // Show document with scale animation
              docTimer.isVisible = true;
              docTimer.timer = 3000 + Math.random() * 2000; // Visible for 3-5 seconds
              docTimer.fadeOpacity = 1; // Reset fade opacity

              // Reset material opacity when showing
              docTimer.group.traverse((child) => {
                if (
                  child instanceof THREE.Mesh &&
                  child.material instanceof THREE.MeshBasicMaterial
                ) {
                  child.material.opacity = 0.8; // Reset to original opacity
                }
              });

              // Show corresponding stream
              if (dataStreamsRef.current[index]) {
                const streamMaterial = (
                  dataStreamsRef.current[index].children[0] as THREE.Line
                ).material as THREE.LineBasicMaterial;
                streamMaterial.opacity = 0.6;
              }
            } else {
              // Start fade out
              docTimer.fadeOpacity -= 0.02;
              if (docTimer.fadeOpacity <= 0) {
                docTimer.isVisible = false;
                docTimer.timer = 3000 + index * 1500 + Math.random() * 2000; // Staggered hidden timing
                docTimer.group.scale.setScalar(0);
                docTimer.fadeOpacity = 1;

                // Hide corresponding stream
                if (dataStreamsRef.current[index]) {
                  const streamMaterial = (
                    dataStreamsRef.current[index].children[0] as THREE.Line
                  ).material as THREE.LineBasicMaterial;
                  streamMaterial.opacity = 0;
                }
              } else {
                // Apply fade opacity to document
                docTimer.group.traverse((child) => {
                  if (
                    child instanceof THREE.Mesh &&
                    child.material instanceof THREE.MeshBasicMaterial
                  ) {
                    child.material.opacity = 0.8 * docTimer.fadeOpacity;
                  }
                });
              }
            }
          }

          // Animate visible documents
          if (docTimer.isVisible && docTimer.group.scale.x < 1) {
            docTimer.group.scale.setScalar(
              Math.min(docTimer.group.scale.x + 0.02, 1)
            );
          }

          // Enhanced 3D float animation for visible documents
          if (docTimer.isVisible) {
            const documentPositions = [
              { x: -2, y: 0.5 },
              { x: -1, y: -0.5 },
              { x: 0, y: 1 },
              { x: 1, y: -0.2 },
              { x: 2, y: 0.8 },
            ];

            if (documentPositions[index]) {
              const originalY = documentPositions[index].y;
              const originalX = documentPositions[index].x;

              // Complex 3D movement patterns
              docTimer.group.position.y =
                originalY + Math.sin(time * 0.002 + index) * 0.15;
              docTimer.group.position.x =
                originalX + Math.cos(time * 0.0015 + index) * 0.1;
              docTimer.group.position.z =
                Math.sin(time * 0.0018 + index * 0.5) * 0.3;

              // Multi-axis rotation for true 3D effect
              docTimer.group.rotation.x = Math.sin(time * 0.001 + index) * 0.1;
              docTimer.group.rotation.y =
                Math.cos(time * 0.0012 + index) * 0.15;
              docTimer.group.rotation.z =
                Math.sin(time * 0.0008 + index) * 0.08;
            }
          }
        });

        // Animate upward flowing particles
        if (
          particlesRef.current?.geometry.attributes.position &&
          particlesRef.current.geometry.attributes.velocity
        ) {
          const positionAttribute =
            particlesRef.current.geometry.attributes.position;
          const velocityAttribute =
            particlesRef.current.geometry.attributes.velocity;

          if (positionAttribute.array && velocityAttribute.array) {
            const positions = positionAttribute.array as Float32Array;
            const velocities = velocityAttribute.array as Float32Array;
            const particleCount = 60;

            for (let i = 0; i < particleCount; i++) {
              const xIndex = i * 3;
              const yIndex = i * 3 + 1;
              const zIndex = i * 3 + 2;

              // Move particles upward with type safety
              if (
                positions[xIndex] !== undefined &&
                velocities[xIndex] !== undefined
              ) {
                positions[xIndex] += velocities[xIndex]; // X
              }
              if (
                positions[yIndex] !== undefined &&
                velocities[yIndex] !== undefined
              ) {
                positions[yIndex] += velocities[yIndex]; // Y (upward)
              }
              if (
                positions[zIndex] !== undefined &&
                velocities[zIndex] !== undefined
              ) {
                positions[zIndex] += velocities[zIndex]; // Z
              }

              // Reset particles that have moved too high
              if (positions[yIndex] !== undefined && positions[yIndex] > 4) {
                positions[xIndex] = (Math.random() - 0.5) * 6;
                positions[yIndex] = -3 + Math.random() * 2;
                positions[zIndex] = (Math.random() - 0.5) * 2;
              }
            }

            particlesRef.current.geometry.attributes.position.needsUpdate = true;
          }
        }

        // Animate data streams with wave-like pulse effect
        dataStreamsRef.current.forEach((streamGroup, index) => {
          if (documentTimersRef.current[index]?.isVisible) {
            const stream = streamGroup.children[0] as THREE.Line;
            const material = stream.material as THREE.LineBasicMaterial;

            // Create wave-like pulsing effect on line width (simulated with opacity variation)
            const pulseIntensity = 0.3 + Math.sin(time * 0.003 + index) * 0.3;
            material.opacity = Math.max(0.2, pulseIntensity);
          }
        });

        if (rendererRef.current && sceneRef.current) {
          const camera = new THREE.PerspectiveCamera(60, width / height, 1, 50);
          camera.position.z = 6;
          rendererRef.current.render(sceneRef.current, camera);
        }
      };

      lastTimeRef.current = performance.now();
      animate(lastTimeRef.current);
    }
  }, [animationEnabled, width, height]);

  return (
    <div
      ref={mountRef}
      className={`inline-block transition-opacity duration-1000 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ width, height }}
    />
  );
}
