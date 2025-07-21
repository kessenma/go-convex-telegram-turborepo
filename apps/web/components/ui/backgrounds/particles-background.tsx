"use client";

import { Box, Camera, Mesh, Program, Renderer, Transform } from "ogl";
import type React from "react";
import { useEffect, useRef } from "react";

interface ParticlesBackgroundProps {
  className?: string;
  animationEnabled?: boolean;
  meshCount?: number;
  selectedCount?: number;
}

export function ParticlesBackground({
  className = "",
  animationEnabled = true,
  meshCount = 50,
  selectedCount = 0,
}: ParticlesBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<Transform | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const meshesRef = useRef<Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const programRef = useRef<Program | undefined>(undefined);
  const geometryRef = useRef<any>(null);
  const transitionRef = useRef({
    isTransitioning: false,
    progress: 0,
    fromState: "default",
    toState: "default",
    addedIndices: [] as number[],
    removedIndices: [] as number[],
  });
  const fadeOpacityRef = useRef<number[]>([]);
  const scaleAnimationRef = useRef<number[]>([]);
  const glowEffectRef = useRef<{
    active: boolean;
    progress: number;
    meshIndices: number[];
  }>({
    active: false,
    progress: 0,
    meshIndices: [],
  });

  // Vertex shader
  const vertex = `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader with improved glow effect
  const fragment = `
    precision highp float;

    uniform float uOpacity;
    uniform float uGlow;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      float lighting = dot(normal, normalize(vec3(-0.5, 0.8, 0.6)));
      
      // Base color with lighting - slightly brighter blue
      vec3 baseColor = vec3(0.1, 0.35, 0.45) + lighting * 0.4;
      
      // Calculate distance from center for inner glow effect
      float distFromCenter = length(vPosition) / 0.5; // Normalized by cube size
      
      // More pronounced inner glow with stronger falloff
      float innerGlow = pow(1.0 - distFromCenter, 2.0) * uGlow * 4.0;
      
      // Brighter, more vibrant glow color
      vec3 glowColor = vec3(0.3, 0.9, 1.0);
      
      // Add glow effect with stronger mix
      vec3 finalColor = mix(baseColor, glowColor, innerGlow);
      
      // Add outer edge glow effect - much stronger
      float edgeGlow = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.0) * uGlow * 1.5;
      finalColor = mix(finalColor, glowColor, edgeGlow);
      
      // Add a subtle pulsing effect to the entire cube when glowing
      if (uGlow > 0.1) {
        // Add a slight color shift toward white at glow peaks
        finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), uGlow * 0.3);
      }
      
      gl_FragColor.rgb = finalColor;
      // Make cube more transparent
      gl_FragColor.a = uOpacity * 0.7;
    }
  `;

  // Initialize OGL scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create renderer
    const renderer = new Renderer({ canvas: canvasRef.current, alpha: true });
    const gl = renderer.gl;
    rendererRef.current = renderer;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set clear color to transparent
    gl.clearColor(0, 0, 0, 0);

    // Create camera
    const camera = new Camera(gl, { fov: 35, far: 3000 });
    cameraRef.current = camera;

    // Create scene
    const scene = new Transform();
    sceneRef.current = scene;

    // Create geometry and program
    const cubeGeometry = new Box(gl);
    geometryRef.current = cubeGeometry;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uOpacity: { value: 1.0 },
        uGlow: { value: 0.0 },
      },
    });
    programRef.current = program;

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;

      const { clientWidth, clientHeight } =
        canvasRef.current.parentElement || canvasRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.perspective({ aspect: clientWidth / clientHeight });
    };

    // Initial resize
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Add click event listener to document
    const handleDocumentClick = () => {
      // Trigger glow effect on random meshes
      if (meshesRef.current.length > 0) {
        // Select random meshes to glow (between 1 and 3)
        const numToGlow = Math.floor(Math.random() * 3) + 1;
        const meshIndices: number[] = [];

        for (let i = 0; i < numToGlow; i++) {
          const randomIndex = Math.floor(
            Math.random() * meshesRef.current.length
          );
          if (!meshIndices.includes(randomIndex)) {
            meshIndices.push(randomIndex);
          }
        }

        // Activate glow effect
        glowEffectRef.current = {
          active: true,
          progress: 0,
          meshIndices,
        };
      }
    };

    document.addEventListener("click", handleDocumentClick);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleDocumentClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Dispose of resources
      meshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.remove();
        if (mesh.program) mesh.program.remove();
      });
      if (geometryRef.current) geometryRef.current.remove();
      if (programRef.current) programRef.current.remove();
    };
  }, []);

  // Create meshes based on meshCount and selectedCount
  useEffect(() => {
    if (!sceneRef.current || !geometryRef.current || !programRef.current)
      return;

    const currentState = selectedCount > 0 ? "selected" : "default";
    const previousMeshCount = meshesRef.current.length;
    const newMeshCount = selectedCount > 0 ? selectedCount : meshCount;

    // Track which indices are being added or removed for selective animation
    const addedIndices: number[] = [];
    const removedIndices: number[] = [];

    // Determine if we're transitioning and which indices are affected
    let isTransitioning = false;

    if (
      (previousMeshCount > 0 && selectedCount === 0) ||
      (previousMeshCount === 0 && selectedCount > 0) ||
      (selectedCount > 0 && previousMeshCount !== selectedCount)
    ) {
      isTransitioning = true;

      // Calculate added and removed indices
      if (newMeshCount > previousMeshCount) {
        // Adding cubes
        for (let i = previousMeshCount; i < newMeshCount; i++) {
          addedIndices.push(i);
        }
      } else if (newMeshCount < previousMeshCount) {
        // Removing cubes
        for (let i = newMeshCount; i < previousMeshCount; i++) {
          removedIndices.push(i);
        }
      }

      // Start transition
      transitionRef.current = {
        isTransitioning: true,
        progress: 0,
        fromState:
          previousMeshCount > 0 && selectedCount === 0 ? "selected" : "default",
        toState: currentState,
        addedIndices,
        removedIndices,
      };
    }

    // Always recreate meshes when selectedCount or meshCount changes
    // Remove existing meshes
    meshesRef.current.forEach((mesh) => {
      sceneRef.current?.removeChild(mesh);
    });
    meshesRef.current = [];
    fadeOpacityRef.current = [];
    scaleAnimationRef.current = [];

    // Create new meshes
    for (let i = 0; i < newMeshCount; i++) {
      const scale =
        selectedCount > 0 ? 4 + Math.random() * 1 : 0.5 + Math.random() * 3;

      // Create individual program for each mesh to have independent opacity and glow
      if (!rendererRef.current?.gl) return;
      const meshProgram = new Program(rendererRef.current.gl, {
        vertex,
        fragment,
        uniforms: {
          uOpacity: {
            value: isTransitioning && addedIndices.includes(i) ? 0.0 : 1.0,
          },
          uGlow: { value: 0.0 },
        },
      });

      const mesh = new Mesh(rendererRef.current.gl, {
        geometry: geometryRef.current,
        program: meshProgram,
      });

      // Start with appropriate scale based on whether this is a new cube
      const initialScale =
        isTransitioning && addedIndices.includes(i) ? 0.01 : scale;
      mesh.scale.set(initialScale, initialScale, initialScale);
      scaleAnimationRef.current.push(scale); // Target scale

      if (selectedCount > 0) {
        // Position selected cubes - preserve first cube position when transitioning
        if (selectedCount === 1) {
          mesh.position.set(0, 8, 0); // Single cube at center
        } else {
          // Improved positioning for multiple selected documents
          // Calculate positions using a spiral arrangement for better scaling with many documents

          // Keep first cube at center position
          if (i === 0) {
            mesh.position.set(0, 8, 0);
          } else {
            // Use a golden ratio-based arrangement
            const goldenRatio = 1.618033988749895;
            const phi = i * goldenRatio * Math.PI;

            // Calculate radius based on number of documents
            // Use a logarithmic scale to prevent overcrowding with many documents
            const baseRadius = 60;
            const radiusScale = Math.min(
              1.5,
              1 + Math.log10(selectedCount) / 10
            );
            const radius = baseRadius * radiusScale;

            // Calculate distance from center based on index
            // This creates a spiral effect as more documents are added
            const distance = radius * Math.sqrt(i / selectedCount);

            mesh.position.set(
              Math.cos(phi) * distance,
              55 - (i % 3) * 15, // Vary height slightly for visual interest
              Math.sin(phi) * distance
            );
          }
        }
      } else {
        // Position meshes randomly for default state
        mesh.position.set(
          -100 + Math.random() * 200,
          -100 + Math.random() * 200,
          -100 + Math.random() * 200
        );
      }

      mesh.rotation.set(
        Math.random() * 3,
        Math.random() * 3,
        Math.random() * 3
      );

      sceneRef.current.addChild(mesh);
      meshesRef.current.push(mesh);

      // Start with opacity based on transition state and whether this is a new cube
      const initialOpacity =
        isTransitioning && addedIndices.includes(i) ? 0 : 1;
      fadeOpacityRef.current.push(initialOpacity);
    }
  }, [meshCount, selectedCount]);

  // Animation loop
  useEffect(() => {
    if (!animationEnabled) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (!animationEnabled) return;

      animationIdRef.current = requestAnimationFrame(animate);

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
        return;

      // Handle transitions
      if (transitionRef.current.isTransitioning) {
        transitionRef.current.progress += 0.015; // Slower transition speed for more graceful effect

        if (transitionRef.current.progress >= 1) {
          transitionRef.current.progress = 1;
          transitionRef.current.isTransitioning = false;
          // Set final opacity and scale for all meshes
          fadeOpacityRef.current = fadeOpacityRef.current.map(() => 1);
        }

        // Apply fade and scale effect during transition with easing
        const easeProgress = 1 - (1 - transitionRef.current.progress) ** 3; // Ease out cubic

        meshesRef.current.forEach((mesh, index) => {
          const isAdded = transitionRef.current.addedIndices.includes(index);
          const isRemoved =
            transitionRef.current.removedIndices.includes(index);

          // Only animate opacity for added cubes
          if (isAdded) {
            fadeOpacityRef.current[index] = easeProgress;
            if (mesh.program?.uniforms.uOpacity) {
              mesh.program.uniforms.uOpacity.value =
                fadeOpacityRef.current[index] * 0.7; // Apply base transparency
            }
          } else if (!isRemoved) {
            // For existing cubes, maintain full opacity
            if (mesh.program?.uniforms.uOpacity) {
              mesh.program.uniforms.uOpacity.value = 0.7; // Apply base transparency
            }
          }

          // Only animate scale for added or removed cubes
          if (isAdded || isRemoved) {
            const targetScale = scaleAnimationRef.current[index];
            let currentScale;

            if (isAdded) {
              // Growing animation for appearing
              currentScale = (targetScale ?? 1) * easeProgress;
            } else {
              // Shrinking animation for disappearing
              currentScale = (targetScale ?? 1) * (1 - easeProgress);
            }

            // Apply scale with minimum to prevent complete disappearance
            const minScale = 0.01;
            const appliedScale = Math.max(minScale, currentScale);
            mesh.scale.set(appliedScale, appliedScale, appliedScale);
          } else {
            // For existing cubes, maintain full scale
            const targetScale = scaleAnimationRef.current[index];
            mesh.scale.set(targetScale ?? 1, targetScale, targetScale);
          }
        });
      } else {
        // Normal state - set full opacity and scale
        meshesRef.current.forEach((mesh, index) => {
          if (mesh.program?.uniforms.uOpacity) {
            mesh.program.uniforms.uOpacity.value = 0.7; // Apply base transparency
          }

          // Ensure scale is at target value
          const targetScale = scaleAnimationRef.current[index];
          mesh.scale.set(targetScale ?? 1, targetScale, targetScale);
        });
      }

      // Handle glow effect
      if (glowEffectRef.current.active) {
        // Update glow progress - slower for more noticeable effect
        glowEffectRef.current.progress += 0.02;

        if (glowEffectRef.current.progress >= 1) {
          glowEffectRef.current.active = false;
          glowEffectRef.current.progress = 0;

          // Reset glow on all meshes
          meshesRef.current.forEach((mesh) => {
            if (mesh.program?.uniforms.uGlow) {
              mesh.program.uniforms.uGlow.value = 0;
            }
          });
        } else {
          // Calculate glow intensity using a smoother curve for more natural pulsing
          // Use a combination of sine waves for a more complex, interesting effect
          const t = glowEffectRef.current.progress;
          const glowIntensity =
            Math.sin(t * Math.PI) * 0.8 + Math.sin(t * Math.PI * 2) * 0.2;

          // Apply glow to selected meshes with higher intensity
          glowEffectRef.current.meshIndices.forEach((index) => {
            if (
              index < meshesRef.current.length &&
              meshesRef.current[index]?.program &&
              meshesRef.current[index].program.uniforms.uGlow
            ) {
              meshesRef.current[index].program.uniforms.uGlow.value =
                glowIntensity;

              // Add a subtle scale pulse to glowing cubes for more visual impact
              const baseScale = scaleAnimationRef.current[index];
              const pulseScale = (baseScale ?? 1) * (1 + glowIntensity * 0.1);
              meshesRef.current[index].scale.set(
                pulseScale,
                pulseScale,
                pulseScale
              );
            }
          });
        }
      }

      // Rotate camera
      const time = performance.now() / 30000;
      cameraRef.current.position.set(
        Math.sin(time) * 180,
        80,
        Math.cos(time) * 180
      );
      cameraRef.current.lookAt([0, 0, 0]);

      // Rotate meshes
      meshesRef.current.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });

      // Render
      rendererRef.current.render({
        scene: sceneRef.current,
        camera: cameraRef.current,
      });
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [animationEnabled]);

  return (
    <div className={`fixed inset-0 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
