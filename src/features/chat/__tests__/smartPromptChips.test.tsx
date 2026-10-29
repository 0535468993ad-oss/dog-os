import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_AREA, tints } from '@/constants/theme';

import { SmartPromptChips } from '../components/SmartPromptChips';
import { promptChips } from '../utils/promptChips';

function flat(element: { props: { style?: unknown } }) {
  return StyleSheet.flatten(element.props.style as never) as { minHeight?: number; borderColor?: string; borderWidth?: number; backgroundColor?: string; shadowColor?: string; color?: string };
}

describe('promptChips', () => {
  it('covers all three categories within the first three chips', () => {
    expect(new Set(promptChips(null).slice(0, 3).map((c) => c.category))).toEqual(new Set(['toxicity', 'health', 'general']));
  });

  it('personalizes questions with the dog name and has unique ids', () => {
    const chips = promptChips('רקסי');
    expect(chips.filter((c) => c.question.includes('רקסי')).length).toBeGreaterThanOrEqual(3);
    expect(new Set(chips.map((c) => c.id)).size).toBe(chips.length);
    expect(promptChips(null).some((c) => c.question.includes('null'))).toBe(false);
  });
});

describe('SmartPromptChips', () => {
  const chips = promptChips(null);

  it('sends the tapped question to the advisor', async () => {
    const onPick = jest.fn();
    await render(<SmartPromptChips chips={chips} onPick={onPick} />);
    await userEvent.press(screen.getByRole('button', { name: 'רעילות: האם ענבים רעילים לכלבים?' }));
    expect(onPick).toHaveBeenCalledWith('האם ענבים רעילים לכלבים?');
  });

  it('renders every chip as a quiet glass card with no glow and 44pt touch targets', async () => {
    await render(<SmartPromptChips chips={chips} onPick={() => undefined} />);

    for (const chip of screen.getAllByRole('button')) {
      const style = flat(chip);
      expect(style).toMatchObject({ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 });
      expect(style.shadowColor).toBeUndefined();
      expect(style.minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
    }
    expect(flat(screen.getByText('האם ענבים רעילים לכלבים?')).color).toBe(colors.textPrimary);
  });

  it('carries the category color in a tinted icon badge', async () => {
    await render(<SmartPromptChips chips={chips} onPick={() => undefined} />);

    expect(flat(screen.getAllByTestId('chip-icon-toxicity')[0]!).backgroundColor).toBe(tints.alert);
    expect(flat(screen.getAllByTestId('chip-icon-health')[0]!).backgroundColor).toBe(tints.health);
    expect(flat(screen.getAllByTestId('chip-icon-general')[0]!).backgroundColor).toBe(tints.ai);
  });

  it('is disabled while a reply is pending', async () => {
    const onPick = jest.fn();
    await render(<SmartPromptChips chips={chips} onPick={onPick} disabled />);
    const chip = screen.getAllByRole('button', { name: /^רעילות:/ })[0]!;
    expect(chip).toBeDisabled();
    await userEvent.press(chip);
    expect(onPick).not.toHaveBeenCalled();
  });
});
