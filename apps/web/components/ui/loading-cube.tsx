"use client";

import { Box, Camera, Mesh, Program, Renderer, Transform } from "ogl";
import type React from "react";
import { useEffect, useRef } from "react";

interface LoadingCubeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  errorMode?: boolean;
  phase?: "analyzing" | "processing" | "generating" | "finalizing" | "idle";
}

export function LoadingCube({ 
  size = "md", 
  className = "",
  errorMode = false,
  phase = "idle"
}: LoadingCubeProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<Transform | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const programRef = useRef<Program | undefined>(undefined);
  const geometryRef = useRef<any>(null);

  const sizeMap = {
    sm: { canvas: 32, cube: 0.8, distance: 3 },
    md: { canvas: 64, cube: 1.2, distance: 4 },
    lg: { canvas: 96, cube: 1.8, distance: 6 }
  };

  const currentSize = sizeMap[size];

  // Same shaders as particles background but optimized for single cube
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

  const fragment = `
    precision highp float;

    uniform float uOpacity;
    uniform float uGlow;
    uniform float uErrorMode;
    uniform float uTime;
    uniform float uPhase; // 0=analyzing, 1=connecting, 2=generating, 3=finalizing
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      float lighting = dot(normal, normalize(vec3(-0.5, 0.8, 0.6)));
      
      // Phase-based colors
      vec3 analyzingColor = vec3(0.1, 0.35, 0.45); // Blue-cyan
      vec3 processingColor = vec3(0.2, 0.4, 0.5); // Lighter blue
      vec3 generatingColor = vec3(0.3, 0.5, 0.6); // Cyan
      vec3 finalizingColor = vec3(0.4, 0.6, 0.7); // Light cyan
      
      // Interpolate between phase colors
      vec3 baseColor;
      if (uPhase < 1.0) {
        baseColor = mix(analyzingColor, processingColor, uPhase);
      } else if (uPhase < 2.0) {
        baseColor = mix(processingColor, generatingColor, uPhase - 1.0);
      } else if (uPhase < 3.0) {
        baseColor = mix(generatingColor, finalizingColor, uPhase - 2.0);
      } else {
        baseColor = finalizingColor;
      }
      
      // Add lighting
      baseColor = baseColor + lighting * 0.4;
      
      // Error mode override
      vec3 baseColorRed = vec3(0.45, 0.1, 0.15) + lighting * 0.4;
      baseColor = mix(baseColor, baseColorRed, uErrorMode);
      
      // Calculate distance from center for inner glow effect
      float distFromCenter = length(vPosition) / 0.5;
      
      // Animated glow effect that pulses with time
      float pulseGlow = (sin(uTime * 3.0) + 1.0) * 0.5; // 0 to 1
      float animatedGlow = uGlow + pulseGlow * 0.3;
      
      // More pronounced inner glow with stronger falloff
      float innerGlow = pow(1.0 - distFromCenter, 2.0) * animatedGlow * 4.0;
      
      // Phase-based glow colors
      vec3 analyzingGlow = vec3(0.3, 0.9, 1.0); // Cyan
      vec3 processingGlow = vec3(0.4, 0.8, 1.0); // Light cyan
      vec3 generatingGlow = vec3(0.5, 0.7, 1.0); // Lighter cyan
      vec3 finalizingGlow = vec3(0.6, 0.9, 0.8); // Cyan-green
      
      vec3 glowColor;
      if (uPhase < 1.0) {
        glowColor = mix(analyzingGlow, processingGlow, uPhase);
      } else if (uPhase < 2.0) {
        glowColor = mix(processingGlow, generatingGlow, uPhase - 1.0);
      } else if (uPhase < 3.0) {
        glowColor = mix(generatingGlow, finalizingGlow, uPhase - 2.0);
      } else {
        glowColor = finalizingGlow;
      }
      
      // Error mode glow override
      vec3 glowColorRed = vec3(1.0, 0.3, 0.4);
      glowColor = mix(glowColor, glowColorRed, uErrorMode);
      
      // Add glow effect with stronger mix
      vec3 finalColor = mix(baseColor, glowColor, innerGlow);
      
      // Add outer edge glow effect
      float edgeGlow = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.0) * animatedGlow * 1.5;
      finalColor = mix(finalColor, glowColor, edgeGlow);
      
      // Add loading-specific effects
      // Subtle color shift toward white during loading
      finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), animatedGlow * 0.2);
      
      gl_FragColor.rgb = finalColor;
      gl_FragColor.a = uOpacity * 0.8; // Slightly more opaque for loading
    }
  `;

  // Initialize OGL scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create renderer
    const renderer = new Renderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    const gl = renderer.gl;
    rendererRef.current = renderer;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // Set canvas size
    renderer.setSize(currentSize.canvas, currentSize.canvas);

    // Create camera
    const camera = new Camera(gl, { 
      fov: 35, 
      aspect: 1, // Square aspect ratio
      near: 0.1,
      far: 100 
    });
    camera.position.set(0, 0, currentSize.distance);
    cameraRef.current = camera;

    // Create scene
    const scene = new Transform();
    sceneRef.current = scene;

    // Create geometry and program
    const cubeGeometry = new Box(gl);
    geometryRef.current = cubeGeometry;

    // Convert phase to numeric value
    const getPhaseValue = (phase: string) => {
      switch (phase) {
        case "analyzing": return 0.0;
        case "processing": return 1.0;
        case "generating": return 2.0;
        case "finalizing": return 3.0;
        default: return 0.0;
      }
    };

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uOpacity: { value: 1.0 },
        uGlow: { value: 0.6 }, // Start with some glow for loading effect
        uErrorMode: { value: errorMode ? 1.0 : 0.0 },
        uTime: { value: 0.0 },
        uPhase: { value: getPhaseValue(phase) },
      },
    });
    programRef.current = program;

    // Create mesh
    const mesh = new Mesh(gl, {
      geometry: cubeGeometry,
      program: program,
    });

    // Set cube scale
    mesh.scale.set(currentSize.cube, currentSize.cube, currentSize.cube);
    
    scene.addChild(mesh);
    meshRef.current = mesh;

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (geometryRef.current) geometryRef.current.remove();
      if (programRef.current) programRef.current.remove();
    };
  }, [currentSize, errorMode]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !meshRef.current) return;

      const time = performance.now() / 1000;

      // Update time uniform for animated glow
      if (meshRef.current.program?.uniforms.uTime) {
        meshRef.current.program.uniforms.uTime.value = time;
      }

      // Rotate the cube - multiple axes for more dynamic movement
      meshRef.current.rotation.x = time * 0.8;
      meshRef.current.rotation.y = time * 1.2;
      meshRef.current.rotation.z = time * 0.4;

      // Add subtle scale pulsing
      const pulseScale = 1 + Math.sin(time * 2) * 0.05;
      meshRef.current.scale.set(
        currentSize.cube * pulseScale, 
        currentSize.cube * pulseScale, 
        currentSize.cube * pulseScale
      );

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
  }, [currentSize]);

  // Update error mode
  useEffect(() => {
    if (meshRef.current?.program?.uniforms.uErrorMode) {
      meshRef.current.program.uniforms.uErrorMode.value = errorMode ? 1.0 : 0.0;
    }
  }, [errorMode]);

  // Update glow intensity based on error mode
  useEffect(() => {
    if (meshRef.current?.program?.uniforms.uGlow) {
      // Higher glow for error mode to make it more noticeable
      meshRef.current.program.uniforms.uGlow.value = errorMode ? 0.8 : 0.6;
    }
  }, [errorMode]);

  // Update phase
  useEffect(() => {
    if (meshRef.current?.program?.uniforms.uPhase) {
      const getPhaseValue = (phase: string) => {
        switch (phase) {
          case "analyzing": return 0.0;
          case "processing": return 1.0;
          case "generating": return 2.0;
          case "finalizing": return 3.0;
          default: return 0.0;
        }
      };
      meshRef.current.program.uniforms.uPhase.value = getPhaseValue(phase);
    }
  }, [phase]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        width={currentSize.canvas}
        height={currentSize.canvas}
        className="block"
        style={{ 
          width: `${currentSize.canvas}px`, 
          height: `${currentSize.canvas}px` 
        }}
      />
    </div>
  );
}