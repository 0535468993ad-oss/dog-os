// The emergency kitchen end to end: lookup verdicts, pantry warnings and the weight-based recipe.
import { render, screen, userEvent } from '@testing-library/react-native';

import { EmergencyKitchenScreen } from '../EmergencyKitchenScreen';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('@/features/dogs/hooks', () => ({ useActiveDog: () => ({ activeDog: { name: 'רקס', weight_kg: 10 } }) }));

describe('EmergencyKitchenScreen', () => {
  it('flags a toxic food typed into the lookup', async () => {
    const user = userEvent.setup();
    await render(<EmergencyKitchenScreen />);

    await user.type(screen.getByLabelText('מה הכלב יכול לאכול?'), 'עוגת שוקולד');

    expect(screen.getByRole('alert', { name: /שוקולד: רעיל – לא לתת/ })).toBeTruthy();
  });

  it('builds the meal from the selected pantry, sized for the dog in the profile', async () => {
    const user = userEvent.setup();
    await render(<EmergencyKitchenScreen />);

    expect(screen.getByDisplayValue('10')).toBeTruthy();
    await user.press(screen.getByRole('checkbox', { name: 'אורז לבן' }));
    await user.press(screen.getByRole('checkbox', { name: 'חזה עוף' }));

    expect(screen.getByLabelText('אורז לבן: 48 גרם')).toBeTruthy();
    expect(screen.getByLabelText('חזה עוף: 24 גרם')).toBeTruthy();
    expect(screen.getByLabelText('סך הכול לארוחה: 72 גרם')).toBeTruthy();
  });

  it('warns about a toxic pantry item and keeps it out of the meal', async () => {
    const user = userEvent.setup();
    await render(<EmergencyKitchenScreen />);

    await user.press(screen.getByRole('checkbox', { name: 'אורז לבן' }));
    await user.press(screen.getByRole('checkbox', { name: 'בצל' }));

    expect(screen.getByRole('alert', { name: /בצל: רעיל – לא לתת/ })).toBeTruthy();
    expect(screen.getByText(/חסר חלבון רזה/)).toBeTruthy();
  });

  it('recalculates for a typed weight and rejects one out of range', async () => {
    const user = userEvent.setup();
    await render(<EmergencyKitchenScreen />);
    await user.press(screen.getByRole('checkbox', { name: 'אורז לבן' }));
    await user.press(screen.getByRole('checkbox', { name: 'חזה עוף' }));

    const field = screen.getByLabelText('המשקל של רקס (ק״ג)');
    await user.clear(field);
    await user.type(field, '120');

    expect(screen.getByText('המשקל צריך להיות בין 1 ל־90 ק״ג.')).toBeTruthy();
    expect(screen.queryByLabelText(/סך הכול לארוחה/)).toBeNull();
  });
});
