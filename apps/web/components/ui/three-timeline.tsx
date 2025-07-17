'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimationSettings } from '../../hooks/use-animation-settings';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ThreeTimelineProps {
  width?: number | '100%';
  height?: number;
  className?: string;
}

interface DockerService {
  name: string;
  color: number;
  label: string;
  description: string;
  detailedDescription: string;
  animationDirection: 'left' | 'right';
}

const dockerServices: DockerService[] = [
  { 
    name: 'convex-backend', 
    color: 0x4da6ff, 
    label: 'Convex Backend', 
    description: 'Database & API Core',
    detailedDescription: 'Central database and API server. Handles all data operations, user management, and real-time synchronization across the platform. Acts as the backbone of the entire system architecture.',
    animationDirection: 'left'
  },
  { 
    name: 'next-js-app', 
    color: 0x4da6ff, 
    label: 'Next.js (TypeScript + React) App', 
    description: 'Frontend Interface',
    detailedDescription: 'Modern React-based web application built with Next.js. Provides the main user interface for document upload, chat interactions, and system management with server-side rendering capabilities.',
    animationDirection: 'right'
  },
  { 
    name: 'lightweight-llm', 
    color: 0x4da6ff, 
    label: 'LLM (Python) App', 
    description: 'AI Chat Service',
    detailedDescription: 'Lightweight AI language model service that provides intelligent responses and chat capabilities. Handles natural language processing and generation for seamless user interactions.',
    animationDirection: 'left'
  },
  { 
    name: 'vector-convert-llm', 
    color: 0x4da6ff, 
    label: 'Vector Convert (Python) App', 
    description: 'Document Processing',
    detailedDescription: 'Converts text into vector embeddings after upload so LLM apps can parse their database semantically + efficiently.',
    animationDirection: 'right'
  },
  { 
    name: 'telegram-bot (Go)', 
    color: 0x4da6ff, 
    label: 'Telegram Bot (GO)', 
    description: 'Intercepts Telegram messages',
    detailedDescription: 'Golang-powered Telegram bot that enables users to interact with the system through Telegram messages. Handles file uploads, chat commands, and provides mobile-first access.',
    animationDirection: 'left'
  },
  { 
    name: 'convex-console', 
    color: 0x4da6ff, 
    label: 'Convex Console', 
    description: 'Admin Interface',
    detailedDescription: 'Administrative interface for monitoring and managing the Convex backend. Provides insights into database operations, system health, and real-time analytics.',
    animationDirection: 'right'
  }
];

