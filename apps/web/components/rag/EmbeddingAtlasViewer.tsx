"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Card } from "../ui/card";
import { Button as MovingButton } from "../ui/moving-border";
import { Loader2, Eye, EyeOff, RotateCcw, Plus, Minus, Move, Maximize2, Minimize2, Box, Square, Info, ChevronDown, ChevronUp, Expand, Shrink, ChevronLeft, ChevronRight, TriangleAlert, FileText } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { LoadingSpinner } from "../ui/loading-spinner";
import {
    ResponsiveModal,
    ResponsiveModalContent,
    ResponsiveModalTrigger,
    ResponsiveModalTitle,
    ResponsiveModalDescription
} from "../ui/responsive-modal";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { DocumentViewer } from "./DocumentViewer";
import { type GenericId as Id } from "convex/values";
import { motion, AnimatePresence } from "framer-motion";

// 3D Embedding visualization component - using cubes to match app aesthetic
const EmbeddingPoint = React.memo(({ position, color, scale, onClick, onPointerOver, onPointerOut, isSelected, isInteractive, opacity = 1 }: {
    position: [number, number, number];
    color: string;
    scale: number;
    onClick: (e?: any) => void;
    onPointerOver: () => void;
    onPointerOut: () => void;
    isSelected: boolean;
    isInteractive: boolean;
    opacity?: number;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current && isSelected) {
            // Only spin when selected
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.8;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.6;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={isInteractive ? onClick : undefined}
            onPointerOver={isInteractive ? onPointerOver : undefined}
            onPointerOut={isInteractive ? onPointerOut : undefined}
        >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 0.6 : 0.3}
                transparent
                opacity={opacity * 0.8}
                roughness={0.3}
                metalness={0.1}
            />
        </mesh>
    );
});

// Loading spinner cube for Three.js scene - enhanced to match OGL aesthetic
const LoadingCube = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.8;
            meshRef.current.rotation.y = state.clock.elapsedTime * 1.2;
            meshRef.current.rotation.z = state.clock.elapsedTime * 0.4;
            
            // Add subtle pulsing scale effect
            const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.scale.setScalar(pulseScale);
        }
    });

    return (
        <group>
            {/* Main solid cube */}
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial
                    color="#06b6d4"
                    emissive="#06b6d4"
                    emissiveIntensity={0.4}
                    transparent
                    opacity={0.7}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>
            
            {/* Wireframe overlay for extra glow effect */}
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <boxGeometry args={[0.65, 0.65, 0.65]} />
                <meshStandardMaterial
                    color="#22d3ee"
                    emissive="#22d3ee"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.3}
                    wireframe
                />
            </mesh>
        </group>
    );
};

// Loading scene with grid and spinning cube - enhanced
const LoadingScene = () => {
    return (
        <>
            {/* Enhanced lighting for better atmosphere */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} color="#06b6d4" />
            <spotLight position={[0, 20, 0]} intensity={0.5} angle={0.3} penumbra={1} />

            {/* Grid with better styling */}
            <gridHelper args={[20, 20, "#334155", "#1e293b"]} />

            {/* Loading cube */}
            <LoadingCube />
            
            {/* Loading text */}
            <Text
                position={[0, -2, 0]}
                fontSize={0.3}
                color="#06b6d4"
                anchorX="center"
                anchorY="middle"
            >
                Loading Atlas...
            </Text>
        </>
    );
};

// Auto-rotating camera for non-interactive mode with 2x zoom
const AutoRotatingCamera = ({ isInteractive }: { isInteractive: boolean }) => {
    const { camera } = useThree();

    useFrame((state) => {
        if (!isInteractive) {
            const time = state.clock.elapsedTime * 0.2;
            // Reduced radius for 2x zoom effect
            camera.position.x = Math.sin(time) * 7.5;
            camera.position.z = Math.cos(time) * 7.5;
            camera.position.y = 5;
            camera.lookAt(0, 0, 0);
        }
    });

    return null;
};

