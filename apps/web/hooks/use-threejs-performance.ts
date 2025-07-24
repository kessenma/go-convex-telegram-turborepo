"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ThreeJSScene {
  id: string;
  priority: number; // 1 = highest, 3 = lowest
  isVisible: boolean;
  shouldRender: boolean;
}

class ThreeJSPerformanceManager {
  private scenes: Map<string, ThreeJSScene> = new Map();
  private maxConcurrentScenes = 2; // Limit concurrent rendering
  private frameThrottle = 16; // ~60fps
  private lastFrameTime = 0;
  private subscribers: Set<(scenes: Map<string, ThreeJSScene>) => void> = new Set();

  addScene(id: string, priority: number = 2): void {
    this.scenes.set(id, {
      id,
      priority,
      isVisible: false,
      shouldRender: false,
    });
    this.updateRenderStates();
  }

  removeScene(id: string): void {
    this.scenes.delete(id);
    this.updateRenderStates();
  }

  updateSceneVisibility(id: string, isVisible: boolean): void {
    const scene = this.scenes.get(id);
    if (scene) {
      scene.isVisible = isVisible;
      this.updateRenderStates();
    }
  }

  private updateRenderStates(): void {
    // Get visible scenes sorted by priority
    const visibleScenes = Array.from(this.scenes.values())
      .filter(scene => scene.isVisible)
      .sort((a, b) => a.priority - b.priority);

    // Reset all render states
    this.scenes.forEach(scene => {
      scene.shouldRender = false;
    });

    // Enable rendering for top priority scenes up to the limit
    visibleScenes.slice(0, this.maxConcurrentScenes).forEach(scene => {
      scene.shouldRender = true;
    });

    this.notifySubscribers();
  }

  shouldRenderScene(id: string): boolean {
    const now = performance.now();
    if (now - this.lastFrameTime < this.frameThrottle) {
      return false;
    }
    
    const scene = this.scenes.get(id);
    return scene?.shouldRender ?? false;
  }

  updateFrameTime(): void {
    this.lastFrameTime = performance.now();
  }

  subscribe(callback: (scenes: Map<string, ThreeJSScene>) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(new Map(this.scenes)));
  }

  // Performance monitoring
  getActiveSceneCount(): number {
    return Array.from(this.scenes.values()).filter(scene => scene.shouldRender).length;
  }
}

// Global instance
const performanceManager = new ThreeJSPerformanceManager();

export function useThreeJSPerformance(sceneId: string, priority: number = 2) {
  const [shouldRender, setShouldRender] = useState(false);
  const frameRequestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    performanceManager.addScene(sceneId, priority);
    
    const unsubscribe = performanceManager.subscribe(() => {
      setShouldRender(performanceManager.shouldRenderScene(sceneId));
    });

    return () => {
      performanceManager.removeScene(sceneId);
      unsubscribe();
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [sceneId, priority]);

  const updateVisibility = useCallback((isVisible: boolean) => {
    performanceManager.updateSceneVisibility(sceneId, isVisible);
  }, [sceneId]);

  const requestFrame = useCallback((callback: () => void) => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
    }
    
    frameRequestRef.current = requestAnimationFrame(() => {
      if (shouldRender) {
        performanceManager.updateFrameTime();
        callback();
      }
    });
  }, [shouldRender]);

  return {
    shouldRender,
    updateVisibility,
    requestFrame,
    activeScenes: performanceManager.getActiveSceneCount(),
  };
}