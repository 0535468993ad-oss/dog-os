// The iOS HIG tab bar: its options contract, the outline/filled icon state, and an end-to-end render of
// the real tabs layout through Expo Router (labels, roles, selection, and the inset reaching a tab screen).
// On iOS (the Jest platform) React Navigation exposes tab items as buttons with a selected state.
import Ionicons from '@expo/vector-icons/Ionicons';
import { screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';

import TabsLayout from '@/app/(app)/(tabs)/_layout';
import { GlassBarBackground, Screen } from '@/components/ui';
import { colors, spacing, tabBarLabel } from '@/constants/theme';

import { TAB_SCREEN_OPTIONS, TABS, tabOptions } from '../tabBarOptions';

describe('TAB_SCREEN_OPTIONS', () => {
  it('floats a transparent bar over the content', () => {
    expect(TAB_SCREEN_OPTIONS.tabBarStyle).toEqual({ position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 });
    expect(TAB_SCREEN_OPTIONS.headerShown).toBe(false);
  });

  it('draws the glass material behind the bar', () => {
    const background = TAB_SCREEN_OPTIONS.tabBarBackground?.() as ReactElement;
    expect(background.type).toBe(GlassBarBackground);
  });

  it('uses HIG label type and tints that pass contrast on the bar', () => {
    expect(TAB_SCREEN_OPTIONS.tabBarLabelStyle).toBe(tabBarLabel);
    expect(tabBarLabel).toMatchObject({ fontSize: 10 });
    expect(TAB_SCREEN_OPTIONS.tabBarActiveTintColor).toBe(colors.primaryBright);
    expect(TAB_SCREEN_OPTIONS.tabBarInactiveTintColor).toBe(colors.textSecondary);
  });
});

describe('tabOptions', () => {
  const home = TABS[0];
  if (!home) throw new Error('no tabs');

  it.each([
    [true, home.activeIcon],
    [false, home.icon],
  ])('focused %s → %s glyph at the navigator size', (focused, name) => {
    const icon = tabOptions(home).tabBarIcon?.({ focused, color: colors.primaryBright, size: 25 }) as ReactElement<Record<string, unknown>>;
    expect(icon.type).toBe(Ionicons);
    expect(icon.props).toMatchObject({ name, size: 25, color: colors.primaryBright, accessible: false });
  });
});

describe('tabs layout (end to end)', () => {
  const page = (name: string) =>
    function Page() {
      return (
        <Screen>
          <Text>{name}</Text>
        </Screen>
      );
    };

  const routes = {
    '(tabs)/_layout': TabsLayout,
    '(tabs)/index': page('HOME'),
    '(tabs)/training': page('TRAINING'),
    '(tabs)/chat': page('CHAT'),
    '(tabs)/health': page('HEALTH'),
    '(tabs)/profile': page('PROFILE'),
  };

  it('renders every tab as a labelled tab with the home tab selected', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    for (const tab of TABS) expect(screen.getByRole('button', { name: tab.title })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'ראשי' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'בריאות' })).not.toBeSelected();
  });

  it('switches tabs and moves the selection', async () => {
    const user = userEvent.setup();
    await renderRouter(routes, { initialUrl: '/' });
    await user.press(screen.getByRole('button', { name: 'בריאות' }));
    expect(await screen.findByText('HEALTH')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'בריאות' })).toBeSelected();
  });

  it("gives a tab screen the navigator's bar height (the vendored context, not a stray copy)", async () => {
    await renderRouter(routes, { initialUrl: '/' });
    const content = screen.getByTestId('screen-scroll');
    const inset = (content.props.scrollIndicatorInsets as { bottom?: number } | undefined)?.bottom ?? 0;
    expect(inset).toBeGreaterThan(0);
    const padding = (StyleSheet.flatten(content.props.contentContainerStyle) as { paddingBottom?: number }).paddingBottom;
    expect(padding).toBe(spacing.xxl + inset);
  });
});
