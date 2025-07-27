import React, { Component, type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CONVEX_URL } from '@env';

// Get the appropriate Convex URL for connections
function getConvexUrl(): string {
  const url = CONVEX_URL;
  
  if (!url) {
    throw new Error("CONVEX_URL is not defined in environment variables");
  }
  
  return url;
}

// Create Convex client with error handling
let convex: ConvexReactClient;

try {
  const convexUrl = getConvexUrl();
  convex = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
  });
} catch (error) {
  console.error("Failed to initialize Convex client:", error);
  // Create a dummy client that will fail gracefully
  convex = new ConvexReactClient("https://dummy-url.convex.cloud");
}

export interface ConvexClientProviderProps {
  children: ReactNode;
}

interface ConvexErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

// Basic error screen components for React Native
const BasicDatabaseErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Database Connection Error</Text>
    <Text style={styles.errorMessage}>
      Unable to connect to the database. Please check your connection and try again.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry Connection</Text>
    </TouchableOpacity>
  </View>
);

const BasicOfflineScreen = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>No Internet Connection</Text>
    <Text style={styles.errorMessage}>
      Please check your internet connection and try again.
    </Text>
  </View>
);

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

  componentDidCatch(error: Error, errorInfo: any) {
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
      return <BasicDatabaseErrorScreen onRetry={this.handleRetry} />;
    }

    return <>{this.props.children}</>;
  }
}

export function ConvexClientProvider({
  children,
}: ConvexClientProviderProps): ReactElement {
  const [key, setKey] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Note: React Native doesn't have window.navigator.onLine
  // You might want to use @react-native-netinfo/netinfo for network detection
  // For now, we'll assume online status

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

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});