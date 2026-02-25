import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { DashboardScreen } from '../screens/Home/DashboardScreen';
import { CreateDepositScreen } from '../screens/Deposit/CreateDepositScreen';
import { DepositHistoryScreen } from '../screens/Deposit/DepositHistoryScreen';
import { RankingScreen } from '../screens/Ranking/RankingScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type AppTabParamList = {
  Home: undefined;
  Deposit: undefined;
  History: undefined;
  Ranking: undefined;
  Profile: undefined;
};

type AdminTabParamList = {
  AdminHome: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Profile' }} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Deposit" component={CreateDepositScreen} options={{ title: 'New Deposit' }} />
      <Tab.Screen name="History" component={DepositHistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AdminTabNavigator() {
  return (
    <AdminTab.Navigator screenOptions={{ headerShown: false }}>
      <AdminTab.Screen name="AdminHome" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      <AdminTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </AdminTab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <NavigationContainer>
      {isAuthenticated && user?.name ? (isAdmin ? <AdminTabNavigator /> : <TabNavigator />) : <AuthNavigator />}
    </NavigationContainer>
  );
}
