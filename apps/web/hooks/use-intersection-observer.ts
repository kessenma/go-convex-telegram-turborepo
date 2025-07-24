"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  throttleMs?: number;
}

// Global throttling for intersection observer callbacks
const throttledCallbacks = new Map<string, number>();

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackIdRef = useRef<string>(`observer-${Math.random()}`);

  const { 
    threshold = 0.1, 
    rootMargin = "0px", 
    triggerOnce = false,
    throttleMs = 16 // ~60fps throttling
  } = options;

  const throttledSetIntersecting = useCallback((isVisible: boolean) => {
    const callbackId = callbackIdRef.current;
    const now = performance.now();
    const lastCall = throttledCallbacks.get(callbackId) || 0;
    
    if (now - lastCall >= throttleMs) {
      throttledCallbacks.set(callbackId, now);
      setIsIntersecting(isVisible);
      
      if (isVisible && !hasIntersected) {
        setHasIntersected(true);
      }
    }
  }, [throttleMs, hasIntersected]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting ?? false;
        throttledSetIntersecting(isVisible);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      // Clean up throttle tracking
      throttledCallbacks.delete(callbackIdRef.current);
    };
  }, [threshold, rootMargin, throttledSetIntersecting]);

  // Return the current visibility state or permanent true if triggerOnce and has intersected
  const shouldRender = triggerOnce ? hasIntersected : isIntersecting;

  return {
    ref: elementRef,
    isIntersecting: shouldRender,
    hasIntersected,
  };
}
