import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { validateProfile } from '../../utils/validators';

const ORGANIZATION_OPTIONS = ['ITB', 'SIT', 'CamEd'] as const;

export function RegisterScreen() {
  const { completeProfile } = useAuth();
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const profileError = validateProfile(name, organization);
    if (profileError) {
      setError(profileError);
      return;
    }

    try {
      setError(null);
      await completeProfile({ name, organization, email });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Create Profile
          </Text>

          <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} />
          <Text variant="bodyMedium" style={styles.fieldLabel}>
            Affiliation / Organization
          </Text>
          <View style={styles.organizationChips}>
            {ORGANIZATION_OPTIONS.map((option) => (
              <Chip
                key={option}
                selected={organization === option}
                onPress={() => setOrganization(option)}
                style={styles.orgChip}
              >
                {option}
              </Chip>
            ))}
          </View>
          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button mode="contained" onPress={handleSubmit}>
            Save and Start
          </Button>
        </Card.Content>
      </Card>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  title: {
    fontWeight: '700',
    marginBottom: 16
  },
  input: {
    marginBottom: 12
  },
  fieldLabel: {
    marginBottom: 8
  },
  organizationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  orgChip: {
    marginBottom: 4
  },
  error: {
    color: '#E53935',
    marginBottom: 8
  }
});
