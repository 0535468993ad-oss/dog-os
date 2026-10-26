// Characterization of DateField's iOS sheet: it opens on the trigger, confirms the picked date as an ISO
// string, and cancel leaves the value alone.
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { DateField } from '../DateField';

jest.mock('@react-native-community/datetimepicker', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => createElement(View, { testID: 'native-picker', ...props }),
    DateTimePickerAndroid: { open: jest.fn() },
  };
});

describe('DateField (iOS sheet)', () => {
  const original = Platform.OS;
  beforeAll(() => {
    Platform.OS = 'ios';
  });
  afterAll(() => {
    Platform.OS = original;
  });

  it('confirms the picked date', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(<DateField label="תאריך לידה" value="2026-01-15" onChange={onChange} />);
    await user.press(screen.getByRole('button', { name: /^תאריך לידה: / }));
    expect(screen.getByRole('header', { name: 'תאריך לידה' })).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('native-picker'), 'change', {}, new Date(2026, 9, 1));
    await user.press(screen.getByRole('button', { name: 'אישור' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-01');
  });

  it('cancels without changing the value', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(<DateField label="תאריך לידה" value="2026-01-15" onChange={onChange} />);
    await user.press(screen.getByRole('button', { name: /^תאריך לידה: / }));
    await fireEvent(screen.getByTestId('native-picker'), 'change', {}, new Date(2026, 9, 1));
    await user.press(screen.getByRole('button', { name: 'ביטול' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
