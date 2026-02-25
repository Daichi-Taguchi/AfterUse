import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useDeposits } from '../../hooks/useDeposits';

type RankingTab = 'organization' | 'global';

export function RankingScreen() {
  const { user } = useAuth();
  const { organizationRanking, globalRanking } = useDeposits();
  const [tab, setTab] = useState<RankingTab>('organization');

  const ranking = tab === 'organization' ? organizationRanking : globalRanking;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Ranking
      </Text>

      <SegmentedButtons
        value={tab}
        onValueChange={(value) => setTab(value as RankingTab)}
        buttons={[
          { value: 'organization', label: 'Organization' },
          { value: 'global', label: 'Global' }
        ]}
      />

      <List.Section>
        {ranking.map((item) => (
          <List.Item
            key={`${tab}_${item.userId}`}
            title={`#${item.rank}: ${item.userName}`}
            description={`${item.totalPoints}pt / ${item.totalWeight}kg`}
            style={item.userId === user?.id ? styles.selfRow : undefined}
            left={(props) => <List.Icon {...props} icon={item.rank <= 3 ? 'trophy' : 'account'} />}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30
  },
  title: {
    marginBottom: 12,
    fontWeight: '700'
  },
  selfRow: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8
  }
});
