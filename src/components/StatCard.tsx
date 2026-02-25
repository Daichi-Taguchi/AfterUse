import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface Props {
  title: string;
  value: string;
  icon: string;
}

export function StatCard({ title, value, icon }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <Text variant="titleMedium">{title}</Text>
          <Text variant="titleMedium">{icon}</Text>
        </View>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    marginVertical: 6
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  value: {
    marginTop: 8,
    fontWeight: '700'
  }
});
