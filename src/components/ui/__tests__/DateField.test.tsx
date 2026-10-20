// DateField (Dark Luxury): the field is its own dark container, and the pickers render dark with the
// cyan accent – native iOS sheet and the web input's color-scheme.
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { darkColors } from '@/constants/theme';

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

    expect(flat(screen.getByText('תאריך').props.style).color).toBe(darkColors.textSecondary);
    expect(flat(screen.getByRole('alert').props.style).color).toBe(darkColors.danger);
    // The nearest ancestor with a fill is the field's own dark panel.
    let node = screen.getByText('תאריך').parent;
    while (node && !flat(node.props.style).backgroundColor) node = node.parent;
    expect(node && flat(node.props.style).backgroundColor).toBe(darkColors.background);
  });

  it('opens the iOS sheet with a dark, cyan-accented picker', async () => {
    const user = userEvent.setup();
    await render(<DateField label="תאריך" value={null} onChange={jest.fn()} />);

    await user.press(screen.getByRole('button', { name: 'תאריך: לא נבחר' }));

    const picker = screen.getByTestId('native-picker');
    expect(picker.props.themeVariant).toBe('dark');
    expect(picker.props.accentColor).toBe(darkColors.cyan);
  });
});

describe('DateField (web input style)', () => {
  it('asks the browser for its dark date UI and uses the dark palette', () => {
    expect(inputStyle).toMatchObject({
      colorScheme: 'dark',
      accentColor: darkColors.cyan,
      backgroundColor: darkColors.surfaceSolid,
      color: darkColors.textPrimary,
    });
  });
});
