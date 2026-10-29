import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';

import { GlassBarBackground } from '@/components/ui';
import { colors, tabBarLabel } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface TabSpec {
  readonly name: string;
  readonly title: string;
  readonly icon: IconName;
  readonly activeIcon: IconName;
}

/** The main tabs, in display order (the first is the start of the RTL bar). */
export const TABS: readonly TabSpec[] = [
  { name: 'index', title: 'ראשי', icon: 'home-outline', activeIcon: 'home' },
  { name: 'training', title: 'אימונים', icon: 'flame-outline', activeIcon: 'flame' },
  { name: 'chat', title: 'יועץ חכם', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { name: 'health', title: 'בריאות', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'profile', title: 'פרופיל', icon: 'paw-outline', activeIcon: 'paw' },
];

/**
 * iOS HIG tab bar: a floating translucent material bar that content scrolls under. `Screen` adds the
 * matching inset (useTabBarInset), so nothing ends up hidden behind it.
 */
export const TAB_SCREEN_OPTIONS: BottomTabNavigationOptions = {
  headerShown: false,
  // primaryBright, not primary: it stays at 4.5:1 over bright content showing through the bar.
  tabBarActiveTintColor: colors.primaryBright,
  tabBarInactiveTintColor: colors.tabInactive,
  tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
  tabBarBackground: () => <GlassBarBackground />,
  tabBarLabelStyle: tabBarLabel,
};

/** Per-tab options: title, accessible name and an outline/filled icon pair. */
export function tabOptions(tab: TabSpec): BottomTabNavigationOptions {
  return {
    title: tab.title,
    tabBarAccessibilityLabel: tab.title,
    // HIG: the selected tab shows the filled glyph, so state reads by shape as well as color.
    tabBarIcon: ({ focused, color, size }) => (
      // Decorative: the tab's accessible name comes from its title.
      <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size} color={typeof color === 'string' ? color : colors.tabInactive} accessible={false} />
    ),
  };
}
