import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../src/constants/theme';

export default function YourAuraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your Aura</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
});
