import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

export default function MenuSection({ title, items }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!items || items.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={COLORS.text.primary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.menuItem}>
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemPrice}>{item.price}</Text>
              </View>
              {item.description && (
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding.md,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding.md,
    backgroundColor: COLORS.primary + '10', // 10% opacity
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  itemsContainer: {
    padding: SIZES.padding.md,
  },
  menuItem: {
    marginBottom: SIZES.padding.md,
    paddingBottom: SIZES.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding.xs,
  },
  menuItemName: {
    ...FONTS.body,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SIZES.padding.sm,
  },
  menuItemPrice: {
    ...FONTS.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  menuItemDescription: {
    ...FONTS.caption,
    color: COLORS.text.secondary,
  },
}); 