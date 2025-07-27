import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, style, variant = 'default' }, ref) => {
    const getCardStyle = () => {
      switch (variant) {
        case 'elevated':
          return styles.elevatedCard;
        case 'outlined':
          return styles.outlinedCard;
        case 'glass':
          return styles.glassCard;
        case 'default':
        default:
          return styles.defaultCard;
      }
    };

    return (
      <View
        ref={ref}
        style={[
          styles.baseCard,
          getCardStyle(),
          style,
        ]}
      >
        {children}
      </View>
    );
  }
);

Card.displayName = 'Card';

interface StatCardProps {
  title: string;
  value: string | number;
  style?: ViewStyle;
  useCountUp?: boolean;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  style,
  useCountUp = false,
  icon,
  trend,
}) => {
  const animatedValue = React.useMemo(() => new Animated.Value(0), []);
  const [displayValue, setDisplayValue] = React.useState(useCountUp ? 0 : value);

  React.useEffect(() => {
    if (useCountUp && typeof value === 'number') {
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value: animValue }) => {
        setDisplayValue(Math.floor(animValue));
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    }
  }, [value, useCountUp, animatedValue]);

  return (
    <Card style={StyleSheet.flatten([styles.statCardContainer, style])} variant="elevated">
      <View style={styles.statCardHeader}>
        <Text style={styles.statCardTitle}>{title}</Text>
        {icon && <View style={styles.statCardIcon}>{icon}</View>}
      </View>
      
      <View style={styles.statCardContent}>
        <Text style={styles.statCardValue}>
          {useCountUp && typeof value === 'number' ? displayValue : value}
        </Text>
        
        {trend && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trendText,
                trend.isPositive ? styles.trendPositive : styles.trendNegative,
              ]}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

interface ActionCardProps {
  title: string;
  description?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  style,
  children,
  icon,
  disabled = false,
}) => {
  return (
    <Card
      style={StyleSheet.flatten([
        styles.actionCardContainer,
        disabled && styles.disabledCard,
        style,
      ])}
      variant="outlined"
    >
      <View style={styles.actionCardHeader}>
        {icon && <View style={styles.actionCardIcon}>{icon}</View>}
        <View style={styles.actionCardTextContainer}>
          <Text style={[styles.actionCardTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.actionCardDescription, disabled && styles.disabledText]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      
      {children && (
        <View style={styles.actionCardContent}>
          {children}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elevatedCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  outlinedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardContainer: {
    padding: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardIcon: {
    width: 24,
    height: 24,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#10B981',
  },
  trendNegative: {
    color: '#EF4444',
  },
  actionCardContainer: {
    padding: 16,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCardTextContainer: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionCardContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});