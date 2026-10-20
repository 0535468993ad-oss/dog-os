import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { MOTION, PressableScale } from '../motion';
import { Card } from '../ui/Card';
import { Screen } from '../ui/Screen';

// The published declaration is the web build's no-op stub, `(): void`. Under Jest the native
// implementation (jestUtils/index.native.ts) runs, which takes the rendered element and returns its style.
const getAnimatedStyle = Reanimated.getAnimatedStyle as unknown as (element: { props: Record<string, unknown> }) => {
  transform?: { scale?: number }[];
};

function scaleOf(element: { props: Record<string, unknown> }): number {
  const transform = getAnimatedStyle(element).transform ?? [];
  return transform.find((t) => t.scale !== undefined)?.scale ?? 1;
}

describe('PressableScale', () => {
  it('passes accessibility props straight through', async () => {
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="פתיחת היומן" accessibilityState={{ disabled: true }} disabled onPress={() => undefined}>
        <Text>יומן</Text>
      </PressableScale>,
    );
    const button = screen.getByRole('button', { name: 'פתיחת היומן' });
    expect(button).toBeDisabled();
  });

  it('forwards press handlers', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="משימה" onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>משימה</Text>
      </PressableScale>,
    );

    await user.press(screen.getByRole('button', { name: 'משימה' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('springs down while pressed and back up on release', async () => {
    jest.useFakeTimers();
    try {
      await render(
        <PressableScale accessibilityRole="button" accessibilityLabel="כרטיס" onPress={() => undefined}>
          <Text>כרטיס</Text>
        </PressableScale>,
      );
      const button = screen.getByRole('button', { name: 'כרטיס' });
      expect(scaleOf(button)).toBe(1);

      await fireEvent(button, 'pressIn');
      await act(() => jest.advanceTimersByTime(1000));
      expect(scaleOf(button)).toBeCloseTo(MOTION.pressScale, 2);

      await fireEvent(button, 'pressOut');
      await act(() => jest.advanceTimersByTime(1000));
      expect(scaleOf(button)).toBeCloseTo(1, 2);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('Card', () => {
  it('is a labelled button when pressable', async () => {
    await render(
      <Card onPress={() => undefined} accessibilityLabel="כלבת, באיחור. עריכה">
        <Text>כלבת</Text>
      </Card>,
    );
    expect(screen.getByRole('button', { name: 'כלבת, באיחור. עריכה' })).toBeOnTheScreen();
  });

  it('groups a static card into one element when it has a label', async () => {
    await render(
      <Card accessibilityLabel="3 ימי רצף אימונים">
        <Text>3</Text>
        <Text>ימי רצף</Text>
      </Card>,
    );
    expect(screen.getByLabelText('3 ימי רצף אימונים')).toBeOnTheScreen();
  });

  it('leaves an unlabelled static card transparent to screen readers', async () => {
    await render(
      <Card>
        <Text>תוכן</Text>
      </Card>,
    );
    expect(screen.getByText('תוכן')).toBeOnTheScreen();
    expect(screen.queryByLabelText('תוכן')).not.toBeOnTheScreen();
  });
});

describe('Screen with a parallax header', () => {
  it('renders the header with its role, above the content', async () => {
    await render(
      <Screen
        parallaxHeader={
          <Text accessibilityRole="header">בריאות ותזונה</Text>
        }
      >
        <Text>תוכן</Text>
      </Screen>,
    );
    expect(screen.getByRole('header', { name: 'בריאות ותזונה' })).toBeOnTheScreen();
    expect(screen.getByText('תוכן')).toBeOnTheScreen();
  });
});
