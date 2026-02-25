import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { BADGES } from '../../constants/badges';
import { BadgeIcon } from '../../components/BadgeIcon';
import { useAuth } from '../../hooks/useAuth';
import { useDeposits } from '../../hooks/useDeposits';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { deposits } = useDeposits();
  const showComingSoon = () => Alert.alert('Coming Soon', 'This feature is not implemented yet.');

  if (!user) {
    return null;
  }

  const joinedDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text size={72} label={user.name.slice(0, 1)} />
          <View>
            <Text variant="titleLarge">{user.name}</Text>
            <Text>{user.phone}</Text>
            <Text>{user.role === 'admin' ? 'Administrator' : 'User'}</Text>
            <Text>{user.organization}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Earned Badges" />
        <Card.Content style={styles.badgeGrid}>
          {BADGES.map((badge) => (
            <BadgeIcon
              key={badge.id}
              name={badge.name}
              icon={badge.icon}
              earned={user.badges.includes(badge.id)}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Statistics" />
        <Card.Content>
          <Text>Total deposits: {deposits.length}</Text>
          <Text>Total weight: {user.totalWeight}kg</Text>
          <Text>Days active: {joinedDays}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Settings" />
        <Card.Content>
          <Button mode="outlined" icon="bell" onPress={showComingSoon}>
            Notification Settings
          </Button>
          <View style={{ height: 8 }} />
          <Button mode="outlined" icon="translate" onPress={showComingSoon}>
            Language Settings
          </Button>
          <View style={{ height: 8 }} />
          <Button mode="contained" icon="logout" onPress={signOut}>
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center'
  },
  section: {
    marginTop: 12
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  }
});
