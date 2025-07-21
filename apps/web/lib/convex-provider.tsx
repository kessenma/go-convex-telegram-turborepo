"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

// Convert HTTP/HTTPS/WSS URLs to the appropriate format for ConvexReactClient
function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL!;
  
  // Handle WSS URLs by converting to HTTPS
  if (url.startsWith('wss://')) {
    return url.replace('wss://', 'https://');
  }
  
  // Handle WS URLs by converting to HTTP
  if (url.startsWith('ws://')) {
    return url.replace('ws://', 'http://');
  }
  
  // If it's already a proper deployment URL, use it as-is
  if (url.startsWith('https://') && !url.includes('localhost')) {
    return url;
  }
  
  // For local development, ensure it's HTTP
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url.replace('https://', 'http://');
  }
  
  return url;
}

const convex = new ConvexReactClient(getConvexUrl());

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
