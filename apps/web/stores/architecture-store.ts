"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ArchitectureStore {
  // Animation states
  firstTimelineActive: boolean;
  secondTimelineActive: boolean;
  scrollProgress: number;
  
  // Transition states for smooth switching
  firstTimelineTransitioning: boolean;
  secondTimelineTransitioning: boolean;
  transitionProgress: number;
  
  // React Three Fiber specific states
  whaleVisible: boolean;
  whaleScrollProgress: number;
  whaleAnimationEnabled: boolean;
  whaleModelLoaded: boolean;
  whaleUseFallback: boolean;
  coolifyTimelineVisible: boolean;
  dockerComposeTimelineVisible: boolean;
  containerVisible: boolean;
  hoveredCube: number | null;
  animationSpeed: number;
  
  // Logging state
  logs: string[];
  
  // Actions
  setFirstTimelineActive: (active: boolean) => void;
  setSecondTimelineActive: (active: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setTransitionProgress: (progress: number) => void;
  setWhaleVisible: (visible: boolean) => void;
  setWhaleScrollProgress: (progress: number) => void;
  setWhaleAnimationEnabled: (enabled: boolean) => void;
  setWhaleModelLoaded: (loaded: boolean) => void;
  setWhaleUseFallback: (useFallback: boolean) => void;
  setCoolifyTimelineVisible: (visible: boolean) => void;
  setDockerComposeTimelineVisible: (visible: boolean) => void;
  setContainerVisible: (visible: boolean) => void;
  setHoveredCube: (index: number | null) => void;
  setAnimationSpeed: (speed: number) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  
  // Utility methods
  shouldRenderFirstTimeline: () => boolean;
  shouldRenderSecondTimeline: () => boolean;
  shouldKeepFirstTimelineAlive: () => boolean;
  shouldKeepSecondTimelineAlive: () => boolean;
  
  // Force re-render triggers
  firstTimelineVersion: number;
  secondTimelineVersion: number;
  incrementFirstTimelineVersion: () => void;
  incrementSecondTimelineVersion: () => void;
}

export const useArchitectureStore = create<ArchitectureStore>()(devtools(
  (set, get) => ({
    // Initial state
    firstTimelineActive: true,
    secondTimelineActive: false,
    scrollProgress: 0,
    firstTimelineTransitioning: false,
    secondTimelineTransitioning: false,
    transitionProgress: 0,
    firstTimelineVersion: 0,
    secondTimelineVersion: 0,
    
    // React Three Fiber specific states
    whaleVisible: false,
    whaleScrollProgress: 0,
    whaleAnimationEnabled: true,
    whaleModelLoaded: false,
    whaleUseFallback: false,
    coolifyTimelineVisible: false,
    dockerComposeTimelineVisible: false,
    containerVisible: false,
    hoveredCube: null,
    animationSpeed: 1,
    
    // Logging state
    logs: [],
    
    // Actions
    setFirstTimelineActive: (active) => set(
      (state) => ({ 
        firstTimelineActive: active,
        firstTimelineTransitioning: state.firstTimelineActive !== active,
        firstTimelineVersion: state.firstTimelineVersion + 1
      }),
      false,
      'setFirstTimelineActive'
    ),
    
    setSecondTimelineActive: (active) => set(
      (state) => ({ 
        secondTimelineActive: active,
        secondTimelineTransitioning: state.secondTimelineActive !== active,
        secondTimelineVersion: state.secondTimelineVersion + 1
      }),
      false,
      'setSecondTimelineActive'
    ),
    
    setScrollProgress: (progress) => set(
      { scrollProgress: progress },
      false,
      'setScrollProgress'
    ),
    
    setTransitionProgress: (progress) => set(
      { transitionProgress: progress },
      false,
      'setTransitionProgress'
    ),
    
    incrementFirstTimelineVersion: () => set(
      (state) => ({ firstTimelineVersion: state.firstTimelineVersion + 1 }),
      false,
      'incrementFirstTimelineVersion'
    ),
    
    incrementSecondTimelineVersion: () => set(
      (state) => ({ secondTimelineVersion: state.secondTimelineVersion + 1 }),
      false,
      'incrementSecondTimelineVersion'
    ),
    
    setWhaleVisible: (visible) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.whaleVisible === visible) return state;
          return { whaleVisible: visible };
        },
        false,
        'setWhaleVisible'
      );
    },
    
    setWhaleScrollProgress: (progress) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (Math.abs(state.whaleScrollProgress - progress) < 0.01) return state;
          return { whaleScrollProgress: progress };
        },
        false,
        'setWhaleScrollProgress'
      );
    },
    
    setWhaleAnimationEnabled: (enabled) => {
      set(
        (state) => {
          if (state.whaleAnimationEnabled === enabled) return state;
          return { whaleAnimationEnabled: enabled };
        },
        false,
        'setWhaleAnimationEnabled'
      );
    },
    
    setWhaleModelLoaded: (loaded) => {
      set(
        (state) => {
          if (state.whaleModelLoaded === loaded) return state;
          return { whaleModelLoaded: loaded };
        },
        false,
        'setWhaleModelLoaded'
      );
    },
    
    setWhaleUseFallback: (useFallback) => {
      set(
        (state) => {
          if (state.whaleUseFallback === useFallback) return state;
          return { whaleUseFallback: useFallback };
        },
        false,
        'setWhaleUseFallback'
      );
    },
    
    setCoolifyTimelineVisible: (visible) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.coolifyTimelineVisible === visible) return state;
          return { coolifyTimelineVisible: visible };
        },
        false,
        'setCoolifyTimelineVisible'
      );
    },
    
    setDockerComposeTimelineVisible: (visible) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.dockerComposeTimelineVisible === visible) return state;
          return { dockerComposeTimelineVisible: visible };
        },
        false,
        'setDockerComposeTimelineVisible'
      );
    },
    
    setContainerVisible: (visible) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.containerVisible === visible) return state;
          return { containerVisible: visible };
        },
        false,
        'setContainerVisible'
      );
    },
    
    setHoveredCube: (index) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.hoveredCube === index) return state;
          return { hoveredCube: index };
        },
        false,
        'setHoveredCube'
      );
    },
    
    setAnimationSpeed: (speed) => {
      set(
        (state) => {
          // Only update if value actually changed to prevent unnecessary re-renders
          if (state.animationSpeed === speed) return state;
          return { animationSpeed: speed };
        },
        false,
        'setAnimationSpeed'
      );
    },
    
    addLog: (message) => set(
      (state) => ({ 
        logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
      }),
      false,
      'addLog'
    ),
    
    clearLogs: () => set(
      { logs: [] },
      false,
      'clearLogs'
    ),
    
    // Utility methods
    shouldRenderFirstTimeline: () => {
      const { firstTimelineActive } = get();
      return firstTimelineActive;
    },
    
    shouldRenderSecondTimeline: () => {
      const { secondTimelineActive, scrollProgress } = get();
      return secondTimelineActive && scrollProgress > 0;
    },
    
    shouldKeepFirstTimelineAlive: () => {
      const { firstTimelineActive, firstTimelineTransitioning } = get();
      return firstTimelineActive || firstTimelineTransitioning;
    },
    
    shouldKeepSecondTimelineAlive: () => {
      const { secondTimelineActive, secondTimelineTransitioning, scrollProgress } = get();
      return (secondTimelineActive && scrollProgress > 0) || secondTimelineTransitioning;
    }
  }),
  {
    name: 'architecture-store',
  }
));