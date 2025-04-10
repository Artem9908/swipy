import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

export default function ActionButton({ 
  title, 
  icon, 
  onPress, 
  type = 'primary', 
  size = 'medium',
  disabled = false
}) {
  const buttonStyles = [
    styles.button,
    styles[`${type}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton
  ];
  
  const textStyles = [
    styles.text,
    styles[`${type}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText
  ];
  
  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} 
          color={type === 'primary' ? COLORS.text.inverse : COLORS.primary} 
          style={styles.icon}
        />
      )}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  smallButton: {
    paddingVertical: SIZES.padding.xs,
    paddingHorizontal: SIZES.padding.sm,
  },
  mediumButton: {
    paddingVertical: SIZES.padding.sm,
    paddingHorizontal: SIZES.padding.md,
  },
  largeButton: {
    paddingVertical: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.lg,
  },
  disabledButton: {
    backgroundColor: COLORS.inactive,
    borderColor: COLORS.inactive,
  },
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: COLORS.text.inverse,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  textText: {
    color: COLORS.primary,
  },
  smallText: {
    ...FONTS.small,
  },
  mediumText: {
    ...FONTS.body,
  },
  largeText: {
    ...FONTS.h3,
  },
  disabledText: {
    color: COLORS.text.light,
  },
  icon: {
    marginRight: SIZES.padding.xs,
  }
}); 