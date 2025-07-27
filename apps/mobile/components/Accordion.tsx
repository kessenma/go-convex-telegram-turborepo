import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AccordionContextType = {
  expandedValue: React.Key | null;
  toggleItem: (value: React.Key) => void;
};

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an AccordionProvider');
  }
  return context;
}

export type AccordionProviderProps = {
  children: ReactNode;
  expandedValue?: React.Key | null;
  onValueChange?: (value: React.Key | null) => void;
};

function AccordionProvider({
  children,
  expandedValue: externalExpandedValue,
  onValueChange,
}: AccordionProviderProps) {
  const [internalExpandedValue, setInternalExpandedValue] =
    useState<React.Key | null>(null);

  const expandedValue =
    externalExpandedValue !== undefined
      ? externalExpandedValue
      : internalExpandedValue;

  const toggleItem = (value: React.Key) => {
    const newValue = expandedValue === value ? null : value;
    
    // Configure layout animation
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleY,
      },
    });
    
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalExpandedValue(newValue);
    }
  };

  return (
    <AccordionContext.Provider value={{ expandedValue, toggleItem }}>
      {children}
    </AccordionContext.Provider>
  );
}

export type AccordionProps = {
  children: ReactNode;
  style?: ViewStyle;
  expandedValue?: React.Key | null;
  onValueChange?: (value: React.Key | null) => void;
  variant?: 'default' | 'bordered' | 'separated';
};

function Accordion({
  children,
  style,
  expandedValue,
  onValueChange,
  variant = 'default',
}: AccordionProps) {
  const getAccordionStyle = () => {
    switch (variant) {
      case 'bordered':
        return styles.borderedAccordion;
      case 'separated':
        return styles.separatedAccordion;
      case 'default':
      default:
        return styles.defaultAccordion;
    }
  };

  return (
    <View style={[styles.accordion, getAccordionStyle(), style]}>
      <AccordionProvider
        expandedValue={expandedValue}
        onValueChange={onValueChange}
      >
        {children}
      </AccordionProvider>
    </View>
  );
}

export type AccordionItemProps = {
  value: React.Key;
  children: ReactNode;
  style?: ViewStyle;
};

function AccordionItem({ value, children, style }: AccordionItemProps) {
  const { expandedValue } = useAccordion();
  const isExpanded = value === expandedValue;

  return (
    <View
      style={[
        styles.accordionItem,
        isExpanded && styles.expandedItem,
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...(child.props as any),
            value,
            expanded: isExpanded,
          });
        }
        return child;
      })}
    </View>
  );
}

export type AccordionTriggerProps = {
  children: ReactNode;
  style?: ViewStyle;
  textStyle?: ViewStyle;
  iconStyle?: ViewStyle;
  disabled?: boolean;
};

function AccordionTrigger({
  children,
  style,
  textStyle,
  iconStyle,
  disabled = false,
  ...props
}: AccordionTriggerProps) {
  const { toggleItem, expandedValue } = useAccordion();
  const value = (props as { value?: React.Key }).value;
  const isExpanded = value === expandedValue;
  const rotateAnim = React.useMemo(
    () => new Animated.Value(isExpanded ? 1 : 0),
[isExpanded] // Include isExpanded in dependency array since it affects the initial value
  );

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      onPress={() => !disabled && value !== undefined && toggleItem(value)}
      disabled={disabled}
      style={[
        styles.accordionTrigger,
        isExpanded && styles.expandedTrigger,
        disabled && styles.disabledTrigger,
        style,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.triggerContent}>
        <Text
          style={[
            styles.triggerText,
            isExpanded && styles.expandedTriggerText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {children}
        </Text>
        <Animated.View
          style={[
            styles.triggerIcon,
            { transform: [{ rotate: rotation }] },
            iconStyle,
          ]}
        >
          <Icon
            name="chevron-down"
            size={20}
            color={disabled ? '#9CA3AF' : isExpanded ? '#3B82F6' : '#6B7280'}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export type AccordionContentProps = {
  children: ReactNode;
  style?: ViewStyle;
};

function AccordionContent({
  children,
  style,
  ...props
}: AccordionContentProps) {
  const { expandedValue } = useAccordion();
  const value = (props as { value?: React.Key }).value;
  const isExpanded = value === expandedValue;

  if (!isExpanded) {
    return null;
  }

  return (
    <View style={[styles.accordionContent, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  accordion: {
    overflow: 'hidden',
  },
  defaultAccordion: {
    backgroundColor: 'transparent',
  },
  borderedAccordion: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  separatedAccordion: {
    backgroundColor: 'transparent',
  },
  accordionItem: {
    overflow: 'hidden',
  },
  expandedItem: {
    // Additional styles for expanded items if needed
  },
  accordionTrigger: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandedTrigger: {
    backgroundColor: '#F8FAFC',
    borderBottomColor: '#E5E7EB',
  },
  disabledTrigger: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  triggerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  expandedTriggerText: {
    color: '#3B82F6',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  triggerIcon: {
    marginLeft: 12,
  },
  accordionContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };