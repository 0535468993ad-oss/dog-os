// GlassBarBackground: the tab bar's dark chrome material on iOS/web, an opaque fill on Android and under
// Reduce Transparency, a hairline on top, and nothing a screen reader can land on.
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';

import { barBlurIntensity, colors } from '@/constants/theme';

import { GlassBarBackground } from '../glass/GlassBarBackground';

// Pass BlurView's props through to a host view so the tint and intensity are observable.
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { BlurView: View };
});

function fill() {
  const node = screen.getByTestId('glass-bar-fill', { includeHiddenElements: true });
  return { props: node.props as { tint?: string; intensity?: number }, style: StyleSheet.flatten(node.props.style) as { backgroundColor?: string } };
}

describe('GlassBarBackground', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the dark system chrome material with the bar blur and tinted fill', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
    await render(<GlassBarBackground />);
    const { props, style } = fill();
    expect(Platform.OS).toBe('ios');
    expect(props.tint).toBe('systemChromeMaterialDark');
    expect(props.intensity).toBe(barBlurIntensity);
    expect(style.backgroundColor).toBe(colors.surfaceBar);
  });

  it('renders the opaque surface under Reduce Transparency', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    await render(<GlassBarBackground />);
    const { props, style } = fill();
    expect(props.tint).toBeUndefined();
    expect(style.backgroundColor).toBe(colors.surface);
  });

  it('renders the opaque surface on Android, where blur is experimental', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await render(<GlassBarBackground />);
    expect(fill().style.backgroundColor).toBe(colors.surface);
  });

  it('is decorative: hidden from assistive technology and touch', async () => {
    await render(<GlassBarBackground />);
    expect(screen.queryByTestId('glass-bar-fill')).toBeNull();
  });
});
