"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Card } from "../ui/card";
import { Button as MovingButton } from "../ui/moving-border";
import { Loader2, Eye, EyeOff, RotateCcw, Plus, Minus, Move, Maximize2, Minimize2, Box, Square, Info, ChevronDown, ChevronUp, Expand, Shrink } from "lucide-react";
import { renderIcon } from "../../lib/icon-utils";
import { 
    ResponsiveModal, 
    ResponsiveModalContent, 
    ResponsiveModalTrigger,
    ResponsiveModalTitle,
    ResponsiveModalDescription
} from "../ui/responsive-modal";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// 3D Embedding visualization component - using cubes to match app aesthetic
function EmbeddingPoint({ position, color, scale, onClick, onPointerOver, onPointerOut }: {
    position: [number, number, number];
    color: string;
    scale: number;
    onClick: () => void;
    onPointerOver: () => void;
    onPointerOut: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            scale={scale}
            onClick={onClick}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.3}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

function Interactive3DPlot({ data, onPointHover, onPointClick, hoveredPoint, selectedPoint, spacing = 1 }: {
    data: any[];
    onPointHover: (point: any | null) => void;
    onPointClick: (point: any) => void;
    hoveredPoint: any;
    selectedPoint: any;
    spacing?: number;
}) {
    // Calculate 3D positions using PCA-like projection with adjustable spacing
    const points3D = useMemo(() => {
        if (!data.length) return [];

        return data.map((point, index) => {
            // Use the 2D coordinates and add a Z dimension based on embedding similarity
            const z = (point.embedding_vector?.[4] || 0) * 10; // Use 5th dimension for Z
            
            return {
                ...point,
                position: [
                    point.x * 0.05 * spacing, 
                    point.y * 0.05 * spacing, 
                    z * 0.05 * spacing
                ] as [number, number, number],
                scale: hoveredPoint?.id === point.id ? 2 : selectedPoint?.id === point.id ? 1.5 : 1
            };
        });
    }, [data, hoveredPoint, selectedPoint, spacing]);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
            
            {/* Grid */}
            <gridHelper args={[20, 20, "#334155", "#1e293b"]} />
            
            {/* Points */}
            {points3D.map((point) => (
                <EmbeddingPoint
                    key={point.id}
                    position={point.position}
                    color={point.documentColor}
                    scale={point.scale}
                    onClick={() => onPointClick(point)}
                    onPointerOver={() => onPointHover(point)}
                    onPointerOut={() => onPointHover(null)}
                />
            ))}
            
            <OrbitControls enablePan enableZoom enableRotate />
        </>
    );
}

// Interactive embedding plot component
function InteractiveEmbeddingPlot({ 
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
}) {
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

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden">
            {/* View Mode Toggle */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 rounded-lg p-1 border border-cyan-500/20 flex gap-1 z-20">
                <button
                    onClick={onToggle3D}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                        !is3D 
                            ? 'bg-cyan-500 text-slate-900' 
                            : 'text-cyan-300 hover:text-cyan-200'
                    }`}
                >
                    {renderIcon(Square, { className: "w-3 h-3" })}
                    2D
                </button>
                <button
                    onClick={onToggle3D}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                        is3D 
                            ? 'bg-cyan-500 text-slate-900' 
                            : 'text-cyan-300 hover:text-cyan-200'
                    }`}
                >
                    {renderIcon(Box, { className: "w-3 h-3" })}
                    3D
                </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={onToggleFullscreen}
                    className="p-2 bg-slate-800/90 rounded-lg border border-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-colors"
                    title={isFullscreen ? "Exit Fullscreen" : "Open in Fullscreen Modal"}
                >
                    {renderIcon(isFullscreen ? Minimize2 : Maximize2, { className: "w-4 h-4" })}
                </button>
            </div>

            {is3D ? (
                // 3D View
                <Canvas className="absolute inset-0">
                    <Interactive3DPlot
                        data={scaledData}
                        onPointHover={setHoveredPoint}
                        onPointClick={(point) => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
                        hoveredPoint={hoveredPoint}
                        selectedPoint={selectedPoint}
                    />
                </Canvas>
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
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4"/>
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
                                    onClick={() => setSelectedPoint(isSelected ? null : point)}
                                />
                            </g>
                        );
                    })}
                </g>
                </svg>
            )}

            {/* Custom tooltip with cyan/slate theme */}
            {hoveredPoint && !isDragging && (
                <div 
                    className="absolute pointer-events-none z-10 bg-slate-800/95 text-white p-3 rounded-lg shadow-lg border border-cyan-500/50 max-w-xs"
                    style={{
                        left: Math.min(mousePos.x + 10, 600), // Prevent overflow
                        top: Math.max(mousePos.y - 10, 10),
                        transform: mousePos.x > 400 ? 'translateX(-100%)' : 'none'
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

            {/* Collapsible Info Section */}
            <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg border border-cyan-500/20 z-20">
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

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-2 border border-cyan-500/20">
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
                <button 
                    onClick={resetView}
                    className="mt-2 w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1"
                >
                    {renderIcon(RotateCcw, { className: "w-3 h-3" })}
                    Reset View
                </button>
            </div>

            {/* Pan indicator */}
            <div className="absolute bottom-4 right-4 bg-slate-800/90 rounded-lg p-2 text-xs text-slate-400 border border-cyan-500/20">
                <div className="flex items-center gap-1 mb-1">
                    {renderIcon(Move, { className: "w-3 h-3 text-cyan-400" })}
                    <span className="text-cyan-300">Click & Drag to Pan</span>
                </div>
                <div className="text-slate-500">
                    Pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})
                </div>
            </div>

            {/* Selected point details with cyan/slate theme */}
            {selectedPoint && (
                <div className="absolute top-20 right-4 bg-slate-800/95 rounded-lg p-3 text-xs text-white max-w-xs border border-cyan-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-cyan-300">Selected Point</div>
                        <button 
                            onClick={() => setSelectedPoint(null)}
                            className="text-slate-400 hover:text-cyan-300 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                    <div className="font-medium text-sm mb-1 text-cyan-200">
                        {selectedPoint.document_title}
                    </div>
                    <div className="text-slate-400 mb-2">
                        Chunk {selectedPoint.chunk_index} • {selectedPoint.embedding_model}
                    </div>
                    <div className="text-slate-200 leading-relaxed mb-2">
                        {selectedPoint.text}
                    </div>
                    <div className="text-slate-500">
                        Position: ({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)})
                    </div>
                </div>
            )}
        </div>
    );
}



