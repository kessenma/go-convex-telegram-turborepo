'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ThreeJSUploadIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function ThreeJSUploadIcon({ 
  width = 200, 
  height = 200, 
  className = '' 
}: ThreeJSUploadIconProps): React.ReactNode {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const uploadIconRef = useRef<THREE.Group | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const orbitRotationRef = useRef({ z: 0, y: 0 });

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
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create upload icon group
    const uploadIcon = new THREE.Group();
    uploadIconRef.current = uploadIcon;

    // Reusable material creation
    const createMaterial = (color: number, opacity: number) => (
      new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity
      })
    );

    // Create arrow shaft with optimized geometry
    const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
    const shaft = new THREE.Mesh(shaftGeometry, createMaterial(0x3b82f6, 0.8));
    shaft.position.y = -0.5;
    uploadIcon.add(shaft);

    // Create arrow head with optimized geometry
    const headGeometry = new THREE.ConeGeometry(0.3, 0.8, 6);
    const head = new THREE.Mesh(headGeometry, createMaterial(0x1d4ed8, 0.9));
    head.position.y = 1;
    uploadIcon.add(head);

    // Create base platform with optimized geometry
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    const base = new THREE.Mesh(baseGeometry, createMaterial(0xf1f9fe, 0.6));
    base.position.y = -1.8;
    uploadIcon.add(base);

    // Create orbital elements with optimized geometry
    const orbitGeometry = new THREE.TorusGeometry(1.2, 0.05, 6, 12);
    const orbitMaterial = createMaterial(0xf1f9fe, 0.4);
    
    const orbit1 = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit1.rotation.x = Math.PI / 2;
    orbit1.position.y = -1.8;
    uploadIcon.add(orbit1);

    const orbit2 = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit2.rotation.x = Math.PI / 4;
    orbit2.rotation.z = Math.PI / 3;
    orbit2.position.y = -1.8;
    uploadIcon.add(orbit2);

    scene.add(uploadIcon);

    // Trigger fade-in after a short delay
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Animation loop with performance optimizations
    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      if (uploadIcon) {
        // Smooth rotation based on deltaTime
        uploadIcon.rotation.y += (0.001 * deltaTime);
        uploadIcon.position.y = Math.sin(time * 0.002) * 0.1;
        
        // Update stored rotation values
        orbitRotationRef.current.z += 0.002 * deltaTime;
        orbitRotationRef.current.y += 0.0015 * deltaTime;
        
        // Apply rotations
        if (orbit1) orbit1.rotation.z = orbitRotationRef.current.z;
        if (orbit2) orbit2.rotation.y = orbitRotationRef.current.y;
      }
      
      renderer.render(scene, camera);
    };

    // Start animation immediately
    lastTimeRef.current = performance.now();
    animate(lastTimeRef.current);

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose of geometries and materials
      [shaftGeometry, headGeometry, baseGeometry, orbitGeometry].forEach(geometry => geometry.dispose());
      [shaft.material, head.material, base.material, orbitMaterial].forEach(material => material.dispose());
      renderer.dispose();
      
      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      uploadIconRef.current = null;
    };
  }, [width, height]);

  return (
    <div 
      ref={mountRef} 
      className={`inline-block transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ width, height }}
    />
  );
}