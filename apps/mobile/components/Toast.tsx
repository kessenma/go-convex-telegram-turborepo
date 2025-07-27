import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import { useToastStore, Toast as ToastType } from '../stores/useToastStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const translateY = useMemo(() => new Animated.Value(-100), []);
  const translateX = useMemo(() => new Animated.Value(0), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.8), []);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(toast.id);
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // If swiped far enough or with enough velocity, dismiss
      if (Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 1000) {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? screenWidth : -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onRemove(toast.id);
        });
      } else {
        // Spring back to original position
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'warning':
        return styles.warningToast;
      case 'info':
      default:
        return styles.infoToast;
    }
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
      default:
        return 'info';
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.toastContainer,
          getToastStyle(),
          {
            transform: [
              { translateY },
              { translateX },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        <View style={styles.toastContent}>
          <Icon
            name={getIconName()}
            size={20}
            color={getIconColor()}
            style={styles.toastIcon}
          />
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            {toast.description && (
              <Text style={styles.toastDescription}>{toast.description}</Text>
            )}
          </View>
          {toast.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toast.action.onPress}
            >
              <Text style={styles.actionButtonText}>{toast.action.label}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
          >
            <Icon name="x" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={[
          styles.container,
          { top: insets.top + 10 },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((toast, index) => (
          <View
            key={toast.id}
            style={[
              styles.toastWrapper,
              { zIndex: 1000 - index },
            ]}
          >
            <ToastItem toast={toast} onRemove={removeToast} />
          </View>
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  toastContainer: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  successToast: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  errorToast: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningToast: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoToast: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  toastIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  toastDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default ToastContainer;

// Export individual Toast component as well
export { ToastItem as Toast };