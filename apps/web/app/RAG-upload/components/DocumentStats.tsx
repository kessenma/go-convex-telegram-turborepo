"use client";

import React, { useEffect, useRef, useState } from 'react';

interface DocumentStatsProps {
  statsQuery: {
    totalDocuments: number;
    totalWords: number;
    totalSize: number;
    contentTypes: {
      markdown?: number;
      text?: number;
    };
  } | undefined;
}

const Counter = ({ value, format = (val: number) => val.toString() }: { value: number; format?: (val: number) => string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    setHasAnimated(true);
    const duration = 2000; // 2 seconds
    const frames = duration / 16; // ~60fps
    const increment = value / frames;
    let currentCount = 0;

    const updateCount = () => {
      currentCount += increment;
      if (currentCount >= value) {
        currentCount = value;
        setCount(value);
        return;
      }
      setCount(Math.floor(currentCount));
      animationRef.current = requestAnimationFrame(updateCount);
    };

    animationRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, isInView, hasAnimated]);

  return (
    <div ref={ref} className="text-2xl font-bold text-white">
      {format(count)}
    </div>
  );
};

export function DocumentStats({ statsQuery }: DocumentStatsProps): React.ReactElement | null {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!statsQuery) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Documents</div>
        <Counter value={statsQuery.totalDocuments} />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Words</div>
        <Counter 
          value={statsQuery.totalWords} 
          format={(val) => val.toLocaleString()}
        />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Total Size</div>
        <Counter 
          value={statsQuery.totalSize} 
          format={formatFileSize}
        />
      </div>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-sm font-medium text-curious-cyan-400">Markdown Files</div>
        <Counter value={statsQuery.contentTypes.markdown || 0} />
      </div>
    </div>
  );
}