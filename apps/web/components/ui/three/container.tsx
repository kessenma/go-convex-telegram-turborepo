'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useArchitectureStore } from '../../../stores/architecture-store';
import { useIntersectionObserver } from '../../../hooks/use-intersection-observer';

interface ContainerCube {
    name: string;
    color: number;
    startPosition: THREE.Vector3;
    endPosition: THREE.Vector3;
}

interface AnimatedContainerCubeProps {
    cube: ContainerCube;
    scrollProgress: number;
    isMobile: boolean;
    isVisible: boolean;
    animationEnabled: boolean;
}

function AnimatedContainerCube({ cube, scrollProgress, isMobile, isVisible, animationEnabled }: AnimatedContainerCubeProps) {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if (!groupRef.current || !isVisible) return;

        // Smooth easing function
        const easeInOutCubic = (t: number): number => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const easedProgress = easeInOutCubic(scrollProgress);

        // Interpolate position based on scroll progress
        const currentPos = cube.startPosition.clone().lerp(cube.endPosition, easedProgress);
        groupRef.current.position.copy(currentPos);

        if (animationEnabled) {
            // Gentle rotation during animation
            const rotationSpeed = 0.002 * (1 - easedProgress); // Slow down as they reach destination
            groupRef.current.rotation.x += rotationSpeed;
            groupRef.current.rotation.y += rotationSpeed;
        }

        // Scale effect - slightly larger at the end
        const scale = 1 + (easedProgress * 0.1);
        groupRef.current.scale.setScalar(scale);

        // Opacity animation
        const opacity = Math.min(1, easedProgress * 2);
        groupRef.current.children.forEach((child, childIndex) => {
            if ('material' in child && child.material) {
                const material = child.material as any;
                if (material.opacity !== undefined) {
                    const baseOpacity = childIndex === 0 ? 0.9 : 0.25;
                    material.opacity = baseOpacity * opacity;
                }
            }
        });
    });

    const cubeSize = isMobile ? 0.5 : 0.7;

    return (
        React.createElement('group' as any, { ref: groupRef },
            // Wireframe cube
            React.createElement('lineSegments' as any, {},
                React.createElement('edgesGeometry' as any, { args: [new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)] }),
                React.createElement('lineBasicMaterial' as any, {
                    color: cube.color,
                    transparent: true,
                    opacity: 0.9,
                    linewidth: 2
                })
            ),
            // Transparent fill
            React.createElement('mesh' as any, {},
                React.createElement('boxGeometry' as any, { args: [cubeSize, cubeSize, cubeSize] }),
                React.createElement('meshBasicMaterial' as any, {
                    color: cube.color,
                    transparent: true,
                    opacity: 0.25
                })
            )
        )
    );
}

// Container outline component
function ContainerOutline({ scrollProgress, isMobile, animationEnabled }: { scrollProgress: number; isMobile: boolean; animationEnabled: boolean }) {
    const outlineRef = useRef<THREE.Group>(null!);

    useFrame(() => {
        if (!outlineRef.current || !animationEnabled) return;

        // Container appears as cubes settle
        const containerProgress = Math.max(0, (scrollProgress - 0.6) / 0.4);
        const opacity = containerProgress * 0.6;
        
        outlineRef.current.children.forEach((child) => {
            if ('material' in child && child.material) {
                const material = child.material as any;
                if (material.opacity !== undefined) {
                    material.opacity = opacity;
                }
            }
        });
    });

    const containerWidth = isMobile ? 3 : 4;
    const containerHeight = isMobile ? 2 : 2.5;
    const containerDepth = isMobile ? 2 : 2.5;

    return (
        React.createElement('group' as any, { ref: outlineRef },
            // Container wireframe
            React.createElement('lineSegments' as any, {},
                React.createElement('edgesGeometry' as any, { 
                    args: [new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth)] 
                }),
                React.createElement('lineBasicMaterial' as any, {
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.6,
                    linewidth: 3
                })
            )
        )
    );
}

