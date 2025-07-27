import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ActionButtonProps {
  title: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  title, 
  icon, 
  onPress, 
  variant = 'secondary',
  size = 'sm'
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        styles[variant],
        styles[size]
      ]} 
      onPress={onPress}
    >
      <View style={styles.content}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
    color: '#ffffff',
  },
});