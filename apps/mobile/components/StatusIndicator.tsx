import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * StatusIndicator - A React Native component that displays connection/status states
 * 
 * Usage examples:
 * <StatusIndicator status="connected" />
 * <StatusIndicator status="connecting" showLabel={true} />
 * <StatusIndicator status="disconnected" size="lg" showLabel={true} />
 * <StatusIndicator status="active" size="sm" />
 */

interface StatusIndicatorProps {
  status: "connected" | "connecting" | "disconnected" | "active";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: any;
}

const statusColors = {
  connected: '#10b981', // green-500
  connecting: '#eab308', // yellow-500
  disconnected: '#ef4444', // red-500
  active: '#06b6d4', // cyan-400
};

const statusSizes = {
  sm: { width: 8, height: 8 },
  md: { width: 12, height: 12 },
  lg: { width: 16, height: 16 },
};

const statusLabels = {
  connected: "Connected",
  connecting: "Connecting",
  disconnected: "Disconnected",
  active: "Active",
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  showLabel = false,
  style,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.indicator,
          statusSizes[size],
          { 
            backgroundColor: statusColors[status],
            opacity: pulseAnim,
          },
        ]}
      />
      {showLabel && (
        <Text style={styles.label}>
          {statusLabels[status]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
});