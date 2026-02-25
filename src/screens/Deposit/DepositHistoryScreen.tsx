import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, List, SegmentedButtons, Text } from 'react-native-paper';
import { useDeposits } from '../../hooks/useDeposits';
import { WasteType } from '../../types';

type PeriodFilter = 'week' | 'month' | 'all';

export function DepositHistoryScreen() {
  const { deposits } = useDeposits();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [wasteType, setWasteType] = useState<WasteType | 'all'>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    return deposits.filter((d) => {
      const date = new Date(d.timestamp);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      const matchPeriod =
        period === 'all' ? true : period === 'week' ? diffDays <= 7 : diffDays <= 31;
      const matchType = wasteType === 'all' ? true : d.wasteType === wasteType;
      return matchPeriod && matchType;
    });
  }, [deposits, period, wasteType]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Deposit History
      </Text>

      <SegmentedButtons
        value={period}
        onValueChange={(v) => setPeriod(v as PeriodFilter)}
        buttons={[
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
          { value: 'all', label: 'All Time' }
        ]}
      />

      <View style={styles.filters}>
        {(['all', 'plastic', 'paper', 'metal', 'glass', 'mixed'] as const).map((item) => (
          <Chip key={item} selected={wasteType === item} onPress={() => setWasteType(item)}>
            {item}
          </Chip>
        ))}
      </View>

      <List.Section>
        {filtered.map((d) => (
          <List.Accordion
            key={d.id}
            title={`${new Date(d.timestamp).toLocaleDateString()}  ${d.wasteType}`}
            description={`${d.weight}kg / ${d.points}pt`}
            left={(props) => <List.Icon {...props} icon="recycle" />}
          >
            <List.Item title={`Collection Point ID: ${d.collectionPointId}`} />
            <List.Item title={`Verification: ${d.verified ? 'Verified' : 'Unverified'}`} />
          </List.Accordion>
        ))}
      </List.Section>

      {filtered.length === 0 ? <Text>No records match the selected filters.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30
  },
  title: {
    marginBottom: 10,
    fontWeight: '700'
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  }
});
