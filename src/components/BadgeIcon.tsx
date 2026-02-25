import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../constants/theme';

interface Props {
  name: string;
  icon: string;
  earned: boolean;
}

export function BadgeIcon({ name, icon, earned }: Props) {
  return (
    <View style={[styles.container, !earned && styles.disabled]}>
      <Text variant="headlineSmall">{icon}</Text>
      <Text variant="bodySmall" style={styles.label}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 8
  },
  disabled: {
    opacity: 0.4,
    backgroundColor: colors.background
  },
  label: {
    textAlign: 'center',
    marginTop: 6
  }
});
