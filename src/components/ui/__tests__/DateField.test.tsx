// DateField (Dark Luxury): dark field on the dark surface, and the pickers render dark with the
// cyan accent – native iOS sheet and the web input's color-scheme.
import { render, screen, userEvent, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

// Jest resolves '../DateField' to the native file; the lint resolver picks the .web one for both.
// eslint-disable-next-line import/no-duplicates
import { DateField } from '../DateField';
// eslint-disable-next-line import/no-duplicates
import { inputStyle } from '../DateField.web';

// The native picker has no JS implementation under Jest; a View records the props it would get.
jest.mock('@react-native-community/datetimepicker', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => createElement(View, { testID: 'native-picker', ...props }),
    DateTimePickerAndroid: { open: jest.fn() },
  };
});

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

describe('DateField (native)', () => {
  it('shows label, value and error in light-on-dark colors', async () => {
    await render(<DateField label="תאריך" value="2026-10-20" onChange={jest.fn()} error="תאריך לא תקין" />);

    expect(flat(screen.getByText('תאריך').props.style).color).toBe(colors.textSecondary);
    expect(flat(screen.getByRole('alert').props.style).color).toBe(colors.dangerText);
    expect(flat(screen.getByRole('button', { name: /^תאריך:/ }).props.style).backgroundColor).toBe(colors.surfaceAlt);
  });

  it('keeps the chosen date on one line in narrow layouts', async () => {
    await render(<DateField label="תאריך" value="2026-10-20" onChange={jest.fn()} />);

    const button = screen.getByRole('button', { name: /^תאריך:/ });
    expect(within(button).getByText(/2026/).props.numberOfLines).toBe(1);
  });

  it('opens the iOS sheet with a dark, cyan-accented picker', async () => {
    const user = userEvent.setup();
    await render(<DateField label="תאריך" value={null} onChange={jest.fn()} />);

    await user.press(screen.getByRole('button', { name: 'תאריך: לא נבחר' }));

    const picker = screen.getByTestId('native-picker');
    expect(picker.props.themeVariant).toBe('dark');
    expect(picker.props.accentColor).toBe(colors.accentCyan);
  });
});

describe('DateField (web input style)', () => {
  it('asks the browser for its dark date UI and uses the dark palette', () => {
    expect(inputStyle).toMatchObject({
      colorScheme: 'dark',
      accentColor: colors.accentCyan,
      backgroundColor: colors.surfaceAlt,
      color: colors.textPrimary,
    });
  });
});
