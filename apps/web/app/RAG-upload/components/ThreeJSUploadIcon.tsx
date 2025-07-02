'use client';

import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create upload icon group
    const uploadIcon = new THREE.Group();
    uploadIconRef.current = uploadIcon;

    // Create arrow shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, // Blue color
      transparent: true,
      opacity: 0.8
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = -0.5;
    uploadIcon.add(shaft);

    // Create arrow head (cone)
    const headGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x1d4ed8, // Darker blue
      transparent: true,
      opacity: 0.9
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1;
    uploadIcon.add(head);

    // Create base platform (cylinder)
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    const baseMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf1f9fe, // blue-50
      transparent: true,
      opacity: 0.6
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -1.8;
    uploadIcon.add(base);

    // Add some orbital elements for visual interest
    const orbitGeometry = new THREE.TorusGeometry(1.2, 0.05, 8, 16);
    const orbitMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf1f9fe, // blue-50
      transparent: true,
      opacity: 0.4
    });
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

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (uploadIcon) {
        // Rotate the entire upload icon
        uploadIcon.rotation.y += 0.01;
        
        // Add some subtle bobbing motion
        uploadIcon.position.y = Math.sin(Date.now() * 0.002) * 0.1;
        
        // Rotate the orbital rings independently
        if (orbit1) orbit1.rotation.z += 0.02;
        if (orbit2) orbit2.rotation.y += 0.015;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div 
      ref={mountRef} 
      className={`inline-block ${className}`}
      style={{ width, height }}
    />
  );
}