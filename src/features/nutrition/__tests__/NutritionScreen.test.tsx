// The nutrition screen for Jackson end to end: default product, switching through the catalog, and the
// label-kcal flow for a product without published values.
import { render, screen, userEvent } from '@testing-library/react-native';

import { NutritionScreen } from '../NutritionScreen';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, router: { push: jest.fn() } }));
jest.mock('@/features/dogs/hooks', () => ({
  useActiveDog: () => ({
    isLoading: false,
    activeDog: { id: 'd1', name: 'ג׳קסון', breed: 'רועה גרמני', breed_id: 'german-shepherd', birth_date: '2021-05-01', size: 'large', weight_kg: 35 },
  }),
}));

describe('NutritionScreen', () => {
  it('opens on the German Shepherd formula with Jackson’s daily cups', async () => {
    await render(<NutritionScreen />);
    expect(screen.getAllByText('רויאל קנין רועה גרמני בוגר').length).toBeGreaterThan(0);
    expect(screen.getByText('4.3 כוסות ביום')).toBeTruthy();
    expect(screen.getByText('שמורת האימונים')).toBeTruthy();
    expect(screen.getByText(/דיספלזיה/)).toBeTruthy();
  });

  it('recalculates for activity', async () => {
    const user = userEvent.setup();
    await render(<NutritionScreen />);
    await user.press(screen.getByRole('tab', { name: 'פעיל / באימונים' }));
    expect(screen.getByText('4.8 כוסות ביום')).toBeTruthy();
  });

  it('asks for the label kcal of a product without published values, then shows the portion', async () => {
    const user = userEvent.setup();
    await render(<NutritionScreen />);
    await user.press(screen.getByRole('button', { name: 'החלפת מזון' }));
    await user.type(screen.getByLabelText('חיפוש'), 'גולד');
    await user.press(screen.getByRole('button', { name: 'בחירת בונזו גולד בקר / עוף' }));

    const field = screen.getByLabelText('קלוריות ל־100 גרם (מהאריזה)');
    await user.type(field, '360');
    expect(screen.getByText('3.8 כוסות ביום')).toBeTruthy();
  });

  it('explains why a complementary food gets no sole-diet portion', async () => {
    const user = userEvent.setup();
    await render(<NutritionScreen />);
    await user.press(screen.getByRole('button', { name: 'החלפת מזון' }));
    await user.press(screen.getByRole('button', { name: 'בחירת אבוריג׳ינל עוף' }));
    expect(screen.getByText(/מזון משלים" לפי היצרן/)).toBeTruthy();
  });
});
