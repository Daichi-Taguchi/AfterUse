import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#2E7D32',
  secondary: '#1976D2',
  accent: '#FFA726',
  success: '#43A047',
  warning: '#FB8C00',
  error: '#E53935',
  background: '#F5F5F5',
  text: '#212121',
  subText: '#757575'
};

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.background
  }
};
