"use client";

import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { Card } from "../ui/card";
import { Button as MovingButton } from "../ui/moving-border";
import { Eye, EyeOff, RotateCcw, Plus, Minus, Move, Maximize2, Minimize2, Box, Square, Info, ChevronUp, Expand, Shrink, ChevronLeft, ChevronRight, TriangleAlert, FileText } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { LoadingSpinner } from "../ui/loading-spinner";
import {
    ResponsiveModal,
    ResponsiveModalContent,
    ResponsiveModalTitle,
    ResponsiveModalDescription
} from "../ui/responsive-modal";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { DocumentViewer } from "./DocumentViewer";
import { type GenericId as Id } from "convex/values";
import { motion, AnimatePresence } from "framer-motion";
import {
    useEmbeddingAtlasStore,
    useEmbeddingData,
    useScaledData,
    useLoadingState,
    useUIState,
    useInteractionState,
    use2DViewState,
    usePaginationState,
    usePaginatedDetailsData,
    type EmbeddingData
} from "../../stores/embedding-atlas-store";

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

const Interactive3DPlot = React.memo(({ data, onPointHover, onPointClick, hoveredPoint, selectedPoint, spacing = 1, isInteractive = true, onCanvasClick, onEnableInteractivity }: {
    data: any[];
    onPointHover: (point: any | null) => void;
    onPointClick: (point: any) => void;
    hoveredPoint: any;
    selectedPoint: any;
    spacing?: number;
    isInteractive?: boolean;
    onCanvasClick?: () => void;
    onEnableInteractivity?: () => void;
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
            <mesh
                position={[0, 0, -10]}
                onClick={(e) => {
                    e.stopPropagation();
                    onEnableInteractivity && onEnableInteractivity();
                    onCanvasClick && onCanvasClick();
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onEnableInteractivity && onEnableInteractivity();
                }}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} side={2} />
            </mesh>

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
                        onEnableInteractivity && onEnableInteractivity();
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
            <AutoRotatingCamera isInteractive={isInteractive} />

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
    onToggleFullscreen,
    isInteractive,
    onEnableInteractivity,
    spacing,
    onExpandSpacing,
    onContractSpacing,
    onResetView
}: {
    data: any[];
    is3D: boolean;
    isFullscreen: boolean;
    onToggle3D: () => void;
    onToggleFullscreen: () => void;
    isInteractive: boolean;
    onEnableInteractivity: () => void;
    spacing: number;
    onExpandSpacing: () => void;
    onContractSpacing: () => void;
    onResetView: () => void;
}) => {
    const [hoveredPoint, setHoveredPoint] = useState<any>(null);
    const [selectedPoint, setSelectedPoint] = useState<any>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [showInfo, setShowInfo] = useState(false);
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
        onEnableInteractivity(); // Enable interactivity on user interaction
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        setPanStart(pan);
    };

    const handleMouseMove = (event: React.MouseEvent) => {
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
        onEnableInteractivity(); // Enable interactivity on user interaction
        setZoom(prev => Math.min(3, prev * 1.2));
    };

    const zoomOut = () => {
        onEnableInteractivity(); // Enable interactivity on user interaction
        setZoom(prev => Math.max(0.5, prev / 1.2));
    };

    const resetViewLocal = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSelectedPoint(null);
        // Reset spacing using store action
        onResetView();
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
        <div className="overflow-hidden relative w-full h-full rounded-lg bg-slate-900">
            {/* View Mode Toggle - moved to left side */}
            <div className="flex absolute top-4 left-4 z-20 flex-col gap-1 p-1 rounded-lg border bg-slate-800/90 border-cyan-500/20">
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
                    className="p-2 text-cyan-300 rounded-lg border transition-colors bg-slate-800/90 border-cyan-500/20 hover:text-cyan-200"
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
                            isInteractive={isInteractive}
                            onCanvasClick={!isFullscreen ? onToggleFullscreen : undefined}
                            onEnableInteractivity={onEnableInteractivity}
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
                        {scaledData.map((point, _index) => {
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
                                            onEnableInteractivity(); // Enable interactivity on user interaction
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
                    className="absolute z-10 p-3 max-w-xs text-white rounded-lg border shadow-lg pointer-events-none bg-slate-800/95 border-cyan-500/50"
                    style={{
                        left: '50%',
                        bottom: '20px',
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="mb-1 text-sm font-medium text-cyan-300">
                        {hoveredPoint.document_title}
                    </div>
                    <div className="mb-2 text-xs text-slate-400">
                        Chunk {hoveredPoint.chunk_index} • {hoveredPoint.embedding_model}
                    </div>
                    <div className="text-xs leading-relaxed text-slate-200">
                        {hoveredPoint.text.substring(0, 150)}
                        {hoveredPoint.text.length > 150 && '...'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Position: ({hoveredPoint.x.toFixed(2)}, {hoveredPoint.y.toFixed(2)})
                    </div>
                </div>
            )}

            {/* Collapsible Info Section - moved to avoid overlap */}
            <div className="absolute left-4 top-16 z-20 rounded-lg border bg-slate-800/90 border-cyan-500/20">
                {showInfo ? (
                    <div className="p-3 text-xs text-slate-300">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium text-cyan-300">Embedding Visualization</div>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="transition-colors text-slate-400 hover:text-cyan-300"
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
                        className="p-2 text-cyan-300 transition-colors hover:text-cyan-200"
                        title="Show Information"
                    >
                        {renderIcon(Info, { className: "w-4 h-4" })}
                    </button>
                )}
            </div>

            {/* Stats with cyan/slate theme */}
            <div className="absolute top-4 right-4 p-3 text-xs rounded-lg border bg-slate-800/90 text-slate-300 border-cyan-500/20">
                <div className="mb-1 font-medium text-cyan-300">{data.length} Embeddings</div>
                <div>{new Set(data.map(d => d.document_title)).size} Documents</div>
                <div className="mt-2 text-xs text-slate-400">
                    Range: X({bounds.minX.toFixed(1)}, {bounds.maxX.toFixed(1)}) Y({bounds.minY.toFixed(1)}, {bounds.maxY.toFixed(1)})
                </div>
            </div>

            {/* Split Bottom Controls */}
            <div className="flex absolute right-4 bottom-4 left-4 z-20 justify-between items-end">
                {/* Left Side - Interactive Controls */}
                <div className="p-3 max-w-xs rounded-lg border bg-slate-800/90 border-cyan-500/20">
                    {/* Zoom Controls (for 2D) */}
                    {!is3D && (
                        <div className="mb-3">
                            <div className="mb-2 text-xs font-medium text-cyan-300">Zoom Controls</div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={zoomOut}
                                    className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200"
                                    title="Zoom Out"
                                >
                                    {renderIcon(Minus, { className: "w-4 h-4" })}
                                </button>
                                <span className="text-xs text-slate-300 min-w-[60px] text-center">
                                    {(zoom * 100).toFixed(0)}%
                                </span>
                                <button
                                    onClick={zoomIn}
                                    className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200"
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
                            <div className="mb-2 text-xs font-medium text-cyan-300">Spacing Controls</div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={onContractSpacing}
                                    className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200"
                                    title="Contract Spacing"
                                >
                                    {renderIcon(Shrink, { className: "w-4 h-4" })}
                                </button>
                                <span className="text-xs text-slate-300 min-w-[60px] text-center">
                                    {spacing.toFixed(1)}x
                                </span>
                                <button
                                    onClick={onExpandSpacing}
                                    className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200"
                                    title="Expand Spacing"
                                >
                                    {renderIcon(Expand, { className: "w-4 h-4" })}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={resetViewLocal}
                        className="flex gap-2 justify-center items-center px-3 py-2 w-full text-xs text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200"
                    >
                        {renderIcon(RotateCcw, { className: "w-4 h-4" })}
                        Reset View
                    </button>
                </div>

                {/* Right Side - Controls Info */}
                <div className="p-3 max-w-xs text-xs rounded-lg border bg-slate-800/90 text-slate-400 border-cyan-500/20">
                    <div className="flex gap-2 items-center mb-2">
                        {renderIcon(Move, { className: "w-4 h-4 text-cyan-400" })}
                        <span className="font-medium text-cyan-300">
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
                    className="absolute inset-0 z-30 bg-black/20"
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
                                    className="text-lg transition-colors text-slate-400 hover:text-cyan-300"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mb-2 text-base font-medium text-cyan-200">
                                {selectedPoint.document_title}
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-sm text-slate-400">
                                    Chunk {selectedPoint.chunk_index} • {selectedPoint.embedding_model}
                                </div>
                                <button
                                    onClick={() => handleViewDocument(selectedPoint.document_id)}
                                    className="flex gap-1 items-center px-3 py-1 text-xs text-white bg-cyan-600 rounded transition-colors hover:bg-cyan-500"
                                    disabled={!selectedPoint.document_id}
                                >
                                    {renderIcon(FileText, { className: "w-3 h-3" })}
                                    View Document
                                </button>
                            </div>
                            <div className="mb-3 text-sm leading-relaxed text-slate-200">
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
                                                    className="ml-2 text-sm text-cyan-400 underline transition-colors hover:text-cyan-300"
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
                                                    className="ml-2 text-sm text-cyan-400 underline transition-colors hover:text-cyan-300"
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
                                        className="ml-2 text-sm text-cyan-400 underline transition-colors hover:text-cyan-300"
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



interface EmbeddingAtlasViewerProps {
    className?: string;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function EmbeddingAtlasViewer({ className, onFullscreenChange }: EmbeddingAtlasViewerProps) {
    // Use store selectors for state management
    const data = useEmbeddingData();
    const { loading, error, hasLoaded } = useLoadingState();
    const { isVisible, is3D, isModalOpen, isInteractive } = useUIState();
    const { spacing } = useInteractionState();
    const { currentPage, detailsPage, totalVectors, VECTORS_PER_PAGE, DETAILS_PER_PAGE } = usePaginationState();
    const paginatedDetailsData = usePaginatedDetailsData();
    
    // Store actions
    const {
        setData,
        setLoading,
        setError,
        setHasLoaded,
        setTotalVectors,
        setCurrentPage,
        setDetailsPage,
        setIsVisible,
        setIs3D,
        setIsModalOpen,
        nextDetailsPage,
        prevDetailsPage,
        enableInteractivity,
        expandSpacing,
        contractSpacing,
        resetView
    } = useEmbeddingAtlasStore();

    // Transform data for Embedding Atlas - now using store data
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

    const fetchEmbeddingData = useCallback(async (page: number = 0, append: boolean = false) => {
        setLoading(true);
        setError(null);

        const offset = page * VECTORS_PER_PAGE;
        const apiUrl = `/api/embeddings/atlas-data?limit=${VECTORS_PER_PAGE}&offset=${offset}`;
        
        console.log('=== FRONTEND ATLAS DATA FETCH START ===');
        console.log('Fetching from URL:', apiUrl);
        console.log('Page:', page, 'Append:', append);
        console.log('VECTORS_PER_PAGE:', VECTORS_PER_PAGE);
        console.log('Calculated offset:', offset);

        try {
            console.log('Making fetch request...');
            const response = await fetch(apiUrl);
            
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error text:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            console.log('Parsing JSON response...');
            const result = await response.json();
            
            console.log('Parsed result:', {
                success: result.success,
                dataLength: result.data?.length,
                total: result.total,
                error: result.error,
                sampleData: result.data?.[0] ? {
                    id: result.data[0].id,
                    document_title: result.data[0].document_title,
                    hasEmbedding: !!result.data[0].embedding_vector
                } : 'No data'
            });

            if (result.success) {
                // Use store action to set data
                setData(result.data, append);
                console.log(append ? 'Appended data' : 'Set new data', 'length:', result.data.length);
                setTotalVectors(result.total || result.data.length);
                setHasLoaded(true);
                console.log('Data successfully set in state');
            } else {
                console.error('API returned success: false, error:', result.error);
                setError(result.error || 'Failed to fetch embedding data');
            }
        } catch (err) {
            console.error('=== FETCH ERROR ===');
            console.error('Error details:', {
                error: err,
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : 'No stack'
            });
            setError('Network error while fetching embedding data');
        } finally {
            setLoading(false);
            console.log('=== FRONTEND ATLAS DATA FETCH END ===');
        }
    }, [VECTORS_PER_PAGE, setData, setError, setHasLoaded, setLoading, setTotalVectors]);

    const toggleVisibility = useCallback(() => {
        setIsVisible(!isVisible);
        if (!isVisible && !hasLoaded) {
            fetchEmbeddingData(0, false);
        }
    }, [isVisible, hasLoaded, fetchEmbeddingData, setIsVisible]);

    const refreshData = useCallback(() => {
        setCurrentPage(0);
        setDetailsPage(0);
        fetchEmbeddingData(0, false);
    }, [fetchEmbeddingData, setCurrentPage, setDetailsPage]);

    const loadNextBatch = useCallback(() => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchEmbeddingData(nextPage, true);
    }, [currentPage, fetchEmbeddingData, setCurrentPage]);

    const openModal = useCallback(() => {
        console.log('Opening modal');
        setIsModalOpen(true);
        onFullscreenChange?.(true);
    }, [onFullscreenChange, setIsModalOpen]);

    const closeModal = useCallback(() => {
        console.log('Closing modal');
        setIsModalOpen(false);
        onFullscreenChange?.(false);
    }, [onFullscreenChange, setIsModalOpen]);

    const toggle3D = useCallback(() => {
        setIs3D(!is3D);
    }, [is3D, setIs3D]);

    // Use store actions for pagination
    const handleNextDetailsPage = useCallback(() => {
        nextDetailsPage();
    }, [nextDetailsPage]);

    const handlePrevDetailsPage = useCallback(() => {
        prevDetailsPage();
    }, [prevDetailsPage]);

    // Auto-rotation control - enable interactivity on user interaction
    const onEnableInteractivity = useCallback(() => {
        if (!isInteractive) {
            enableInteractivity();
        }
    }, [isInteractive, enableInteractivity]);

    return (
        <div className={`embedding-atlas-viewer ${className || ''}`}>
            <Card className="border-gray-700 bg-gray-800/50">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="mb-2 text-xl font-semibold text-white">
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
                                    <span className="flex gap-2 items-center">
                                        <LoadingSpinner size="sm" use3D={true} />
                                        Loading...
                                    </span>
                                ) : (
                                    <span className="flex gap-2 items-center">
                                        {renderIcon(isVisible ? EyeOff : Eye, { className: "w-4 h-4" })}
                                        {isVisible ? 'Hide Atlas' : 'Show Atlas'}
                                    </span>
                                )}
                            </MovingButton>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 mb-4 text-red-300 rounded-lg border border-red-800 bg-red-900/20">
                            <p className="font-medium">Error loading embedding data:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!hasLoaded && !loading && (
                        <div className="p-8 text-center rounded-lg border border-gray-600 bg-gray-700/50">
                            <div className="mb-4">
                                {renderIcon(Eye, { className: "mx-auto w-12 h-12 text-gray-500" })}
                            </div>
                            <p className="mb-2 text-gray-400">
                                Click &quot;Show Atlas&quot; to visualize your embeddings
                            </p>
                            <p className="text-sm text-gray-500">
                                This will load and display an interactive 2D visualization of your document embeddings.
                            </p>
                        </div>
                    )}

                    {isVisible && hasLoaded && atlasData.length > 0 && (
                        <div className="mt-4">
                            <div className="p-3 mb-4 text-cyan-300 rounded-lg border bg-cyan-900/20 border-cyan-500/30">
                                <p className="mb-2 text-sm">
                                    Showing {atlasData.length} embeddings in {is3D ? '3D' : '2D'} view.
                                    Toggle between 2D/3D modes, use fullscreen for better exploration,
                                    and analyze your document relationships through clustering.
                                </p>
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex gap-1 items-center text-slate-400">
                                        {renderIcon(TriangleAlert, { className: "w-3 h-3" })}
                                        Demo limited to {VECTORS_PER_PAGE} vectors per batch for performance
                                    </div>
                                    {(currentPage + 1) * VECTORS_PER_PAGE < totalVectors && (
                                        <button
                                            onClick={loadNextBatch}
                                            disabled={loading}
                                            className="flex gap-2 items-center px-3 py-1 text-xs text-white bg-cyan-600 rounded transition-colors hover:bg-cyan-500 disabled:opacity-50"
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
                                    To remove this limit, edit the <code className="px-1 rounded bg-slate-800">VECTORS_PER_PAGE</code> constant in <code className="px-1 rounded bg-slate-800">apps/web/components/rag/EmbeddingAtlasViewer.tsx</code>
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
                                            isInteractive={isInteractive}
                                            onEnableInteractivity={onEnableInteractivity}
                                            spacing={spacing}
                                            onExpandSpacing={expandSpacing}
                                            onContractSpacing={contractSpacing}
                                            onResetView={resetView}
                                        />
                                                    </div>
                                                    <ResponsiveModalContent side="fullscreen" className="p-0 bg-slate-900">
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
                                                isInteractive={isInteractive}
                                                onEnableInteractivity={onEnableInteractivity}
                                                spacing={spacing}
                                                onExpandSpacing={expandSpacing}
                                                onContractSpacing={contractSpacing}
                                                onResetView={resetView}
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
                            <div className="p-4 mt-6 rounded-lg border bg-slate-800/30 border-cyan-500/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-lg font-medium text-cyan-300">Embedding Details</h5>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={handlePrevDetailsPage}
                                            disabled={detailsPage === 0}
                                            className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Previous Page"
                                        >
                                            {renderIcon(ChevronLeft, { className: "w-4 h-4" })}
                                        </button>
                                        <span className="text-xs text-slate-400 min-w-[80px] text-center">
                                            Page {detailsPage + 1} of {Math.ceil(atlasData.length / DETAILS_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={handleNextDetailsPage}
                                            disabled={detailsPage >= Math.ceil(atlasData.length / DETAILS_PER_PAGE) - 1}
                                            className="p-1 text-cyan-300 rounded transition-colors bg-slate-700 hover:bg-slate-600 hover:text-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Next Page"
                                        >
                                            {renderIcon(ChevronRight, { className: "w-4 h-4" })}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid overflow-y-auto grid-cols-1 gap-4 max-h-96 md:grid-cols-2 lg:grid-cols-3">
                                    {paginatedDetailsData.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-lg border transition-colors bg-slate-700/50 border-slate-600 hover:border-cyan-500/50"
                                        >
                                            <div className="mb-1 text-sm font-medium text-cyan-200 truncate">
                                                {item.document_title}
                                            </div>
                                            <div className="mb-2 text-xs text-slate-400">
                                                Chunk {item.chunk_index} • {item.embedding_model}
                                            </div>
                                            <div className="mb-2 text-xs text-slate-300" style={{
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

                                <div className="mt-4 text-sm text-center text-slate-400">
                                    Showing {detailsPage * DETAILS_PER_PAGE + 1}-{Math.min((detailsPage + 1) * DETAILS_PER_PAGE, atlasData.length)} of {atlasData.length} embeddings
                                </div>
                            </div>
                        </div>
                    )}

                    {isVisible && hasLoaded && atlasData.length === 0 && (
                        <div className="p-8 mt-4 text-center rounded-lg border border-gray-600 bg-gray-700/50">
                            <div className="mb-4">
                                {renderIcon(Eye, { className: "mx-auto w-12 h-12 text-gray-500" })}
                            </div>
                            <p className="mb-2 text-gray-400">No embedding data found</p>
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
