import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useDeposits } from '../../hooks/useDeposits';
import { calculateCO2Reduction, calculateMonthlyStats } from '../../utils/calculations';
import { StatCard } from '../../components/StatCard';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { deposits } = useDeposits();

  const monthly = useMemo(() => calculateMonthlyStats(deposits), [deposits]);

  const chartData = useMemo(() => {
    const labels = ['W1', 'W2', 'W3', 'W4'];
    const values = [0, 0, 0, 0];

    deposits.forEach((d) => {
      const day = new Date(d.timestamp).getDate();
      const index = Math.min(3, Math.floor((day - 1) / 7));
      values[index] += d.weight;
    });

    return {
      labels,
      datasets: [{ data: values.map((v) => Number(v.toFixed(1))) }]
    };
  }, [deposits]);

  const latest = deposits.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text size={54} label={user?.name?.slice(0, 1) || 'U'} />
          <View>
            <Text variant="titleLarge">{user?.name}</Text>
            <Text variant="bodyMedium">Total Points: {user?.totalPoints ?? 0} pt</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.statRow}>
        <StatCard title="Monthly Deposits" value={`${monthly.depositCount}`} icon="🗂" />
        <StatCard title="Monthly Weight" value={`${monthly.totalWeight}kg`} icon="⚖" />
      </View>
      <View style={styles.statRow}>
        <StatCard title="CO2 Reduced" value={`${monthly.totalCO2Reduction}kg`} icon="🌍" />
        <StatCard title="Monthly Points" value={`${monthly.totalPoints}pt`} icon="⭐" />
      </View>

      <Card style={styles.chartCard}>
        <Card.Title title="Weekly Deposit Trend" />
        <Card.Content>
          <BarChart
            data={chartData}
            width={320}
            height={220}
            fromZero
            yAxisLabel=""
            yAxisSuffix="kg"
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: () => '#2E7D32',
              labelColor: () => '#212121'
            }}
          />
        </Card.Content>
      </Card>

      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="plus-circle"
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Deposit')}
        >
          Record Deposit
        </Button>
        <Button
          mode="outlined"
          icon="map-marker"
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Deposit')}
        >
          Find Collection Point
        </Button>
      </View>

      <Card>
        <Card.Title title="Recent Activity" />
        <Card.Content>
          {latest.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <Text>
                {new Date(item.timestamp).toLocaleDateString()} / {item.wasteType} / {item.weight}kg
              </Text>
              <Text>{item.points}pt</Text>
            </View>
          ))}
          {latest.length === 0 ? <Text>No history yet.</Text> : null}
        </Card.Content>
      </Card>

      <Card style={styles.impactCard}>
        <Card.Title title="Total Environmental Impact" />
        <Card.Content>
          <Text>
            Estimated CO2 reduction:{' '}
            {deposits.reduce((sum, d) => sum + calculateCO2Reduction(d.wasteType, d.weight), 0).toFixed(2)} kg
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30
  },
  headerCard: {
    marginBottom: 14
  },
  headerContent: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center'
  },
  statRow: {
    flexDirection: 'row',
    gap: 10
  },
  chartCard: {
    marginTop: 12
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14
  },
  actionBtn: {
    flex: 1
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  impactCard: {
    marginTop: 12
  }
});
