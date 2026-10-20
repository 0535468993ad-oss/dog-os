import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius, shadow, typography } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'index', title: 'ראשי', icon: 'home-outline', activeIcon: 'home' },
  { name: 'training', title: 'אימונים', icon: 'school-outline', activeIcon: 'school' },
  { name: 'chat', title: 'יועץ חכם', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { name: 'health', title: 'בריאות', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'profile', title: 'פרופיל', icon: 'paw-outline', activeIcon: 'paw' },
];

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              // Active tab: filled icon on a tinted pill, so state is shown by shape as well as color.
              <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                {/* Decorative: the tab's accessible name comes from its title. */}
                <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size - 2} color={typeof color === 'string' ? color : colors.textSecondary} accessible={false} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.raised,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
  },
  item: {
    paddingTop: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: typography.caption.fontSize,
  },
  iconPill: {
    minWidth: 52,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.primaryMuted,
  },
});
