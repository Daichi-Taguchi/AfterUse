import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { WasteType } from '../types';

const labelByType: Record<WasteType, string> = {
  plastic: 'Plastic',
  paper: 'Paper',
  metal: 'Metal',
  glass: 'Glass',
  mixed: 'Mixed'
};

const iconByType: Record<WasteType, string> = {
  plastic: 'bottle-soda-outline',
  paper: 'file-document-outline',
  metal: 'hammer-wrench',
  glass: 'glass-fragile',
  mixed: 'recycle'
};

interface Props {
  type: WasteType;
  selected: boolean;
  onPress: () => void;
}

export function WasteTypeButton({ type, selected, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Button
        mode={selected ? 'contained' : 'outlined'}
        icon={iconByType[type]}
        onPress={onPress}
        contentStyle={styles.buttonContent}
      >
        {labelByType[type]}
      </Button>
      <Text variant="bodySmall">{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '31%'
  },
  buttonContent: {
    height: 52
  }
});
