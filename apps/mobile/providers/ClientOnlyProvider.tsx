import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Provider that ensures children are only rendered on the client side
 * This is useful for React Native apps to handle hydration and ensure
 * components that depend on client-side APIs are properly initialized
 */
export function ClientOnlyProvider({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <View style={styles.fallbackContainer}>
        {fallback || <ActivityIndicator size="large" color="#0066cc" />}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});