const Interactive3DPlot = React.memo(({ data, onPointHover, onPointClick, hoveredPoint, selectedPoint, spacing = 1, isInteractive = true, onCanvasClick }: {
    data: any[];
    onPointHover: (point: any | null) => void;
    onPointClick: (point: any) => void;
    hoveredPoint: any;
    selectedPoint: any;
    spacing?: number;
    isInteractive?: boolean;
    onCanvasClick?: () => void;
}) => {
    const [animationProgress, setAnimationProgress] = useState(0);

    // Animate cubes appearing gradually
    useEffect(() => {
        if (data.length > 0) {
            const timer = setTimeout(() => {
                setAnimationProgress(1);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [data.length]);

    // Calculate 3D positions using PCA-like projection with adjustable spacing
    const points3D = useMemo(() => {
        if (!data.length) return [];

        return data.map((point, index) => {
            // Use the 2D coordinates and add a Z dimension based on embedding similarity
            const z = (point.embedding_vector?.[4] || 0) * 10; // Use 5th dimension for Z

            // Staggered animation delay based on index
            const delay = (index / data.length) * 2000; // 2 second stagger
            const shouldShow = animationProgress > 0 || Date.now() % 10000 > delay;

            return {
                ...point,
                position: [
                    point.x * 0.05 * spacing,
                    point.y * 0.05 * spacing,
                    z * 0.05 * spacing
                ] as [number, number, number],
                scale: hoveredPoint?.id === point.id ? 2 : selectedPoint?.id === point.id ? 1.5 : shouldShow ? 1 : 0.01,
                opacity: shouldShow ? 1 : 0
            };
        });
    }, [data, hoveredPoint, selectedPoint, spacing, animationProgress]);

    return (
        <>
            {/* Enhanced lighting for better shading */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} color="#06b6d4" />
            <spotLight position={[0, 20, 0]} intensity={0.5} angle={0.3} penumbra={1} />

            {/* Invisible background plane to capture clicks */}
            {onCanvasClick && (
                <mesh
                    position={[0, 0, -10]}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCanvasClick();
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <planeGeometry args={[200, 200]} />
                    <meshBasicMaterial transparent opacity={0} side={2} />
                </mesh>
            )}

            {/* Grid */}
            <gridHelper args={[20, 20, "#334155", "#1e293b"]} />

            {/* Points */}
            {points3D.map((point) => (
                <EmbeddingPoint
                    key={point.id}
                    position={point.position}
                    color={point.documentColor}
                    scale={point.scale}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent canvas click
                        onPointClick(point);
                    }}
                    onPointerOver={() => onPointHover(point)}
                    onPointerOut={() => onPointHover(null)}
                    isSelected={selectedPoint?.id === point.id}
                    isInteractive={isInteractive}
                    opacity={point.opacity}
                />
            ))}

            {/* Auto-rotating camera for non-interactive mode */}
            <AutoRotatingCamera isInteractive={isInteractive && !onCanvasClick} />

            {/* Orbit controls only when in fullscreen mode */}
            {isInteractive && !onCanvasClick && <OrbitControls enablePan enableZoom enableRotate />}
        </>
    );
});

// Interactive embedding plot component
const InteractiveEmbeddingPlot = React.memo(({
    data,
    is3D,
    isFullscreen,
    onToggle3D,
    onToggleFullscreen
}: {
    data: any[];
    is3D: boolean;
    isFullscreen: boolean;
    onToggle3D: () => void;
    onToggleFullscreen: () => void;
}) => {
    const [hoveredPoint, setHoveredPoint] = useState<any>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedPoint, setSelectedPoint] = useState<any>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [showInfo, setShowInfo] = useState(false);
    const [spacing, setSpacing] = useState(2); // 3D spacing multiplier
    const [isSelectedExpanded, setIsSelectedExpanded] = useState(false);
    const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"rag_documents"> | null>(null);

    // Calculate better scaling for the data
    const { scaledData, bounds } = useMemo(() => {
        if (!data.length) return { scaledData: [], bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } };

        const xs = data.map(d => d.x);
        const ys = data.map(d => d.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Add padding
        const xRange = maxX - minX || 1;
        const yRange = maxY - minY || 1;
        const padding = 0.1;

        const scaledData = data.map((point, index) => {
            // Normalize to 0-1, then scale to viewport with padding
            const normalizedX = (point.x - minX) / xRange;
            const normalizedY = (point.y - minY) / yRange;

            const x = 80 + normalizedX * (800 - 160); // 80px padding on each side
            const y = 80 + (1 - normalizedY) * (600 - 160); // Flip Y and add padding

            // Use brighter cyan theme colors
            const documentHash = point.document_title.charCodeAt(0) % 8;
            const documentColors = [
                '#22d3ee', // cyan-400 (brighter)
                '#06b6d4', // cyan-500
                '#67e8f9', // cyan-300 (brightest)
                '#0891b2', // cyan-600
                '#a5f3fc', // cyan-200 (very bright)
                '#0e7490', // cyan-700
                '#cffafe', // cyan-100 (lightest)
                '#155e75', // cyan-800 (darker for contrast)
            ];

            return {
                ...point,
                scaledX: x,
                scaledY: y,
                color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
                documentColor: documentColors[documentHash]
            };
        });

        return { scaledData, bounds: { minX, maxX, minY, maxY } };
    }, [data]);



    const handleMouseDown = (event: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        setPanStart(pan);
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setMousePos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        });

        if (isDragging) {
            const deltaX = event.clientX - dragStart.x;
            const deltaY = event.clientY - dragStart.y;
            setPan({
                x: panStart.x + deltaX,
                y: panStart.y + deltaY
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const zoomIn = () => {
        setZoom(prev => Math.min(3, prev * 1.2));
    };

    const zoomOut = () => {
        setZoom(prev => Math.max(0.5, prev / 1.2));
    };

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSelectedPoint(null);
        setSpacing(2);
    };

    const expandSpacing = () => {
        setSpacing(prev => Math.min(5, prev * 1.3));
    };

    const contractSpacing = () => {
        setSpacing(prev => Math.max(0.5, prev / 1.3));
    };

    // Helper function to truncate text by word count
    const truncateText = (text: string, wordLimit: number) => {
        const words = text.split(' ');
        if (words.length <= wordLimit) return text;
        return words.slice(0, wordLimit).join(' ') + '...';
    };

    // Close selected point when clicking outside
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedPoint(null);
            setIsSelectedExpanded(false);
        }
    }, []);

    // Open document viewer
    const handleViewDocument = useCallback((documentId: string) => {
        setSelectedDocumentId(documentId as Id<"rag_documents">);
        setDocumentViewerOpen(true);
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
            {/* View Mode Toggle - moved to left side */}
            <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg p-1 border border-cyan-500/20 flex flex-col gap-1 z-20">
                <button
                    onClick={onToggle3D}
                    className={`px-2 py-1 rounded text-xs transition-colors flex items-center justify-center ${!is3D
                        ? 'bg-cyan-500 text-slate-900'
                        : 'text-cyan-300 hover:text-cyan-200'
                        }`}
                >
                    {renderIcon(Square, { className: "w-3 h-3" })}
                </button>
                <button
                    onClick={onToggle3D}
                    className={`px-2 py-1 rounded text-xs transition-colors flex items-center justify-center ${is3D
                        ? 'bg-cyan-500 text-slate-900'
                        : 'text-cyan-300 hover:text-cyan-200'
                        }`}
                >
                    {renderIcon(Box, { className: "w-3 h-3" })}
                </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Fullscreen button clicked, isFullscreen:', isFullscreen);
                        onToggleFullscreen();
                    }}
                    className="p-2 bg-slate-800/90 rounded-lg border border-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Open in Fullscreen Modal"}
                >
                    {renderIcon(isFullscreen ? Minimize2 : Maximize2, { className: "w-4 h-4" })}
                </button>
            </div>

            {is3D ? (
                // 3D View
                <div
                    className="absolute inset-0"
                    style={{ cursor: !isFullscreen ? 'pointer' : 'default' }}
                    onClick={!isFullscreen ? onToggleFullscreen : undefined}
                >
                    <Canvas className="absolute inset-0">
                        <Interactive3DPlot
                            data={scaledData}
                            onPointHover={setHoveredPoint}
                            onPointClick={(point) => {
                                if (isFullscreen) {
                                    // Only allow point selection in fullscreen mode
                                    if (selectedPoint?.id === point.id) {
                                        setSelectedPoint(null);
                                        setIsSelectedExpanded(false);
                                    } else {
                                        setSelectedPoint(point);
                                        setIsSelectedExpanded(false);
                                    }
                                } else {
                                    // In non-fullscreen mode, clicking opens fullscreen
                                    onToggleFullscreen();
                                }
                            }}
                            hoveredPoint={hoveredPoint}
                            selectedPoint={selectedPoint}
                            spacing={spacing}
                            isInteractive={true}
                            onCanvasClick={!isFullscreen ? onToggleFullscreen : undefined}
                        />
                    </Canvas>
                </div>
            ) : (
                // 2D View
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 800 600"
                    className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        setHoveredPoint(null);
                        setIsDragging(false);
                    }}
                >
                    {/* Grid lines with cyan/slate theme */}
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" opacity="0.2" />
                        </pattern>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Center lines with cyan theme */}
                    <line x1="400" y1="80" x2="400" y2="520" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />
                    <line x1="80" y1="300" x2="720" y2="300" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />

                    {/* Data points with zoom/pan transform */}
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                        {scaledData.map((point, index) => {
                            const isHovered = hoveredPoint?.id === point.id;
                            const isSelected = selectedPoint?.id === point.id;
                            const radius = isSelected ? 10 : isHovered ? 8 : 5;
                            const opacity = hoveredPoint && !isHovered && !isSelected ? 0.3 : 0.8;

                            return (
                                <g key={point.id}>
                                    <circle
                                        cx={point.scaledX}
                                        cy={point.scaledY}
                                        r={radius}
                                        fill={point.documentColor}
                                        stroke={isSelected ? "#06b6d4" : "#0f172a"}
                                        strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                                        opacity={opacity}
                                        className="transition-all duration-200 cursor-pointer"
                                        filter={isHovered || isSelected ? "url(#glow)" : undefined}
                                        onMouseEnter={() => setHoveredPoint(point)}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedPoint(null);
                                                setIsSelectedExpanded(false);
                                            } else {
                                                setSelectedPoint(point);
                                                setIsSelectedExpanded(false);
                                            }
                                        }}
                                    />
                                </g>
                            );
                        })}
                    </g>
                </svg>
            )}

            {/* Custom tooltip with cyan/slate theme - moved to bottom center */}
            {hoveredPoint && !isDragging && isFullscreen && (
                <div
                    className="absolute pointer-events-none z-10 bg-slate-800/95 text-white p-3 rounded-lg shadow-lg border border-cyan-500/50 max-w-xs"
                    style={{
                        left: '50%',
                        bottom: '20px',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="font-medium text-sm mb-1 text-cyan-300">
                        {hoveredPoint.document_title}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                        Chunk {hoveredPoint.chunk_index} • {hoveredPoint.embedding_model}
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                        {hoveredPoint.text.substring(0, 150)}
                        {hoveredPoint.text.length > 150 && '...'}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                        Position: ({hoveredPoint.x.toFixed(2)}, {hoveredPoint.y.toFixed(2)})
                    </div>
                </div>
            )}

            {/* Collapsible Info Section - moved to avoid overlap */}
            <div className="absolute top-16 left-4 bg-slate-800/90 rounded-lg border border-cyan-500/20 z-20">
                {showInfo ? (
                    <div className="p-3 text-xs text-slate-300">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-cyan-300">Embedding Visualization</div>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="text-slate-400 hover:text-cyan-300 transition-colors"
                            >
                                {renderIcon(ChevronUp, { className: "w-3 h-3" })}
                            </button>
                        </div>
                        <div>• Each dot represents a document chunk</div>
                        <div>• Colors group by document</div>
                        <div>• Similar content clusters together</div>
                        <div>• {is3D ? 'Drag to orbit, scroll to zoom' : 'Click & drag to pan, hover for details'}</div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 text-cyan-300 hover:text-cyan-200 transition-colors"
                        title="Show Information"
                    >
                        {renderIcon(Info, { className: "w-4 h-4" })}
                    </button>
                )}
            </div>

            {/* Stats with cyan/slate theme */}
            <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 text-xs text-slate-300 border border-cyan-500/20">
                <div className="font-medium mb-1 text-cyan-300">{data.length} Embeddings</div>
                <div>{new Set(data.map(d => d.document_title)).size} Documents</div>
                <div className="mt-2 text-xs text-slate-400">
                    Range: X({bounds.minX.toFixed(1)}, {bounds.maxX.toFixed(1)}) Y({bounds.minY.toFixed(1)}, {bounds.maxY.toFixed(1)})
                </div>
            </div>

            {/* Split Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
                {/* Left Side - Interactive Controls */}
                <div className="bg-slate-800/90 rounded-lg p-3 border border-cyan-500/20 max-w-xs">
                    {/* Zoom Controls (for 2D) */}
                    {!is3D && (
                        <div className="mb-3">
                            <div className="text-xs text-cyan-300 font-medium mb-2">Zoom Controls</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={zoomOut}
                                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors"
                                    title="Zoom Out"
                                >
                                    {renderIcon(Minus, { className: "w-4 h-4" })}
                                </button>
                                <span className="text-xs text-slate-300 min-w-[60px] text-center">
                                    {(zoom * 100).toFixed(0)}%
                                </span>
                                <button
                                    onClick={zoomIn}
                                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors"
                                    title="Zoom In"
                                >
                                    {renderIcon(Plus, { className: "w-4 h-4" })}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Spacing Controls (for 3D) */}
                    {is3D && (
                        <div className="mb-3">
                            <div className="text-xs text-cyan-300 font-medium mb-2">Spacing Controls</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={contractSpacing}
                                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors"
                                    title="Contract Spacing"
                                >
                                    {renderIcon(Shrink, { className: "w-4 h-4" })}
                                </button>
                                <span className="text-xs text-slate-300 min-w-[60px] text-center">
                                    {spacing.toFixed(1)}x
                                </span>
                                <button
                                    onClick={expandSpacing}
                                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors"
                                    title="Expand Spacing"
                                >
                                    {renderIcon(Expand, { className: "w-4 h-4" })}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={resetView}
                        className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-2"
                    >
                        {renderIcon(RotateCcw, { className: "w-4 h-4" })}
                        Reset View
                    </button>
                </div>

                {/* Right Side - Controls Info */}
                <div className="bg-slate-800/90 rounded-lg p-3 text-xs text-slate-400 border border-cyan-500/20 max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        {renderIcon(Move, { className: "w-4 h-4 text-cyan-400" })}
                        <span className="text-cyan-300 font-medium">
                            {is3D ? 'Drag to Orbit' : 'Click & Drag to Pan'}
                        </span>
                    </div>
                    {is3D ? (
                        <div className="space-y-1">
                            <div className="text-slate-300">
                                Spacing: <span className="text-cyan-300">{spacing.toFixed(1)}x</span>
                            </div>
                            <div className="text-slate-500">
                                Scroll to zoom • Click points to select
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-slate-300">
                                Pan: <span className="text-cyan-300">({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</span>
                            </div>
                            <div className="text-slate-500">
                                Zoom: {(zoom * 100).toFixed(0)}% • Click points to select
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected point details with cyan/slate theme - moved to bottom */}
            {selectedPoint && (
                <div
                    className="absolute inset-0 bg-black/20 z-30"
                    onClick={handleBackdropClick}
                >
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-800/95 text-white border-t border-cyan-500 max-h-[40vh] overflow-y-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="font-medium text-cyan-300">Selected Point</div>
                                <button
                                    onClick={() => {
                                        setSelectedPoint(null);
                                        setIsSelectedExpanded(false);
                                    }}
                                    className="text-slate-400 hover:text-cyan-300 transition-colors text-lg"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="font-medium text-base mb-2 text-cyan-200">
                                {selectedPoint.document_title}
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-slate-400">
                                    Chunk {selectedPoint.chunk_index} • {selectedPoint.embedding_model}
                                </div>
                                <button
                                    onClick={() => handleViewDocument(selectedPoint.document_id)}
                                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs transition-colors flex items-center gap-1"
                                    disabled={!selectedPoint.document_id}
                                >
                                    {renderIcon(FileText, { className: "w-3 h-3" })}
                                    View Document
                                </button>
                            </div>
                            <div className="text-sm text-slate-200 leading-relaxed mb-3">
                                {isSelectedExpanded ? (
                                    selectedPoint.text
                                ) : (
                                    <>
                                        {/* Responsive word limits: 100 on mobile, 200 on desktop */}
                                        <span className="block md:hidden">
                                            {truncateText(selectedPoint.text, 100)}
                                        </span>
                                        <span className="hidden md:block">
                                            {truncateText(selectedPoint.text, 200)}
                                        </span>
                                    </>
                                )}
                                {!isSelectedExpanded && (
                                    <>
                                        {/* Show expand button for mobile if text > 100 words */}
                                        <span className="block md:hidden">
                                            {selectedPoint.text.split(' ').length > 100 && (
                                                <button
                                                    onClick={() => setIsSelectedExpanded(true)}
                                                    className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm underline"
                                                >
                                                    Expand
                                                </button>
                                            )}
                                        </span>
                                        {/* Show expand button for desktop if text > 200 words */}
                                        <span className="hidden md:block">
                                            {selectedPoint.text.split(' ').length > 200 && (
                                                <button
                                                    onClick={() => setIsSelectedExpanded(true)}
                                                    className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm underline"
                                                >
                                                    Expand
                                                </button>
                                            )}
                                        </span>
                                    </>
                                )}
                                {isSelectedExpanded && (
                                    <button
                                        onClick={() => setIsSelectedExpanded(false)}
                                        className="ml-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm underline"
                                    >
                                        Collapse
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-slate-500">
                                Position: ({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)})
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            <DocumentViewer
                documentId={selectedDocumentId}
                isOpen={documentViewerOpen}
                onClose={() => {
                    setDocumentViewerOpen(false);
                    setSelectedDocumentId(null);
                }}
                small={false}
            />
        </div>
    );
});



interface EmbeddingData {
    id: string;
    document_id: string;
    x: number;
    y: number;
    text: string;
    document_title: string;
    chunk_index: number;
    embedding_model: string;
    created_at: string;
    dimensions: number;
    embedding_vector: number[];
}

interface EmbeddingAtlasViewerProps {
    className?: string;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function EmbeddingAtlasViewer({ className, onFullscreenChange }: EmbeddingAtlasViewerProps) {
    const [data, setData] = useState<EmbeddingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [is3D, setIs3D] = useState(true); // Start with 3D view
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalVectors, setTotalVectors] = useState(0);
    const [detailsPage, setDetailsPage] = useState(0);
    const VECTORS_PER_PAGE = 100;
    const DETAILS_PER_PAGE = 12;



    // Transform data for Embedding Atlas - memoized for performance
    const atlasData = useMemo(() => {
        if (!data.length) return [];

        return data.map(item => ({
            id: item.id,
            document_id: item.document_id,
            x: item.x,
            y: item.y,
            text: item.text,
            document_title: item.document_title,
            chunk_index: item.chunk_index,
            embedding_model: item.embedding_model,
            created_at: item.created_at,
            embedding_vector: item.embedding_vector,
        }));
    }, [data]);

    // Paginated details data
    const paginatedDetailsData = useMemo(() => {
        const startIndex = detailsPage * DETAILS_PER_PAGE;
        return atlasData.slice(startIndex, startIndex + DETAILS_PER_PAGE);
    }, [atlasData, detailsPage]);

    const fetchEmbeddingData = useCallback(async (page: number = 0, append: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const offset = page * VECTORS_PER_PAGE;
            const response = await fetch(`/api/embeddings/atlas-data?limit=${VECTORS_PER_PAGE}&offset=${offset}`);
            const result = await response.json();

            if (result.success) {
                if (append) {
                    setData(prev => [...prev, ...result.data]);
                } else {
                    setData(result.data);
                }
                setTotalVectors(result.total || result.data.length);
                setHasLoaded(true);
            } else {
                setError(result.error || 'Failed to fetch embedding data');
            }
        } catch (err) {
            setError('Network error while fetching embedding data');
            console.error('Error fetching embedding data:', err);
        } finally {
            setLoading(false);
        }
    }, [VECTORS_PER_PAGE]);

    const toggleVisibility = useCallback(() => {
        setIsVisible(!isVisible);
        if (!isVisible && !hasLoaded) {
            fetchEmbeddingData(0, false);
        }
    }, [isVisible, hasLoaded, fetchEmbeddingData]);

    const refreshData = useCallback(() => {
        setCurrentPage(0);
        setDetailsPage(0);
        fetchEmbeddingData(0, false);
    }, [fetchEmbeddingData]);

    const loadNextBatch = useCallback(() => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchEmbeddingData(nextPage, true);
    }, [currentPage, fetchEmbeddingData]);

    const openModal = useCallback(() => {
        console.log('Opening modal');
        setIsModalOpen(true);
        onFullscreenChange?.(true);
    }, [onFullscreenChange]);

    const closeModal = useCallback(() => {
        console.log('Closing modal');
        setIsModalOpen(false);
        onFullscreenChange?.(false);
    }, [onFullscreenChange]);

    const toggle3D = useCallback(() => {
        setIs3D(!is3D);
    }, [is3D]);

    const nextDetailsPage = useCallback(() => {
        const maxPage = Math.ceil(atlasData.length / DETAILS_PER_PAGE) - 1;
        if (detailsPage < maxPage) {
            setDetailsPage(prev => prev + 1);
        }
    }, [detailsPage, atlasData.length, DETAILS_PER_PAGE]);

    const prevDetailsPage = useCallback(() => {
        if (detailsPage > 0) {
            setDetailsPage(prev => prev - 1);
        }
    }, [detailsPage]);

    return (
        <div className={`embedding-atlas-viewer ${className || ''}`}>
            <Card className="border-gray-700 bg-gray-800/50">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Embedding Atlas
                            </h3>
                            <p className="text-sm text-gray-300">
                                Interactive visualization of your document embeddings with clustering and search capabilities.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {hasLoaded && (
                                <MovingButton
                                    onClick={refreshData}
                                    disabled={loading}
                                    className="bg-slate-900/[0.8] text-white"
                                    containerClassName="w-auto"
                                    borderClassName="bg-[radial-gradient(#10b981_40%,transparent_60%)]"
                                >
                                    {renderIcon(RotateCcw, { className: "w-4 h-4" })}
                                </MovingButton>
                            )}
                            <MovingButton
                                onClick={toggleVisibility}
                                disabled={loading}
                                className="bg-slate-900/[0.8] text-white"
                                containerClassName="w-auto min-w-[120px]"
                                borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <LoadingSpinner size="sm" use3D={true} />
                                        Loading...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {renderIcon(isVisible ? EyeOff : Eye, { className: "w-4 h-4" })}
                                        {isVisible ? 'Hide Atlas' : 'Show Atlas'}
                                    </span>
                                )}
                            </MovingButton>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-900/20 text-red-300 border border-red-800">
                            <p className="font-medium">Error loading embedding data:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!hasLoaded && !loading && (
                        <div className="p-8 text-center rounded-lg border border-gray-600 bg-gray-700/50">
                            <div className="mb-4">
                                {renderIcon(Eye, { className: "mx-auto w-12 h-12 text-gray-500" })}
                            </div>
                            <p className="text-gray-400 mb-2">
                                Click "Show Atlas" to visualize your embeddings
                            </p>
                            <p className="text-sm text-gray-500">
                                This will load and display an interactive 2D visualization of your document embeddings.
                            </p>
                        </div>
                    )}

                    {isVisible && hasLoaded && atlasData.length > 0 && (
                        <div className="mt-4">
                            <div className="mb-4 p-3 rounded-lg bg-cyan-900/20 text-cyan-300 border border-cyan-500/30">
                                <p className="text-sm mb-2">
                                    Showing {atlasData.length} embeddings in {is3D ? '3D' : '2D'} view.
                                    Toggle between 2D/3D modes, use fullscreen for better exploration,
                                    and analyze your document relationships through clustering.
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="text-slate-400 flex items-center gap-1">
                                        {renderIcon(TriangleAlert, { className: "w-3 h-3" })}
                                        Demo limited to {VECTORS_PER_PAGE} vectors per batch for performance
                                    </div>
                                    {(currentPage + 1) * VECTORS_PER_PAGE < totalVectors && (
                                        <button
                                            onClick={loadNextBatch}
                                            disabled={loading}
                                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <LoadingSpinner size="sm" use3D={true} />
                                                    Loading...
                                                </>
                                            ) : (
                                                `Load Next ${VECTORS_PER_PAGE}`
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    To remove this limit, edit the <code className="bg-slate-800 px-1 rounded">VECTORS_PER_PAGE</code> constant in <code className="bg-slate-800 px-1 rounded">apps/web/components/rag/EmbeddingAtlasViewer.tsx</code>
                                </div>
                            </div>

                            <motion.div
                                className="h-[600px] rounded-lg border border-cyan-500/30 bg-slate-900/50 overflow-hidden"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full h-full"
                                        >
                                            <Canvas className="w-full h-full">
                                                <LoadingScene />
                                            </Canvas>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="content"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="w-full h-full"
                                        >
                                            <React.Suspense
                                                fallback={
                                                    <div className="w-full h-full">
                                                        <Canvas className="w-full h-full">
                                                            <LoadingScene />
                                                        </Canvas>
                                                    </div>
                                                }
                                            >
                                                <ResponsiveModal open={isModalOpen} onOpenChange={closeModal}>
                                                    <div className="w-full h-full">
                                                        <InteractiveEmbeddingPlot
                                                            data={atlasData}
                                                            is3D={is3D}
                                                            isFullscreen={true}
                                                            onToggle3D={toggle3D}
                                                            onToggleFullscreen={openModal}
                                                        />
                                                    </div>
                                                    <ResponsiveModalContent side="fullscreen" className="bg-slate-900 p-0">
                                                        <ResponsiveModalTitle className="sr-only">
                                                            Embedding Atlas Fullscreen View
                                                        </ResponsiveModalTitle>
                                                        <ResponsiveModalDescription className="sr-only">
                                                            Interactive 3D/2D visualization of document embeddings in fullscreen mode
                                                        </ResponsiveModalDescription>
                                                        <div className="w-full h-full">
                                                            <InteractiveEmbeddingPlot
                                                                data={atlasData}
                                                                is3D={is3D}
                                                                isFullscreen={true}
                                                                onToggle3D={toggle3D}
                                                                onToggleFullscreen={closeModal}
                                                            />
                                                        </div>
                                                    </ResponsiveModalContent>
                                                </ResponsiveModal>
                                            </React.Suspense>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Detailed data view with pagination */}
                            <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-lg font-medium text-cyan-300">Embedding Details</h5>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={prevDetailsPage}
                                            disabled={detailsPage === 0}
                                            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Previous Page"
                                        >
                                            {renderIcon(ChevronLeft, { className: "w-4 h-4" })}
                                        </button>
                                        <span className="text-xs text-slate-400 min-w-[80px] text-center">
                                            Page {detailsPage + 1} of {Math.ceil(atlasData.length / DETAILS_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={nextDetailsPage}
                                            disabled={detailsPage >= Math.ceil(atlasData.length / DETAILS_PER_PAGE) - 1}
                                            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-cyan-300 hover:text-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Next Page"
                                        >
                                            {renderIcon(ChevronRight, { className: "w-4 h-4" })}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                    {paginatedDetailsData.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-cyan-500/50 transition-colors"
                                        >
                                            <div className="text-sm font-medium text-cyan-200 mb-1 truncate">
                                                {item.document_title}
                                            </div>
                                            <div className="text-xs text-slate-400 mb-2">
                                                Chunk {item.chunk_index} • {item.embedding_model}
                                            </div>
                                            <div className="text-xs text-slate-300 mb-2" style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {item.text}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Position: ({item.x.toFixed(2)}, {item.y.toFixed(2)})
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 text-center text-sm text-slate-400">
                                    Showing {detailsPage * DETAILS_PER_PAGE + 1}-{Math.min((detailsPage + 1) * DETAILS_PER_PAGE, atlasData.length)} of {atlasData.length} embeddings
                                </div>
                            </div>
                        </div>
                    )}

                    {isVisible && hasLoaded && atlasData.length === 0 && (
                        <div className="mt-4 p-8 text-center rounded-lg border border-gray-600 bg-gray-700/50">
                            <div className="mb-4">
                                {renderIcon(Eye, { className: "mx-auto w-12 h-12 text-gray-500" })}
                            </div>
                            <p className="text-gray-400 mb-2">No embedding data found</p>
                            <p className="text-sm text-gray-500">
                                Upload and process some documents first to see embeddings here.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}