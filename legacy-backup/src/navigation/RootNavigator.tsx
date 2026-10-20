import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from '@/constants';
import { useAuthState } from '@/hooks';
import { AuthScreen, DashboardScreen, ProfileScreen, TrainingScreen } from '@/screens';

import type { RootTabParamList, RootTabRouteName } from './types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<RootTabRouteName, { active: IoniconName; inactive: IoniconName }> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Profile: { active: 'paw', inactive: 'paw-outline' },
  Training: { active: 'trophy', inactive: 'trophy-outline' },
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function AppTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            return (
              <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Training" component={TrainingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// The app tabs are mounted only with a session, so signed-out users can't reach them, and signing
// out unmounts the whole container, dropping any navigation state from the previous user.
export function RootNavigator() {
  const auth = useAuthState();

  switch (auth.status) {
    case 'loading':
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    case 'signedOut':
      return <AuthScreen />;
    case 'signedIn':
      // Keyed by user so a different account never inherits the previous user's screen state.
      return <AppTabs key={auth.session.user.id} />;
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