export function ThreeTimeline({ 
  width = '100%', 
  height = 8000, // 800vh equivalent for much longer scroll
  className = ''
}: ThreeTimelineProps): React.ReactElement {
  const { animationEnabled, animationLightMode } = useAnimationSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cubesRef = useRef<THREE.Group[]>([]);
  const connectionsRef = useRef<THREE.Line[]>([]);
  const labelsRef = useRef<HTMLDivElement[]>([]);
  const dockerCircleRef = useRef<THREE.Mesh | null>(null);
  const turborepoCircleRef = useRef<THREE.Mesh | null>(null);
  const finalSphereRef = useRef<THREE.Mesh | null>(null);
  const dockerLabelRef = useRef<HTMLDivElement | null>(null);
  const turborepoLabelRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [actualWidth, setActualWidth] = useState<number>(typeof width === 'number' ? width : (typeof window !== 'undefined' ? window.innerWidth : 800));
  const [actualHeight, setActualHeight] = useState(1000); // Fixed viewport height
  const [isInViewport, setIsInViewport] = useState(false);
  const [hoveredCube, setHoveredCube] = useState<number | null>(null);
  const [showAllDescriptions, setShowAllDescriptions] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(true);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setActualWidth(rect.width || (typeof width === 'number' ? width : window.innerWidth));
        setActualHeight(rect.height || 1000);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [width]);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry?.isIntersecting ?? false);
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll listener to control canvas visibility
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Hide canvas when container is completely above viewport (user scrolled past)
      const shouldShowCanvas = rect.bottom > 0;
      setCanvasVisible(shouldShowCanvas);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle cube glow effect
  useEffect(() => {
    cubesRef.current.forEach((cube, index) => {
      if (!cube || !cube.userData) return;
      
      const { wireframeMaterial, solidMaterial, glowMaterial } = cube.userData;
      
      if (hoveredCube === index) {
        // Glow effect
        if (wireframeMaterial) wireframeMaterial.opacity = 1;
        if (solidMaterial) solidMaterial.opacity = 0.4;
        if (glowMaterial) glowMaterial.opacity = 0.3;
      } else {
        // Normal state
        if (wireframeMaterial) wireframeMaterial.opacity = 0.9;
        if (solidMaterial) solidMaterial.opacity = 0.2;
        if (glowMaterial) glowMaterial.opacity = 0;
      }
    });
  }, [hoveredCube]);

  // Re-render when animation mode changes
  useEffect(() => {
    // Force re-render by clearing and recreating the scene
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    
    // Clear refs to force recreation
    cubesRef.current = [];
    connectionsRef.current = [];
    labelsRef.current = [];
    
    // Small delay to ensure cleanup
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 50);
    }, 50);
  }, [animationLightMode]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Clear any existing content
    while (canvasRef.current.firstChild) {
      canvasRef.current.removeChild(canvasRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, actualWidth / actualHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(actualWidth, actualHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    canvasRef.current.appendChild(renderer.domElement);

    // Create cubes for each Docker service
    const createServiceCube = (service: DockerService, index: number) => {
      const cubeGroup = new THREE.Group();
      
      // Cube geometry
      const cubeSize = 1.2;
      const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      
      // Create edges geometry for wireframe effect
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: service.color,
        transparent: true,
        opacity: 0.9
      });
      
      const wireframe = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      
      // Add solid cube with transparent material
      const solidMaterial = new THREE.MeshBasicMaterial({
        color: service.color,
        transparent: true,
        opacity: 0.2
      });
      const solidCube = new THREE.Mesh(geometry, solidMaterial);
      
      // Add glow effect
      const glowGeometry = new THREE.BoxGeometry(cubeSize * 1.1, cubeSize * 1.1, cubeSize * 1.1);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: service.color,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      const glowCube = new THREE.Mesh(glowGeometry, glowMaterial);
      
      cubeGroup.add(wireframe);
      cubeGroup.add(solidCube);
      cubeGroup.add(glowCube);
      
      // Store materials for glow effect
      cubeGroup.userData.wireframeMaterial = edgesMaterial;
      cubeGroup.userData.solidMaterial = solidMaterial;
      cubeGroup.userData.glowMaterial = glowMaterial;
      
      // Updated positions based on user requirements
      const finalPositions = [
        { x: -4, y: 0, z: 0 },      // convex-backend (center left)
        { x: 4, y: 0, z: 0 },       // next.js app (center right)
        { x: 0, y: 3.5, z: 0 },     // llm app (top center, moved higher)
        { x: 0, y: -2.5, z: 0 },    // vector-convert (bottom center)
        { x: -4, y: -3, z: 0 },     // telegram-bot (bottom left, 1:1 with convex)
        { x: -4, y: 4.5, z: 0 }     // convex-console (top left, moved higher for spacing)
      ];
      
      // Set initial position based on animation direction
      const startX = service.animationDirection === 'left' ? -15 : 15;
      cubeGroup.position.set(startX, finalPositions[index]?.y || 0, 0);
      
      // Store final position for animation
      cubeGroup.userData.finalPosition = finalPositions[index];
      
      // Set initial scale
      cubeGroup.scale.set(animationLightMode ? 1 : 0, animationLightMode ? 1 : 0, animationLightMode ? 1 : 0);
      
      // If animation light mode, set final position immediately
      if (animationLightMode) {
        cubeGroup.position.set(
          finalPositions[index]?.x || 0,
          finalPositions[index]?.y || 0,
          finalPositions[index]?.z || 0
        );
      }
      
      scene.add(cubeGroup);
      
      return cubeGroup;
    };

    // Create connection lines based on new layout
    const createConnection = (start: THREE.Vector3, end: THREE.Vector3, color: number) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const material = new THREE.LineBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: animationLightMode ? 0.7 : 0,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      return line;
    };

    // Create animated circles for docker-compose and turborepo
    const createAnimatedCircle = (radius: number, color: number, opacity: number = 0.3) => {
      const geometry = new THREE.RingGeometry(radius - 0.2, radius + 0.2, 64);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: animationLightMode ? opacity : 0,
        side: THREE.DoubleSide
      });
      const circle = new THREE.Mesh(geometry, material);
      circle.rotation.x = Math.PI / 2; // Rotate to be horizontal
      scene.add(circle);
      return circle;
    };

    // Create sphere for final enclosure
    const createSphere = (radius: number, color: number) => {
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x888888, // Docker compose gray color
        transparent: true,
        opacity: animationLightMode ? 0.3 : 0,
        wireframe: true // Start with wireframe (mesh) for Docker Compose
      });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      return sphere;
    };

    // Create all cubes
    dockerServices.forEach((service, index) => {
      const cube = createServiceCube(service, index);
      cubesRef.current.push(cube);
    });

    // Create connections based on user requirements
    const connectionColor = 0x4da6ff;
    const connections = [
      // Direct connection between Next.js and Convex (main connection)
      createConnection(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0), connectionColor), // convex to next.js
      
      // Both convex and next.js connect to LLM app
      createConnection(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(0, 3.5, 0), connectionColor), // convex to llm
      createConnection(new THREE.Vector3(4, 0, 0), new THREE.Vector3(0, 3.5, 0), connectionColor), // next.js to llm
      
      // Both convex and next.js connect to vector convert
      createConnection(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(0, -2.5, 0), connectionColor), // convex to vector
      createConnection(new THREE.Vector3(4, 0, 0), new THREE.Vector3(0, -2.5, 0), connectionColor), // next.js to vector
      
      // Convex 1:1 connections
      createConnection(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(-4, -3, 0), connectionColor), // convex to telegram
      createConnection(new THREE.Vector3(-4, 0, 0), new THREE.Vector3(-4, 4.5, 0), connectionColor), // convex to console
    ];
    connectionsRef.current = connections;

    // Create docker-compose circle (inner circle)
    const dockerCircle = createAnimatedCircle(6, 0x888888, 0.4);
    dockerCircleRef.current = dockerCircle;

    // Create turborepo circle (outer circle)
    const turborepoCircle = createAnimatedCircle(8, 0x666666, 0.3);
    turborepoCircleRef.current = turborepoCircle;

    // Create final sphere
    const finalSphere = createSphere(9, 0x444444);
    finalSphereRef.current = finalSphere;

    // Create labels container
    const labelsContainer = document.createElement('div');
    labelsContainer.style.position = 'absolute';
    labelsContainer.style.top = '0';
    labelsContainer.style.left = '0';
    labelsContainer.style.width = '100%';
    labelsContainer.style.height = '100%';
    labelsContainer.style.pointerEvents = 'none';
    labelsContainer.style.zIndex = '10';
    canvasRef.current.appendChild(labelsContainer);

    // Info button removed for cleaner UI

    // Create docker-compose simple section
    const dockerCardContainer = document.createElement('div');
    dockerCardContainer.style.position = 'absolute';
    dockerCardContainer.style.opacity = animationLightMode ? '1' : '0';
    dockerCardContainer.style.pointerEvents = 'none';
    dockerCardContainer.style.zIndex = '15';
    dockerCardContainer.style.left = '2rem';
    dockerCardContainer.style.top = '20%';
    dockerCardContainer.innerHTML = `
      <div style="max-width: 320px; text-align: left; color: white;">
        <h3 style="margin-bottom: 12px; font-size: 20px; font-weight: 600;">Docker Compose</h3>
        <p style="font-size: 14px; color: #e2e8f0;">Container orchestration platform</p>
      </div>
    `;
    labelsContainer.appendChild(dockerCardContainer);
    dockerLabelRef.current = dockerCardContainer;

    // Create turborepo simple section
    const turborepoCardContainer = document.createElement('div');
    turborepoCardContainer.style.position = 'absolute';
    turborepoCardContainer.style.opacity = animationLightMode ? '1' : '0';
    turborepoCardContainer.style.pointerEvents = 'none';
    turborepoCardContainer.style.zIndex = '15';
    turborepoCardContainer.style.left = '2rem';
    turborepoCardContainer.style.bottom = '20%';
    turborepoCardContainer.innerHTML = `
      <div style="max-width: 320px; text-align: left; color: white;">
        <h3 style="margin-bottom: 12px; font-size: 20px; font-weight: 600;">Turborepo Monorepo</h3>
        <p style="font-size: 14px; color: #e2e8f0;">High-performance build system</p>
      </div>
    `;
    labelsContainer.appendChild(turborepoCardContainer);
    turborepoLabelRef.current = turborepoCardContainer;

    // Create labels for each service
    dockerServices.forEach((service, index) => {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.color = 'white';
      label.style.fontSize = '14px';
      label.style.fontWeight = 'bold';
      label.style.opacity = animationLightMode ? '1' : '0';
      label.style.pointerEvents = 'auto';
      label.style.cursor = 'pointer';
      label.style.transition = 'all 0.3s ease';
      label.style.zIndex = '15';
      label.style.maxWidth = '250px';
      label.style.padding = '8px 12px';
      label.style.borderRadius = '6px';
      label.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      label.style.border = '1px solid rgba(77, 166, 255, 0.5)';
      label.style.backdropFilter = 'blur(10px)';
      
      // Show only container name initially, full description on hover or when showAllDescriptions is true
      const updateLabelContent = (showFull: boolean) => {
        if (showFull || showAllDescriptions || animationLightMode) {
          label.innerHTML = `
            <div style="font-weight: bold; color: white; margin-bottom: 6px; font-size: 14px;">${service.label}</div>
            <div style="color: #94a3b8; margin-bottom: 8px; font-size: 12px;">${service.description}</div>
            <div style="color: #e2e8f0; font-size: 11px; line-height: 1.4;">${service.detailedDescription}</div>
          `;
        } else {
          label.innerHTML = `
            <div style="font-weight: bold; color: white; font-size: 14px;">${service.label}</div>
          `;
        }
      };
      
      updateLabelContent(false);
      
      // Add hover effects
      label.addEventListener('mouseenter', () => {
        setHoveredCube(index);
        updateLabelContent(true);
        label.style.transform = 'scale(1.05)';
        label.style.boxShadow = '0 0 15px rgba(77, 166, 255, 0.5)';
      });
      
      label.addEventListener('mouseleave', () => {
        setHoveredCube(null);
        updateLabelContent(false);
        label.style.transform = 'scale(1)';
        label.style.boxShadow = 'none';
      });
      
      // Update label when showAllDescriptions changes
      if (showAllDescriptions || animationLightMode) {
        updateLabelContent(true);
      }
      
      labelsContainer.appendChild(label);
      labelsRef.current.push(label);
    });

    // GSAP Timeline Animation with scroll triggers using the container as trigger
    if (animationEnabled && !animationLightMode && typeof window !== 'undefined' && containerRef.current) {
      // Create individual scroll triggers for each cube
      cubesRef.current.forEach((cube, index) => {
        if (!cube) return;
        
        // Create a timeline for this specific cube
        const cubeTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: `${index * 12}% top`, // More gradual stagger for longer scroll
            end: `${(index + 1) * 12 + 15}% top`,
            scrub: 1.5, // Smoother scrubbing
            onUpdate: () => {
              // Update label position for this cube
              const vector = new THREE.Vector3();
              cube.getWorldPosition(vector);
              vector.project(camera);
              
              const x = (vector.x * 0.5 + 0.5) * actualWidth;
              const y = (vector.y * -0.5 + 0.5) * actualHeight;
              
              if (labelsRef.current[index]) {
                const isLeftSide = index % 2 === 0;
                const offsetX = isLeftSide ? -100 : 100;
                labelsRef.current[index].style.left = `${x + offsetX}px`;
                labelsRef.current[index].style.top = `${y - 30}px`;
              }
            }
          }
        });

        // Animate this cube
        cubeTl.to(cube.scale, { 
          x: 1, y: 1, z: 1, 
          duration: 0.5, 
          ease: 'back.out(1.7)' 
        })
        .to(cube.position, { 
          x: cube.userData?.finalPosition?.x || 0, 
          y: cube.userData?.finalPosition?.y || 0, 
          duration: 0.7, 
          ease: 'power2.out' 
        }, '<0.1')
        .to(labelsRef.current[index] || {}, { 
          opacity: 1, 
          duration: 0.3 
        }, '<0.3');
        
        // Animate connection lines
        if (connectionsRef.current[index]) {
          cubeTl.to(connectionsRef.current[index].material, { 
            opacity: 0.7, 
            duration: 0.2 
          }, '<0.5');
        }
      });

      // Add circle and sphere animations after cube animations
      if (dockerCircleRef.current && turborepoCircleRef.current && finalSphereRef.current) {
        const circlesTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "50% top",
            end: "85% top",
            scrub: 1.5,
            // Add onUpdate to force connection opacity if timeline progress is past hide point
            onUpdate: self => {
              // Hide connections if timeline progress is past the hide point
              if (self.progress > 0.15) {
                connectionsRef.current.forEach(conn => {
                  if (conn && conn.material) {
                    if (Array.isArray(conn.material)) {
                      conn.material.forEach(m => {
                        if ('opacity' in m) m.opacity = 0;
                      });
                    } else {
                      if ('opacity' in conn.material) conn.material.opacity = 0;
                    }
                  }
                });
              }
            }
          }
        });

        // Docker-compose circle animation - make it more visible and show card
        circlesTl.to(dockerCircleRef.current.material, {
          opacity: 0.8,
          duration: 0.8,
          ease: "power2.out"
        })
        .to(dockerCircleRef.current.rotation, {
          z: Math.PI * 6,
          duration: 3,
          ease: "none"
        }, '<')
        .to(dockerLabelRef.current?.style || {}, {
          opacity: 1,
          duration: 0.5
        }, '<')
        
        // Turborepo circle animation - make it more visible and show card
        .to(turborepoCircleRef.current.material, {
          opacity: 0.7,
          duration: 0.8,
          ease: "power2.out"
        }, '<0.5')
        .to(turborepoCircleRef.current.rotation, {
          z: -Math.PI * 6,
          duration: 3.5,
          ease: "none"
        }, '<')
        .to(turborepoLabelRef.current?.style || {}, {
          opacity: 1,
          duration: 0.5
        }, '<')
        
        // Hide connection lines FIRST when cubes start shrinking - more reliable timing
        circlesTl.to(connectionsRef.current.map(conn => conn?.material).filter(Boolean), {
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto"
        }, '<1.2')
        
        // Hide service labels
        .to(labelsRef.current.map(label => label?.style).filter(Boolean), {
          opacity: 0,
          duration: 0.3
        }, '<0.1')
        
        // Move ALL cubes to center and scale down simultaneously - slower transition
        .to(cubesRef.current.map(cube => cube?.position).filter(Boolean), {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: "power2.out"
        }, '<0.8')
        .to(cubesRef.current.map(cube => cube?.scale).filter(Boolean), {
          x: 0.6,
          y: 0.6,
          z: 0.6,
          duration: 1.5,
          ease: "power2.out"
        }, '<')
        
        // Continue shrinking cubes to fit inside circle - slower and stay longer
        .to(cubesRef.current.map(cube => cube?.scale).filter(Boolean), {
          x: 0.3,
          y: 0.3,
          z: 0.3,
          duration: 1.2,
          ease: "power2.out"
        }, '<1.0')
        
        // Seamless circle to sphere transition
        .to(dockerCircleRef.current.material, {
          opacity: 0,
          duration: 0.8
        }, '<0.5')
        .to(turborepoCircleRef.current.material, {
          opacity: 0,
          duration: 0.8
        }, '<')
        .to(finalSphereRef.current.material, {
          opacity: 0.6,
          duration: 1.0,
          ease: "power2.out"
        }, '<0.3')
        // Transition from wireframe (Docker Compose) to solid (Turborepo)
        .to(finalSphereRef.current.material, {
          wireframe: false,
          color: 0x666666,
          opacity: 0.8,
          duration: 1.5,
          ease: "power2.inOut"
        }, '<0.8')
        .to(finalSphereRef.current.position, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.0,
          ease: "power2.out"
        }, '<')
        .to(finalSphereRef.current.scale, {
          x: 0.3,
          y: 0.3,
          z: 0.3,
          duration: 1.0,
          ease: "power2.out"
        }, '<')
        
        // Final shrink of cubes to almost invisible - hide inside sphere
        .to(cubesRef.current.map(cube => cube?.scale).filter(Boolean), {
          x: 0.01,
          y: 0.01,
          z: 0.01,
          duration: 1.5,
          ease: "power2.in"
        }, '<0.8');
      }
    }

    // Position labels immediately in light mode
    if (animationLightMode) {
      setTimeout(() => {
        cubesRef.current.forEach((cube, index) => {
          if (!cube) return;
          const vector = new THREE.Vector3();
          cube.getWorldPosition(vector);
          vector.project(camera);
          
          const x = (vector.x * 0.5 + 0.5) * actualWidth;
          const y = (vector.y * -0.5 + 0.5) * actualHeight;
          
          if (labelsRef.current[index]) {
            const isLeftSide = index % 2 === 0;
            const offsetX = isLeftSide ? -100 : 100;
            labelsRef.current[index].style.left = `${x + offsetX}px`;
            labelsRef.current[index].style.top = `${y - 30}px`;
          }
        });
      }, 100);
    }

    // Trigger fade-in
    setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Cleanup function
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (canvasRef.current && renderer.domElement && canvasRef.current.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
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
      connectionsRef.current = [];
      labelsRef.current = [];
    };
  }, [actualWidth, actualHeight, animationEnabled, animationLightMode, showAllDescriptions]);

  // Render loop
  useEffect(() => {
    if (!isInViewport || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const animate = () => {
      if (isInViewport) {
        animationIdRef.current = requestAnimationFrame(animate);
      }

      // Fallback: forcibly hide connections if circles are disappearing
      if (
        dockerCircleRef.current &&
        dockerCircleRef.current.material &&
        (
          (Array.isArray(dockerCircleRef.current.material) &&
            dockerCircleRef.current.material.some(m => 'opacity' in m && m.opacity < 0.2)
          ) ||
          (!Array.isArray(dockerCircleRef.current.material) &&
            'opacity' in dockerCircleRef.current.material &&
            dockerCircleRef.current.material.opacity < 0.2
          )
        )
      ) {
        connectionsRef.current.forEach(conn => {
          if (conn && conn.material) {
            if (Array.isArray(conn.material)) {
              conn.material.forEach(m => {
                if ('opacity' in m && m.opacity !== 0) m.opacity = 0;
              });
            } else {
              if ('opacity' in conn.material && conn.material.opacity !== 0) conn.material.opacity = 0;
            }
          }
        });
      }

      // Subtle rotation for all cubes
      cubesRef.current.forEach((cube) => {
        if (!cube) return;
        cube.children.forEach((child) => {
          if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
            child.rotation.x += 0.005;
            child.rotation.y += 0.005;
          }
        });
      });
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [isInViewport]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
      {/* Fixed Three.js Canvas */}
      <div 
        ref={canvasRef} 
        className={`fixed top-0 left-0 w-full h-screen transition-opacity duration-500 ease-in-out ${isVisible && canvasVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 5, pointerEvents: canvasVisible ? 'auto' : 'none' }}
      />
      
      {/* Scroll sections for triggering animations */}
      <div className="relative z-10 pointer-events-none">
        <section className="flex justify-center items-center h-screen">
          <div className="text-center text-white pointer-events-auto">
            <h2 className="mb-4 text-2xl font-bold">Microservices Architecture</h2>
            <p className="text-lg">Scroll to explore our distributed system</p>
          </div>
        </section>
        
        <section className="flex justify-end items-center pr-8 h-screen">
          <div className="max-w-md text-right text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Convex Backend</h3>
            <p className="text-sm">The central hub managing all data operations and real-time synchronization</p>
          </div>
        </section>
        
        <section className="flex justify-start items-center pl-8 h-screen">
          <div className="max-w-md text-left text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Next.js Frontend</h3>
            <p className="text-sm">Modern React application providing the main user interface</p>
          </div>
        </section>
        
        <section className="flex justify-center items-start pt-16 h-screen">
          <div className="max-w-md text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">AI Services</h3>
            <p className="text-sm">LLM and Vector processing services for intelligent interactions</p>
          </div>
        </section>
        
        <section className="flex justify-center items-end pb-16 h-screen">
          <div className="max-w-md text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Communication Layer</h3>
            <p className="text-sm">Telegram bot and admin console for external interactions</p>
          </div>
        </section>
        
        <section className="flex justify-center items-center h-screen">
          <div className="text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Complete Network</h3>
            <p className="text-sm">All services connected and operational</p>
          </div>
        </section>
        
        <section className="flex justify-center items-center h-screen">
          <div className="text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Unified System</h3>
            <p className="text-sm">Everything converges into a single, cohesive unit</p>
          </div>
        </section>
        
        {/* Buffer sections for smooth animation completion */}
        <section className="flex justify-center items-center h-screen">
          <div className="text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">Complete Integration</h3>
            <p className="text-sm">All components unified in perfect harmony</p>
          </div>
        </section>
        
        <section className="flex justify-center items-center h-screen">
          <div className="text-center text-white pointer-events-auto">
            <h3 className="mb-3 text-xl font-semibold">System Overview</h3>
            <p className="text-sm">Your microservices architecture visualization</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ThreeTimeline;