interface EmbeddingData {
    id: string;
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
}

export function EmbeddingAtlasViewer({ className }: EmbeddingAtlasViewerProps) {
    const [data, setData] = useState<EmbeddingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [is3D, setIs3D] = useState(true); // Start with 3D view
    const [isModalOpen, setIsModalOpen] = useState(false);



    // Transform data for Embedding Atlas
    const atlasData = useMemo(() => {
        if (!data.length) return [];

        return data.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            text: item.text,
            document_title: item.document_title,
            chunk_index: item.chunk_index,
            embedding_model: item.embedding_model,
            created_at: item.created_at,
        }));
    }, [data]);

    const fetchEmbeddingData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/embeddings/atlas-data?limit=500');
            const result = await response.json();

            if (result.success) {
                setData(result.data);
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
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
        if (!isVisible && !hasLoaded) {
            fetchEmbeddingData();
        }
    };

    const refreshData = () => {
        fetchEmbeddingData();
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const toggle3D = () => {
        setIs3D(!is3D);
    };

    return (
        <div className={className}>
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
                                        {renderIcon(Loader2, { className: "w-4 h-4 animate-spin" })}
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
                                <p className="text-sm">
                                    Showing {atlasData.length} embeddings in {is3D ? '3D' : '2D'} view. 
                                    Toggle between 2D/3D modes, use fullscreen for better exploration, 
                                    and analyze your document relationships through clustering.
                                </p>
                            </div>

                            <div className="h-[600px] rounded-lg border border-cyan-500/30 bg-slate-900/50 overflow-hidden">
                                <React.Suspense
                                    fallback={
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                {renderIcon(Loader2, { className: "w-6 h-6 animate-spin" })}
                                                Loading Embedding Atlas...
                                            </div>
                                        </div>
                                    }
                                >
                                    <ResponsiveModal open={isModalOpen} onOpenChange={setIsModalOpen}>
                                        <ResponsiveModalTrigger asChild>
                                            <div className="w-full h-full">
                                                <InteractiveEmbeddingPlot 
                                                    data={atlasData} 
                                                    is3D={is3D}
                                                    isFullscreen={false}
                                                    onToggle3D={toggle3D}
                                                    onToggleFullscreen={openModal}
                                                />
                                            </div>
                                        </ResponsiveModalTrigger>
                                        <ResponsiveModalContent side="fullscreen" className="bg-slate-900 p-0">
                                            <div className="w-full h-full">
                                                <InteractiveEmbeddingPlot 
                                                    data={atlasData} 
                                                    is3D={is3D}
                                                    isFullscreen={true}
                                                    onToggle3D={toggle3D}
                                                    onToggleFullscreen={() => setIsModalOpen(false)}
                                                />
                                            </div>
                                        </ResponsiveModalContent>
                                    </ResponsiveModal>
                                </React.Suspense>
                            </div>

                            {/* Detailed data view */}
                            <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                                    <h5 className="text-lg font-medium text-cyan-300 mb-4">Embedding Details</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                        {atlasData.slice(0, 12).map((item, index) => (
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
                                                    {item.dimensions}D • {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {atlasData.length > 12 && (
                                        <div className="mt-4 text-center text-sm text-slate-400">
                                            Showing 12 of {atlasData.length} embeddings
                                        </div>
                                    )}
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