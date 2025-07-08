'use client';

import React, { useRef, useEffect } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Box } from 'ogl';

interface ParticlesBackgroundProps {
  className?: string;
  animationEnabled?: boolean;
  meshCount?: number;
  selectedCount?: number;
}

export function ParticlesBackground({ 
  className = '', 
  animationEnabled = true,
  meshCount = 50,
  selectedCount = 0
}: ParticlesBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<Transform | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const meshesRef = useRef<Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const programRef = useRef<Program | undefined>(undefined);
  const geometryRef = useRef<any>(null);
  const transitionRef = useRef({ isTransitioning: false, progress: 0, fromState: 'default', toState: 'default' });
  const fadeOpacityRef = useRef<number[]>([]);


  // Vertex shader
  const vertex = `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    varying vec3 vNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader with opacity support
  const fragment = `
    precision highp float;

    uniform float uOpacity;
    varying vec3 vNormal;

    void main() {
      vec3 normal = normalize(vNormal);
      float lighting = dot(normal, normalize(vec3(-0.5, 0.8, 0.6)));
      gl_FragColor.rgb = vec3(0.08, 0.3, 0.38) + lighting * 0.4;
      gl_FragColor.a = uOpacity;
    }
  `;

  // Initialize OGL scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create renderer
    const renderer = new Renderer({ canvas: canvasRef.current, alpha: true });
    const gl = renderer.gl;
    rendererRef.current = renderer;
    
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
        uOpacity: { value: 1.0 }
      }
    });
    programRef.current = program;

    // Resize handler
    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      
      const { clientWidth, clientHeight } = canvasRef.current.parentElement || canvasRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.perspective({ aspect: clientWidth / clientHeight });
    };

    // Initial resize
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Dispose of resources
      meshesRef.current.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.remove();
        if (mesh.program) mesh.program.remove();
      });
      if (geometryRef.current) geometryRef.current.remove();
      if (programRef.current) programRef.current.remove();
    };
  }, []);

  // Create meshes based on meshCount and selectedCount
  useEffect(() => {
    if (!sceneRef.current || !geometryRef.current || !programRef.current) return;

    const currentState = selectedCount > 0 ? 'selected' : 'default';
    const previousMeshCount = meshesRef.current.length;
    const newMeshCount = selectedCount > 0 ? selectedCount : meshCount;

    // Start transition if state is changing
    if ((previousMeshCount > 0 && selectedCount === 0) || (previousMeshCount === 0 && selectedCount > 0) || 
        (selectedCount > 0 && previousMeshCount !== selectedCount)) {
      transitionRef.current = {
        isTransitioning: true,
        progress: 0,
        fromState: previousMeshCount > 0 && selectedCount === 0 ? 'selected' : 'default',
        toState: currentState
      };
    }

    // Always recreate meshes when selectedCount or meshCount changes
    // Remove existing meshes
    meshesRef.current.forEach(mesh => {
      sceneRef.current?.removeChild(mesh);
    });
    meshesRef.current = [];
    fadeOpacityRef.current = [];

    // Create new meshes
    for (let i = 0; i < newMeshCount; i++) {
      const scale = selectedCount > 0 ? 4 + Math.random() * 1 : 0.5 + Math.random() * 3;
      
      // Create individual program for each mesh to have independent opacity
      const meshProgram = new Program(rendererRef.current!.gl, {
        vertex,
        fragment,
        uniforms: {
          uOpacity: { value: transitionRef.current.isTransitioning ? 0.0 : 1.0 }
        }
      });
      
      const mesh = new Mesh(rendererRef.current!.gl, { 
         geometry: geometryRef.current, 
         program: meshProgram 
       });
      mesh.scale.set(scale, scale, scale);

      if (selectedCount > 0) {
        // Position selected cubes - preserve first cube position when transitioning
        if (selectedCount === 1) {
          mesh.position.set(0, 15, 0); // Single cube at center
        } else {
          if (i === 0) {
            // Keep first cube at center position
            mesh.position.set(0, 15, 0);
          } else {
            // Arrange additional cubes in a circle around the first one
            const angle = ((i - 1) / (selectedCount - 1)) * Math.PI * 2;
            const radius = Math.max(60, selectedCount * 20); // Dynamic radius based on count
            mesh.position.set(
              Math.cos(angle) * radius,
              0, // Same height as center cube
              Math.sin(angle) * radius
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
      // Start with opacity based on transition state
      const initialOpacity = transitionRef.current.isTransitioning ? 0 : 1;
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

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Handle transitions
      if (transitionRef.current.isTransitioning) {
        transitionRef.current.progress += 0.03; // Transition speed
        
        if (transitionRef.current.progress >= 1) {
          transitionRef.current.progress = 1;
          transitionRef.current.isTransitioning = false;
          // Set final opacity
          fadeOpacityRef.current = fadeOpacityRef.current.map(() => 1);
        }
        
        // Apply fade effect during transition
        const easeProgress = 1 - Math.pow(1 - transitionRef.current.progress, 3); // Ease out cubic
        
        meshesRef.current.forEach((mesh, index) => {
          if (transitionRef.current.fromState === 'default' && transitionRef.current.toState === 'selected') {
            // Fade in selected cubes
            fadeOpacityRef.current[index] = easeProgress;
          } else if (transitionRef.current.fromState === 'selected' && transitionRef.current.toState === 'default') {
            // Fade out to new default state
            fadeOpacityRef.current[index] = easeProgress;
          } else {
            // Normal fade in for state changes
            fadeOpacityRef.current[index] = easeProgress;
          }
          
          if (mesh.program && mesh.program.uniforms.uOpacity) {
            mesh.program.uniforms.uOpacity.value = fadeOpacityRef.current[index];
          }
        });
      } else {
        // Normal state - set full opacity
        meshesRef.current.forEach((mesh, index) => {
          if (mesh.program && mesh.program.uniforms.uOpacity) {
            mesh.program.uniforms.uOpacity.value = fadeOpacityRef.current[index] || 1.0;
          }
        });
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
      meshesRef.current.forEach(mesh => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });

      // Render
      rendererRef.current.render({ scene: sceneRef.current, camera: cameraRef.current });
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
    <div className={`absolute inset-0 ${className}`}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}