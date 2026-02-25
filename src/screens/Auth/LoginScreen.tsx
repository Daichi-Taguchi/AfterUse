import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { validatePhone } from '../../utils/validators';

type Props = NativeStackScreenProps<{ Login: undefined; Register: undefined }, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    try {
      setError(null);
      const result = await signIn(phone, otp);
      if (result.isNewUser) {
        navigation.navigate('Register');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            AfterUse
          </Text>

          <TextInput
            label="Phone Number"
            placeholder="+6281234567890"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button mode="contained" onPress={handleLogin} style={styles.button} loading={loading} disabled={loading}>
            Login
          </Button>
          <Text variant="bodySmall" style={styles.caption}>
            In this MVP, any OTP value is accepted.
          </Text>
          <Text variant="bodySmall" style={styles.caption}>
            Admin demo: +6281111111111
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  title: {
    textAlign: 'center',
    fontWeight: '700'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    marginBottom: 12
  },
  button: {
    marginTop: 8
  },
  caption: {
    marginTop: 10,
    textAlign: 'center'
  },
  error: {
    color: '#E53935',
    marginBottom: 8
  }
});
