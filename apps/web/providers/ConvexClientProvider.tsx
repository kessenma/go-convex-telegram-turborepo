"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  Component,
  type ErrorInfo,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  BasicDatabaseErrorScreen,
  BasicOfflineScreen,
} from "../components/ui/basic-error-screen";

// Convert HTTP/HTTPS/WSS URLs to the appropriate format for ConvexReactClient
function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not defined");
  }
  
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

// Create Convex client with error handling
let convex: ConvexReactClient;

try {
  const convexUrl = getConvexUrl();
  convex = new ConvexReactClient(convexUrl);
} catch (error) {
  console.error("Failed to initialize Convex client:", error);
  // Create a dummy client that will fail gracefully
  convex = new ConvexReactClient("https://dummy-url.convex.cloud");
}

interface ConvexClientProviderProps {
  children: ReactNode;
}

interface ConvexErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ConvexErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  ConvexErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ConvexErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Convex Error Boundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
    }));
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return <BasicDatabaseErrorScreen />;
    }

    return <>{this.props.children}</>;
  }
}

export function ConvexClientProvider({
  children,
}: ConvexClientProviderProps): ReactElement {
  const [key, setKey] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setKey((prev) => prev + 1);
  };

  if (!isOnline) {
    return <BasicOfflineScreen />;
  }

  return (
    <ConvexErrorBoundary onRetry={handleRetry}>
      <ConvexProvider key={key} client={convex}>
        {children}
      </ConvexProvider>
    </ConvexErrorBoundary>
  );
}
