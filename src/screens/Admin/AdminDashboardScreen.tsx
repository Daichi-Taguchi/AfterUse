import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { StatCard } from '../../components/StatCard';
import { listUsers } from '../../services/auth.service';
import { listAllDeposits, listCollectionPoints } from '../../services/deposit.service';
import { CollectionPoint, Deposit, User, WasteType } from '../../types';

type DashboardData = {
  users: User[];
  deposits: Deposit[];
  collectionPoints: CollectionPoint[];
};

const WASTE_TYPES: WasteType[] = ['plastic', 'paper', 'metal', 'glass', 'mixed'];

export function AdminDashboardScreen() {
  const [data, setData] = useState<DashboardData>({ users: [], deposits: [], collectionPoints: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [selectedCollectionPointId, setSelectedCollectionPointId] = useState<string>('all');

  const load = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      setError(null);
      const [users, deposits, collectionPoints] = await Promise.all([
        listUsers(),
        listAllDeposits(),
        listCollectionPoints()
      ]);
      setData({ users, deposits, collectionPoints });
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const viewModel = useMemo(() => {
    const usersById = new Map(data.users.map((u) => [u.id, u]));
    const filteredDeposits =
      selectedCollectionPointId === 'all'
        ? data.deposits
        : data.deposits.filter((d) => d.collectionPointId === selectedCollectionPointId);
    const totalUsers = data.users.filter((u) => u.role === 'user').length;
    const adminUsers = data.users.filter((u) => u.role === 'admin').length;
    const totalDeposits = filteredDeposits.length;
    const pendingDeposits = filteredDeposits.filter((d) => !d.verified).length;
    const verifiedDeposits = totalDeposits - pendingDeposits;
    const totalWeight = filteredDeposits.reduce((sum, d) => sum + d.weight, 0);
    const totalPoints = filteredDeposits.reduce((sum, d) => sum + d.points, 0);
    const last24hCount = filteredDeposits.filter(
      (d) => Date.now() - new Date(d.timestamp).getTime() <= 1000 * 60 * 60 * 24
    ).length;

    const wasteTotals = WASTE_TYPES.map((type) => ({
      type,
      weight: filteredDeposits.filter((d) => d.wasteType === type).reduce((sum, d) => sum + d.weight, 0)
    }));
    const maxWasteWeight = Math.max(1, ...wasteTotals.map((x) => x.weight));

    const pointStats = data.collectionPoints.map((point) => {
      const deposits = filteredDeposits.filter((d) => d.collectionPointId === point.id);
      const weight = deposits.reduce((sum, d) => sum + d.weight, 0);
      const pending = deposits.filter((d) => !d.verified).length;
      return { point, count: deposits.length, weight, pending };
    });

    const organizationTotalsMap = new Map<string, number>();
    filteredDeposits.forEach((deposit) => {
      const organization = usersById.get(deposit.userId)?.organization || 'Unknown';
      organizationTotalsMap.set(organization, (organizationTotalsMap.get(organization) ?? 0) + 1);
    });
    const organizationTotals = Array.from(organizationTotalsMap.entries())
      .map(([organization, count]) => ({ organization, count }))
      .sort((a, b) => b.count - a.count);

    const activeOrganizations = organizationTotals.length;
    const activePoints = pointStats.filter((item) => item.count > 0).length;
    const communityParticipationRate = totalUsers === 0 ? 0 : Math.round((Math.min(totalUsers, totalDeposits) / totalUsers) * 100);
    const avgWeightPerDeposit = totalDeposits === 0 ? 0 : totalWeight / totalDeposits;
    const pendingRiskLevel =
      pendingDeposits === 0 ? 'Low' : pendingDeposits <= 3 ? 'Medium' : 'High';

    const recentDeposits = filteredDeposits.slice(0, 8).map((deposit) => ({
      ...deposit,
      userName: usersById.get(deposit.userId)?.name || 'Unknown user',
      collectionPointName:
        data.collectionPoints.find((p) => p.id === deposit.collectionPointId)?.name || deposit.collectionPointId
    }));

    return {
      totalUsers,
      adminUsers,
      totalDeposits,
      pendingDeposits,
      verifiedDeposits,
      verificationRate: totalDeposits === 0 ? 0 : Math.round((verifiedDeposits / totalDeposits) * 100),
      totalWeight,
      totalPoints,
      last24hCount,
      activeOrganizations,
      activePoints,
      communityParticipationRate,
      avgWeightPerDeposit,
      pendingRiskLevel,
      selectedCollectionPointId,
      selectedCollectionPointName:
        selectedCollectionPointId === 'all'
          ? 'All collection points'
          : data.collectionPoints.find((p) => p.id === selectedCollectionPointId)?.name || selectedCollectionPointId,
      wasteTotals,
      maxWasteWeight,
      pointStats,
      organizationTotals,
      recentDeposits
    };
  }, [data, selectedCollectionPointId]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />}
    >
      <Card>
        <Card.Content style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text variant="headlineSmall">ESG Operations Dashboard</Text>
            <Text variant="bodyMedium">AfterUse Sustainability Reporting View (MVP / mock data)</Text>
          </View>
          <Button mode="outlined" icon="refresh" onPress={() => load('refresh')} disabled={refreshing}>
            Refresh
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Reporting Profile / Profil Pelaporan" />
        <Card.Content>
          <View style={styles.simpleRow}>
            <Text>Reporting period</Text>
            <Text>{new Date().getFullYear()} YTD</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Coverage boundary</Text>
            <Text>Collection points (MVP)</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Framework style</Text>
            <Text>Indonesia ESG-like (display only)</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Collection point filter</Text>
            <Text>{viewModel.selectedCollectionPointName}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Last refresh</Text>
            <Text>{lastUpdatedAt ? lastUpdatedAt.toLocaleString() : '-'}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Filter: Collection Point" />
        <Card.Content>
          <View style={styles.chipRow}>
            <Chip
              selected={selectedCollectionPointId === 'all'}
              onPress={() => setSelectedCollectionPointId('all')}
            >
              All
            </Chip>
            {data.collectionPoints.map((point) => (
              <Chip
                key={point.id}
                selected={selectedCollectionPointId === point.id}
                onPress={() => setSelectedCollectionPointId(point.id)}
              >
                {point.name}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {error ? (
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : null}

      <View style={styles.statRow}>
        <StatCard title="Users" value={`${viewModel.totalUsers}`} icon="👥" />
        <StatCard title="Admins" value={`${viewModel.adminUsers}`} icon="🛡️" />
      </View>
      <View style={styles.statRow}>
        <StatCard title="Deposits" value={`${viewModel.totalDeposits}`} icon="🧾" />
        <StatCard title="Pending Verify" value={`${viewModel.pendingDeposits}`} icon="⏳" />
      </View>
      <View style={styles.statRow}>
        <StatCard title="Total Weight" value={`${viewModel.totalWeight.toFixed(1)}kg`} icon="⚖️" />
        <StatCard title="Total Points" value={`${viewModel.totalPoints}pt`} icon="⭐" />
      </View>

      <Card style={styles.section}>
        <Card.Title title="Executive Summary / Ikhtisar" />
        <Card.Content>
          <View style={styles.chipRow}>
            <Chip compact>Material topic: Waste management</Chip>
            <Chip compact>Community participation</Chip>
            <Chip compact>Data governance</Chip>
          </View>
          <Text>Verified rate: {viewModel.verificationRate}%</Text>
          <Text>Deposits in last 24h: {viewModel.last24hCount}</Text>
          <Text>Average weight per deposit: {viewModel.avgWeightPerDeposit.toFixed(2)}kg</Text>
          <Text>Initial loading: {loading ? 'Loading...' : 'Completed'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="E. Environmental Performance" />
        <Card.Content>
          <View style={styles.simpleRow}>
            <Text>Total recovered waste</Text>
            <Text>{viewModel.totalWeight.toFixed(1)}kg</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Verified records</Text>
            <Text>{viewModel.verifiedDeposits}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Pending verification</Text>
            <Text>{viewModel.pendingDeposits}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="E1. Waste Mix by Type (weight)" />
        <Card.Content>
          {viewModel.wasteTotals.map((item) => (
            <View key={item.type} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>{item.type}</Text>
                <Text>{item.weight.toFixed(1)}kg</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.round((item.weight / viewModel.maxWasteWeight) * 100)}%`
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="E2. Collection Point Performance" />
        <Card.Content>
          {viewModel.pointStats.map((item, index) => (
            <View key={item.point.id}>
              <View style={styles.pointRow}>
                <View style={styles.pointInfo}>
                  <Text variant="titleSmall">{item.point.name}</Text>
                  <Text variant="bodySmall">
                    {item.count} deposits / {item.weight.toFixed(1)}kg
                  </Text>
                </View>
                <Chip compact mode={item.pending > 0 ? 'outlined' : 'flat'}>
                  Pending {item.pending}
                </Chip>
              </View>
              {index < viewModel.pointStats.length - 1 ? <Divider style={styles.rowDivider} /> : null}
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="S. Social Impact & Community Engagement" />
        <Card.Content>
          <View style={styles.simpleRow}>
            <Text>Registered participants</Text>
            <Text>{viewModel.totalUsers}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Active organizations</Text>
            <Text>{viewModel.activeOrganizations}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Active collection points</Text>
            <Text>{viewModel.activePoints}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Participation indicator</Text>
            <Text>{viewModel.communityParticipationRate}%</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="S1. Organization Activity (deposit count)" />
        <Card.Content>
          {viewModel.organizationTotals.length === 0 ? (
            <Text>No deposit records yet.</Text>
          ) : (
            viewModel.organizationTotals.slice(0, 5).map((item, index) => (
              <View key={`${item.organization}-${index}`} style={styles.simpleRow}>
                <Text>{item.organization}</Text>
                <Text>{item.count}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="G. Governance & Data Integrity" />
        <Card.Content>
          <View style={styles.simpleRow}>
            <Text>Admin accounts</Text>
            <Text>{viewModel.adminUsers}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Verification rate</Text>
            <Text>{viewModel.verificationRate}%</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Pending verification risk</Text>
            <Text>{viewModel.pendingRiskLevel}</Text>
          </View>
          <View style={styles.simpleRow}>
            <Text>Data refresh status</Text>
            <Text>{error ? 'Attention required' : 'Normal'}</Text>
          </View>

          <Divider style={styles.rowDivider} />

          <Text variant="titleSmall" style={styles.subheading}>
            Governance checklist (display)
          </Text>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Data ownership assigned</Text>
            <Chip compact mode="flat">
              Yes
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Verification workflow documented</Text>
            <Chip compact mode="outlined">
              Partial
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>External assurance</Text>
            <Chip compact mode="outlined">
              Not yet
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Community feedback channel</Text>
            <Chip compact mode="flat">
              Available
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Disclosure Snapshot (ESG-style)" />
        <Card.Content>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Material topics identified</Text>
            <Chip compact mode="flat">
              Completed
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Performance metrics available</Text>
            <Chip compact mode="flat">
              Completed
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Target vs actual tracking</Text>
            <Chip compact mode="outlined">
              Basic
            </Chip>
          </View>
          <View style={styles.disclosureRow}>
            <Text style={styles.disclosureLabel}>Methodology disclosure</Text>
            <Chip compact mode="outlined">
              Draft
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Recent Operational Records" />
        <Card.Content>
          {viewModel.recentDeposits.length === 0 ? (
            <Text>No deposits yet.</Text>
          ) : (
            viewModel.recentDeposits.map((item) => (
              <View key={item.id} style={styles.depositRow}>
                <View style={styles.depositMeta}>
                  <Text variant="titleSmall">{item.userName}</Text>
                  <Text variant="bodySmall">
                    {item.collectionPointName} / {item.wasteType} / {item.weight}kg
                  </Text>
                  <Text variant="bodySmall">{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
                <View style={styles.depositStatus}>
                  <Chip compact mode={item.verified ? 'flat' : 'outlined'}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </Chip>
                  <Text>{item.points}pt</Text>
                </View>
              </View>
            ))
          )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  headerTextWrap: {
    flex: 1
  },
  section: {
    marginTop: 12
  },
  statRow: {
    flexDirection: 'row',
    gap: 10
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  errorText: {
    color: '#E53935'
  },
  barRow: {
    marginBottom: 12
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  barLabel: {
    textTransform: 'capitalize'
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 999,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 999,
    minWidth: 4
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  pointInfo: {
    flex: 1
  },
  rowDivider: {
    marginVertical: 10
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8
  },
  subheading: {
    marginBottom: 8
  },
  disclosureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  disclosureLabel: {
    flex: 1
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12
  },
  depositMeta: {
    flex: 1
  },
  depositStatus: {
    alignItems: 'flex-end',
    gap: 6
  }
});
