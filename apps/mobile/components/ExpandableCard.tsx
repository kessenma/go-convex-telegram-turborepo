import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  ViewStyle,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';

const { height: screenHeight } = Dimensions.get('window');

interface ExpandableCardProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  buttonPosition?: {
    top: number | 'auto';
    bottom?: number;
    right: number;
  };
  liquidGlass?: boolean;
  layoutId?: string;
  maxHeight?: number;
  style?: ViewStyle;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  liquidGlass = false,
  maxHeight = screenHeight * 0.8,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showModal = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const hideModal = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    if (isOpen) {
      showModal();
    } else {
      hideModal();
    }
  }, [isOpen, fadeAnim, scaleAnim, translateY]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // If swiped down far enough or with enough velocity, close
      if (translationY > 100 || velocityY > 1000) {
        onClose();
      } else {
        // Spring back to original position
        Animated.spring(panY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getModalStyle = () => {
    if (liquidGlass) {
      return [
        styles.modalContainer,
        styles.liquidGlassContainer,
        {
          maxHeight,
          transform: [
            { scale: scaleAnim },
            { translateY: Animated.add(translateY, panY) },
          ],
          opacity: fadeAnim,
        },
        style,
      ];
    }
    
    return [
      styles.modalContainer,
      {
        maxHeight,
        transform: [
          { scale: scaleAnim },
          { translateY: Animated.add(translateY, panY) },
        ],
        opacity: fadeAnim,
      },
      style,
    ];
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.backdropOverlay,
              { opacity: fadeAnim },
            ]}
          />
        </TouchableOpacity>
        
        <View style={styles.modalWrapper} pointerEvents="box-none">
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View style={getModalStyle()}>
              <TouchableOpacity activeOpacity={1}>
                {/* Handle bar for swipe gesture */}
                <View style={styles.handleBar} />
                
                {/* Header */}
                {(title || description) && (
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderContent}>
                      {title && (
                        <Text style={styles.modalTitle}>{title}</Text>
                      )}
                      {description && (
                        <Text style={styles.modalDescription}>{description}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                    >
                      <Icon name="x" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Content */}
                <ScrollView
                  style={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {children}
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  liquidGlassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  modalContent: {
    flex: 1,
  },
});

export default ExpandableCard;