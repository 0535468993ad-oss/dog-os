// Screen under the floating tab bar: scrolling content flows beneath the bar with matching end padding,
// fixed layouts and footers are lifted above it, and screens outside the tabs are untouched.
import { render, screen } from '@testing-library/react-native';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import type { ReactElement } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';

import { spacing } from '@/constants/theme';

import { Screen } from '../Screen';

const BAR = 83;
const inTabs = (ui: ReactElement) => <BottomTabBarHeightContext.Provider value={BAR}>{ui}</BottomTabBarHeightContext.Provider>;

const paddingBottom = (style: unknown) => (StyleSheet.flatten(style as never) as { paddingBottom?: number } | undefined)?.paddingBottom;
const wrapper = () => screen.getByTestId('screen-bar-inset');
const scrollView = () => screen.getByTestId('screen-scroll');

describe('Screen tab bar inset', () => {
  it('pads scrolling content by the bar height so the last item scrolls clear of it', async () => {
    await render(inTabs(<Screen><Text>תוכן</Text></Screen>));
    expect(paddingBottom(scrollView().props.contentContainerStyle)).toBe(spacing.xxl + BAR);
    expect(scrollView().props.scrollIndicatorInsets).toEqual({ bottom: BAR });
    // Content flows under the bar: the frame itself is not lifted.
    expect(paddingBottom(wrapper().props.style)).toBeUndefined();
  });

  it('lifts a fixed layout and its footer above the bar, leaving the list without an inset of its own', async () => {
    await render(
      inTabs(
        <Screen scroll={false} footer={<Text>COMPOSER</Text>}>
          <FlatList testID="list" data={['א']} renderItem={({ item }) => <Text>{item}</Text>} />
        </Screen>,
      ),
    );
    expect(paddingBottom(wrapper().props.style)).toBe(BAR);
    expect(screen.queryByTestId('screen-scroll')).toBeNull();
    expect(paddingBottom(screen.getByTestId('list').props.contentContainerStyle)).toBeUndefined();

    // The footer is laid out after the flex body in the same column, not over the list.
    const column = wrapper().children[0];
    if (!column || typeof column === 'string') throw new Error('missing keyboard-avoiding column');
    const [body, footer] = column.children;
    if (!body || typeof body === 'string') throw new Error('missing body');
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({ flex: 1 });
    expect(screen.getByText('COMPOSER')).toBeOnTheScreen();
    expect(footer).toBeDefined();
  });

  it('lifts a scrolling screen that has a footer instead of padding its content', async () => {
    await render(inTabs(<Screen footer={<Text>FOOTER</Text>}><Text>תוכן</Text></Screen>));
    expect(paddingBottom(wrapper().props.style)).toBe(BAR);
    expect(paddingBottom(scrollView().props.contentContainerStyle)).toBe(spacing.xxl);
  });

  it('leaves screens outside the tabs exactly as before', async () => {
    await render(<Screen><Text>תוכן</Text></Screen>);
    expect(paddingBottom(scrollView().props.contentContainerStyle)).toBe(spacing.xxl);
    expect(scrollView().props.scrollIndicatorInsets).toBeUndefined();
    expect(paddingBottom(wrapper().props.style)).toBeUndefined();
  });
});
