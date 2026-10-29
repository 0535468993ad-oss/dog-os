// Legal links: underlined inside sentences (WCAG 1.4.1), quiet metadata in the footer row.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, fonts, MIN_TOUCH_AREA, typography } from '@/constants/theme';

import { BusinessFooter } from '../components/BusinessFooter';
import { LegalLink } from '../components/LegalLink';

// Link needs a navigator under the real router; a Text that keeps the props stands in.
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Link: ({ href: _href, ...props }: Record<string, unknown>) => createElement(Text, props) };
});

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe('LegalLink', () => {
  it('underlines inline links in the brand color', async () => {
    await render(<LegalLink doc="terms" label="תקנון" />);
    expect(flat(screen.getByRole('link', { name: 'תקנון' }))).toMatchObject({ textDecorationLine: 'underline', color: colors.primary });
  });

  it('renders meta links muted and without an underline, still padded to a 44pt target', async () => {
    await render(<LegalLink doc="terms" label="תקנון" tone="meta" />);
    const style = flat(screen.getByRole('link', { name: 'תקנון' }));
    expect(style).toMatchObject({ textDecorationLine: 'none', color: colors.textSecondary });
    expect(Number(style.lineHeight) + 2 * Number(style.paddingVertical)).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });
});

describe('BusinessFooter', () => {
  it('uses meta links only', async () => {
    await render(<BusinessFooter />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(flat(link).textDecorationLine).toBe('none');
  });

  // Without an underline, weight is what tells a link from the plain details beside it (WCAG 1.4.1).
  it('sets links apart from the footer details by weight, not color alone', async () => {
    await render(<BusinessFooter />);
    expect(typography.caption.fontFamily).not.toBe(fonts.semibold);
    for (const link of screen.getAllByRole('link')) expect(flat(link).fontFamily).toBe(fonts.semibold);
  });
});
