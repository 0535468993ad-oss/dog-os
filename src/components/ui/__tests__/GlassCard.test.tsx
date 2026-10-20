// GlassCard: blurred glass where the platform supports it, opaque fill on Android and under Reduce
// Transparency, with the Dark Luxury tokens either way.
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

import { GlassCard } from '../glass/GlassCard';
import { pickGlassMode } from '../glass/glassMode';

function backgroundOf(testID: string) {
  return (StyleSheet.flatten(screen.getByTestId(testID).props.style) as { backgroundColor?: string }).backgroundColor;
}

describe('pickGlassMode', () => {
  it.each([
    ['ios', false, 'blur'],
    ['web', false, 'blur'],
    ['android', false, 'solid'],
    ['ios', true, 'solid'],
  ] as const)('%s, reduce transparency %s → %s', (platform, reduce, mode) => {
    expect(pickGlassMode(platform, reduce)).toBe(mode);
  });
});

describe('GlassCard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders its children on the translucent glass fill', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
    await render(
      <GlassCard testID="card">
        <Text>תוכן</Text>
      </GlassCard>,
    );
    expect(screen.getByText('תוכן')).toBeTruthy();
    expect(backgroundOf('card')).toBe(Platform.OS === 'android' ? colors.surface : colors.surfaceGlass);
  });

  it('switches to the opaque fill when Reduce Transparency is on (iOS)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    await render(
      <GlassCard testID="card">
        <Text>תוכן</Text>
      </GlassCard>,
    );
    const expected = Platform.OS === 'ios' || Platform.OS === 'android' ? colors.surface : colors.surfaceGlass;
    expect(backgroundOf('card')).toBe(expected);
  });

  it('groups its content for screen readers when labelled', async () => {
    await render(
      <GlassCard testID="card" accessibilityLabel="3 ימי רצף">
        <Text>3</Text>
      </GlassCard>,
    );
    expect(screen.getByLabelText('3 ימי רצף')).toBeTruthy();
  });
});
