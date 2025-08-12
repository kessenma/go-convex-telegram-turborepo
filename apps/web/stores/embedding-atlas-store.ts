import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useMemo } from 'react';

export interface EmbeddingData {
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

export interface ScaledEmbeddingData extends EmbeddingData {
  scaledX: number;
  scaledY: number;
  color: string;
  documentColor: string;
  position?: [number, number, number];
  scale?: number;
  opacity?: number;
}

interface EmbeddingAtlasState {
  // Data state
  data: EmbeddingData[];
  scaledData: ScaledEmbeddingData[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  totalVectors: number;
  currentPage: number;
  detailsPage: number;
  
  // UI state
  isVisible: boolean;
  is3D: boolean;
  isModalOpen: boolean;
  isInteractive: boolean; // For auto-rotation control
  
  // 3D interaction state
  hoveredPoint: EmbeddingData | null;
  selectedPoint: EmbeddingData | null;
  isSelectedExpanded: boolean;
  spacing: number;
  
  // 2D interaction state
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  panStart: { x: number; y: number };
  mousePos: { x: number; y: number };
  
  // Document viewer state
  documentViewerOpen: boolean;
  selectedDocumentId: string | null;
  
  // Constants
  VECTORS_PER_PAGE: number;
  DETAILS_PER_PAGE: number;
}

interface EmbeddingAtlasActions {
  // Data actions
  setData: (data: EmbeddingData[], append?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoaded: (hasLoaded: boolean) => void;
  setTotalVectors: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setDetailsPage: (page: number) => void;
  
  // UI actions
  setIsVisible: (visible: boolean) => void;
  setIs3D: (is3D: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsInteractive: (interactive: boolean) => void;
  
  // Interaction actions
  setHoveredPoint: (point: EmbeddingData | null) => void;
  setSelectedPoint: (point: EmbeddingData | null) => void;
  setIsSelectedExpanded: (expanded: boolean) => void;
  setSpacing: (spacing: number) => void;
  
  // 2D view actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (start: { x: number; y: number }) => void;
  setPanStart: (start: { x: number; y: number }) => void;
  setMousePos: (pos: { x: number; y: number }) => void;
  
  // Document viewer actions
  setDocumentViewerOpen: (open: boolean) => void;
  setSelectedDocumentId: (id: string | null) => void;
  
  // Computed actions
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  expandSpacing: () => void;
  contractSpacing: () => void;
  nextDetailsPage: () => void;
  prevDetailsPage: () => void;
  
  // Auto-rotation control
  enableInteractivity: () => void;
}

type EmbeddingAtlasStore = EmbeddingAtlasState & EmbeddingAtlasActions;

export const useEmbeddingAtlasStore = create<EmbeddingAtlasStore>()
  (devtools(
    immer((set, get) => ({
      // Initial state
      data: [],
      scaledData: [],
      loading: false,
      error: null,
      hasLoaded: false,
      totalVectors: 0,
      currentPage: 0,
      detailsPage: 0,
      
      isVisible: false,
      is3D: true,
      isModalOpen: false,
      isInteractive: false, // Start with auto-rotation
      
      hoveredPoint: null,
      selectedPoint: null,
      isSelectedExpanded: false,
      spacing: 2,
      
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      panStart: { x: 0, y: 0 },
      mousePos: { x: 0, y: 0 },
      
      documentViewerOpen: false,
      selectedDocumentId: null,
      
      VECTORS_PER_PAGE: 100,
      DETAILS_PER_PAGE: 12,
      
      // Actions
      setData: (data, append = false) => set((state) => {
        if (append) {
          state.data = [...state.data, ...data];
        } else {
          state.data = data;
        }
        
        // Recalculate scaled data when raw data changes
        if (state.data.length > 0) {
          const xs = state.data.map(d => d.x);
          const ys = state.data.map(d => d.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          
          const xRange = maxX - minX || 1;
          const yRange = maxY - minY || 1;
          
          const documentColors = [
            '#22d3ee', '#06b6d4', '#67e8f9', '#0891b2',
            '#a5f3fc', '#0e7490', '#cffafe', '#155e75'
          ];
          
          state.scaledData = state.data.map((point, index) => {
            const normalizedX = (point.x - minX) / xRange;
            const normalizedY = (point.y - minY) / yRange;
            
            const x = 80 + normalizedX * (800 - 160);
            const y = 80 + (1 - normalizedY) * (600 - 160);
            
            const documentHash = point.document_title.charCodeAt(0) % 8;
            
            return {
              ...point,
              scaledX: x,
              scaledY: y,
              color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
              documentColor: documentColors[documentHash],
              position: [
                point.x * 0.05 * state.spacing,
                point.y * 0.05 * state.spacing,
                (point.embedding_vector?.[4] || 0) * 10 * 0.05 * state.spacing
              ] as [number, number, number],
              scale: 1,
              opacity: 1
            };
          });
        }
      }),
      
      setLoading: (loading) => set((state) => { state.loading = loading; }),
      setError: (error) => set((state) => { state.error = error; }),
      setHasLoaded: (hasLoaded) => set((state) => { state.hasLoaded = hasLoaded; }),
      setTotalVectors: (total) => set((state) => { state.totalVectors = total; }),
      setCurrentPage: (page) => set((state) => { state.currentPage = page; }),
      setDetailsPage: (page) => set((state) => { state.detailsPage = page; }),
      
      setIsVisible: (visible) => set((state) => { state.isVisible = visible; }),
      setIs3D: (is3D) => set((state) => { state.is3D = is3D; }),
      setIsModalOpen: (open) => set((state) => { state.isModalOpen = open; }),
      setIsInteractive: (interactive) => set((state) => { state.isInteractive = interactive; }),
      
      setHoveredPoint: (point) => set((state) => { 
        // Only update if the hovered point actually changed
        if (state.hoveredPoint?.id === point?.id) return;
        
        state.hoveredPoint = point;
        // Update scaled data with hover effects only if we have data
        if (state.scaledData.length > 0) {
          state.scaledData = state.scaledData.map(p => ({
            ...p,
            scale: point?.id === p.id ? 2 : state.selectedPoint?.id === p.id ? 1.5 : 1,
            opacity: point && point.id !== p.id && state.selectedPoint?.id !== p.id ? 0.3 : 1
          }));
        }
      }),
      
      setSelectedPoint: (point) => set((state) => { 
        // Only update if the selected point actually changed
        if (state.selectedPoint?.id === point?.id) return;
        
        state.selectedPoint = point;
        state.isSelectedExpanded = false;
        // Update scaled data with selection effects only if we have data
        if (state.scaledData.length > 0) {
          state.scaledData = state.scaledData.map(p => ({
            ...p,
            scale: state.hoveredPoint?.id === p.id ? 2 : point?.id === p.id ? 1.5 : 1
          }));
        }
      }),
      
      setIsSelectedExpanded: (expanded) => set((state) => { state.isSelectedExpanded = expanded; }),
      
      setSpacing: (spacing) => set((state) => { 
        state.spacing = spacing;
        // Recalculate 3D positions when spacing changes
        state.scaledData = state.scaledData.map(point => ({
          ...point,
          position: [
            point.x * 0.05 * spacing,
            point.y * 0.05 * spacing,
            (point.embedding_vector?.[4] || 0) * 10 * 0.05 * spacing
          ] as [number, number, number]
        }));
      }),
      
      setZoom: (zoom) => set((state) => { state.zoom = zoom; }),
      setPan: (pan) => set((state) => { state.pan = pan; }),
      setIsDragging: (dragging) => set((state) => { state.isDragging = dragging; }),
      setDragStart: (start) => set((state) => { state.dragStart = start; }),
      setPanStart: (start) => set((state) => { state.panStart = start; }),
      setMousePos: (pos) => set((state) => { state.mousePos = pos; }),
      
      setDocumentViewerOpen: (open) => set((state) => { state.documentViewerOpen = open; }),
      setSelectedDocumentId: (id) => set((state) => { state.selectedDocumentId = id; }),
      
      resetView: () => set((state) => {
        state.zoom = 1;
        state.pan = { x: 0, y: 0 };
        state.selectedPoint = null;
        state.spacing = 2;
        state.isSelectedExpanded = false;
      }),
      
      zoomIn: () => set((state) => {
        state.zoom = Math.min(3, state.zoom * 1.2);
      }),
      
      zoomOut: () => set((state) => {
        state.zoom = Math.max(0.5, state.zoom / 1.2);
      }),
      
      expandSpacing: () => set((state) => {
        const newSpacing = Math.min(5, state.spacing * 1.3);
        state.spacing = newSpacing;
        // Recalculate 3D positions
        state.scaledData = state.scaledData.map(point => ({
          ...point,
          position: [
            point.x * 0.05 * newSpacing,
            point.y * 0.05 * newSpacing,
            (point.embedding_vector?.[4] || 0) * 10 * 0.05 * newSpacing
          ] as [number, number, number]
        }));
      }),
      
      contractSpacing: () => set((state) => {
        const newSpacing = Math.max(0.5, state.spacing / 1.3);
        state.spacing = newSpacing;
        // Recalculate 3D positions
        state.scaledData = state.scaledData.map(point => ({
          ...point,
          position: [
            point.x * 0.05 * newSpacing,
            point.y * 0.05 * newSpacing,
            (point.embedding_vector?.[4] || 0) * 10 * 0.05 * newSpacing
          ] as [number, number, number]
        }));
      }),
      
      nextDetailsPage: () => set((state) => {
        const maxPage = Math.ceil(state.data.length / state.DETAILS_PER_PAGE) - 1;
        if (state.detailsPage < maxPage) {
          state.detailsPage += 1;
        }
      }),
      
      prevDetailsPage: () => set((state) => {
        if (state.detailsPage > 0) {
          state.detailsPage -= 1;
        }
      }),
      
      enableInteractivity: () => set((state) => {
        state.isInteractive = true;
      })
    })),
    {
      name: 'embedding-atlas-store'
    }
  ))

// Memoized selectors for performance
export const useEmbeddingData = () => useEmbeddingAtlasStore(state => state.data);
export const useScaledData = () => useEmbeddingAtlasStore(state => state.scaledData);
export const useLoadingState = () => {
  const loading = useEmbeddingAtlasStore((s) => s.loading);
  const error = useEmbeddingAtlasStore((s) => s.error);
  const hasLoaded = useEmbeddingAtlasStore((s) => s.hasLoaded);
  return useMemo(() => ({ loading, error, hasLoaded }), [loading, error, hasLoaded]);
};
export const useUIState = () => {
  const isVisible = useEmbeddingAtlasStore((s) => s.isVisible);
  const is3D = useEmbeddingAtlasStore((s) => s.is3D);
  const isModalOpen = useEmbeddingAtlasStore((s) => s.isModalOpen);
  const isInteractive = useEmbeddingAtlasStore((s) => s.isInteractive);
  return useMemo(() => ({ isVisible, is3D, isModalOpen, isInteractive }), [isVisible, is3D, isModalOpen, isInteractive]);
};
export const useInteractionState = () => {
  const hoveredPoint = useEmbeddingAtlasStore((s) => s.hoveredPoint);
  const selectedPoint = useEmbeddingAtlasStore((s) => s.selectedPoint);
  const isSelectedExpanded = useEmbeddingAtlasStore((s) => s.isSelectedExpanded);
  const spacing = useEmbeddingAtlasStore((s) => s.spacing);
  return useMemo(() => ({ hoveredPoint, selectedPoint, isSelectedExpanded, spacing }), [hoveredPoint, selectedPoint, isSelectedExpanded, spacing]);
};
export const use2DViewState = () => {
  const zoom = useEmbeddingAtlasStore((s) => s.zoom);
  const pan = useEmbeddingAtlasStore((s) => s.pan);
  const isDragging = useEmbeddingAtlasStore((s) => s.isDragging);
  const mousePos = useEmbeddingAtlasStore((s) => s.mousePos);
  return useMemo(() => ({ zoom, pan, isDragging, mousePos }), [zoom, pan, isDragging, mousePos]);
};
export const usePaginationState = () => {
  const currentPage = useEmbeddingAtlasStore((s) => s.currentPage);
  const detailsPage = useEmbeddingAtlasStore((s) => s.detailsPage);
  const totalVectors = useEmbeddingAtlasStore((s) => s.totalVectors);
  const VECTORS_PER_PAGE = useEmbeddingAtlasStore((s) => s.VECTORS_PER_PAGE);
  const DETAILS_PER_PAGE = useEmbeddingAtlasStore((s) => s.DETAILS_PER_PAGE);
  return useMemo(() => ({ currentPage, detailsPage, totalVectors, VECTORS_PER_PAGE, DETAILS_PER_PAGE }), [currentPage, detailsPage, totalVectors, VECTORS_PER_PAGE, DETAILS_PER_PAGE]);
};

// Computed selectors
export const usePaginatedDetailsData = () => {
  const data = useEmbeddingAtlasStore((s) => s.data);
  const detailsPage = useEmbeddingAtlasStore((s) => s.detailsPage);
  const perPage = useEmbeddingAtlasStore((s) => s.DETAILS_PER_PAGE);
  return useMemo(() => {
    const startIndex = detailsPage * perPage;
    return data.slice(startIndex, startIndex + perPage);
  }, [data, detailsPage, perPage]);
};