// Define the cubes starting from docker-compose end positions
const containerCubes: ContainerCube[] = [
    {
        name: 'convex-backend',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(-0.8, 0.8, 0),
        endPosition: new THREE.Vector3(-1, 0.5, 0.5)
    },
    {
        name: 'convex-console',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(0.8, 0.8, 0),
        endPosition: new THREE.Vector3(1, 0.5, 0.5)
    },
    {
        name: 'next-js-app',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(-0.8, -0.8, 0),
        endPosition: new THREE.Vector3(-1, -0.5, 0.5)
    },
    {
        name: 'telegram-bot',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(0.8, -0.8, 0),
        endPosition: new THREE.Vector3(1, -0.5, 0.5)
    },
    {
        name: 'vector-convert-llm',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(0, 0.8, 0.8),
        endPosition: new THREE.Vector3(-1, 0.5, -0.5)
    },
    {
        name: 'lightweight-llm',
        color: 0x4da6ff,
        startPosition: new THREE.Vector3(0, -0.8, -0.8),
        endPosition: new THREE.Vector3(1, -0.5, -0.5)
    }
];

export function Container({
    width = '100%',
    height = 600,
    className = '',
    animationEnabled = true
}: { width?: number | string; height?: number; className?: string; animationEnabled?: boolean }) {
    const [scrollProgress, setScrollProgress] = React.useState(0);
    const { containerVisible, setContainerVisible } = useArchitectureStore();
    
    // Use intersection observer for performance
    const { ref: containerRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.1,
        rootMargin: '100px'
    });

    // Responsive width/height
    const [actualWidth, setActualWidth] = React.useState<number>(0);
    const [actualHeight, setActualHeight] = React.useState<number>(height);

    useEffect(() => {
        function handleResize() {
            const w = containerRef.current?.offsetWidth || window.innerWidth;
            setActualWidth(w < 500 ? w : typeof width === 'number' ? width : 800);
            setActualHeight(w < 500 ? 400 : height);
        }
        
        // Initialize on mount
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, height]);

    // Smooth scroll progress tracking
    useEffect(() => {
        function handleScroll() {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate smooth scroll progress
            const startTrigger = windowHeight * 0.8;
            const endTrigger = -rect.height * 0.2;
            
            let progress = 0;
            if (rect.top <= startTrigger && rect.bottom >= endTrigger) {
                const totalDistance = startTrigger - endTrigger;
                const currentDistance = startTrigger - rect.top;
                progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
            }
            
            setScrollProgress(progress);
            
            // Update visibility state
            const isVisible = progress > 0 && isIntersecting;
            setContainerVisible(isVisible);
        }

        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [setContainerVisible, isIntersecting]);

    const isMobile = actualWidth < 500;
    const shouldRenderCanvas = containerVisible && isIntersecting;

    return (
        <div
            ref={containerRef}
            className={`flex relative flex-col justify-center items-center ${className}`}
            style={{
                width: typeof width === 'number' ? width : '100%',
                height: actualHeight,
                maxWidth: '100vw',
                minHeight: actualHeight,
                touchAction: 'pan-y'
            }}
        >
            {shouldRenderCanvas && (
                <Canvas
                    camera={{ position: [0, 0, 8], fov: 75 }}
                    style={{
                        width: actualWidth,
                        height: actualHeight,
                        background: 'transparent'
                    }}
                    gl={{ antialias: true, alpha: true }}
                >
                    {/* Ambient lighting */}
                    <ambientLight color={0x4da6ff} intensity={0.4} />
                    <directionalLight
                        color={0x87ceeb}
                        intensity={0.6}
                        position={[5, 5, 5]}
                    />
                    
                    {/* Container outline */}
                    <ContainerOutline scrollProgress={scrollProgress} isMobile={isMobile} animationEnabled={animationEnabled} />
                    
                    {/* Animated cubes */}
                    {containerCubes.map((cube, index) => (
                        <AnimatedContainerCube
                            key={`${cube.name}-${index}`}
                            cube={cube}
                            scrollProgress={scrollProgress}
                            isMobile={isMobile}
                            isVisible={isIntersecting}
                            animationEnabled={animationEnabled}
                        />
                    ))}
                </Canvas>
            )}
        </div>
    );
}

export default Container;