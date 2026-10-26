// Characterization of the meal calculator: the live portion (only with valid inputs), validation, saving
// and going back, a save error, and deleting an existing plan.
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { makeDog, makeFood, makeHealth } from '@/test/fixtures';

import { deleteFood, saveFood } from '../api';
import { FoodFormScreen } from '../forms/FoodFormScreen';

const mockDog = makeDog({ weight_kg: 20 });

jest.mock('expo-router', () => ({ router: { back: jest.fn() }, Stack: { Screen: () => null } }));
jest.mock('@/features/dogs/hooks', () => ({ useActiveDog: () => ({ activeDog: mockDog, isLoading: false }) }));
jest.mock('../api', () => ({ saveFood: jest.fn(async () => undefined), deleteFood: jest.fn(async () => undefined) }));
jest.mock('../hooks', () => ({
  useHealth: () => ({ isLoading: false, data: mockHealth.current }),
  useHealthMutation: (_dogId: string, fn: (vars: unknown) => Promise<void>) => ({ mutateAsync: fn, isPending: false }),
}));
const mockHealth = { current: makeHealth({ food: [makeFood()] }) };

describe('FoodFormScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calculates the portion live and saves the plan', async () => {
    const user = userEvent.setup();
    await render(<FoodFormScreen />);
    expect(screen.queryByText(/גרם לארוחה$/)).toBeNull();
    await user.type(screen.getByLabelText('שם המזון'), 'מזון בדיקה');
    await user.type(screen.getByLabelText('קלוריות ל-100 גרם'), '370');
    expect(screen.getByText(/^\d+ גרם לארוחה$/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'שמירה' }));
    await waitFor(() =>
      expect(saveFood).toHaveBeenCalledWith(mockDog.id, { foodName: 'מזון בדיקה', gramsPerMeal: 143, kcalPer100g: 370, mealsPerDay: 2, notes: null }, undefined),
    );
    expect(router.back).toHaveBeenCalled();
  });

  it('shows validation errors instead of saving', async () => {
    const user = userEvent.setup();
    await render(<FoodFormScreen />);
    await user.press(screen.getByRole('button', { name: 'שמירה' }));
    expect(saveFood).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('shows a save error and stays', async () => {
    jest.mocked(saveFood).mockRejectedValueOnce(new Error('boom'));
    const user = userEvent.setup();
    await render(<FoodFormScreen />);
    await user.type(screen.getByLabelText('שם המזון'), 'מזון');
    await user.type(screen.getByLabelText('קלוריות ל-100 גרם'), '370');
    await user.press(screen.getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(router.back).not.toHaveBeenCalled();
  });

  it('edits and deletes an existing plan', async () => {
    const user = userEvent.setup();
    await render(<FoodFormScreen id="f-1" />);
    expect(screen.getByLabelText('שם המזון')).toHaveDisplayValue('מזון יבש');
    await user.press(screen.getByRole('button', { name: 'מחיקה' }));
    await user.press(screen.getByRole('button', { name: 'מחיקה לצמיתות' }));
    await waitFor(() => expect(deleteFood).toHaveBeenCalledWith('f-1'));
    expect(router.back).toHaveBeenCalled();
  });
});
