import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_AREA } from '@/theme';

import { SmartPromptChips } from '../components/SmartPromptChips';
import { promptChips } from '../logic/promptChips';

function flat(element: { props: { style?: unknown } }) {
  return StyleSheet.flatten(element.props.style as never) as { minHeight?: number; borderColor?: string; backgroundColor?: string };
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

  it('colors chips by category and keeps 44pt touch targets', async () => {
    await render(<SmartPromptChips chips={chips} onPick={() => undefined} />);
    const toxicity = flat(screen.getAllByRole('button', { name: /^רעילות:/ })[0]!);
    const health = flat(screen.getAllByRole('button', { name: /^בריאות:/ })[0]!);
    const general = flat(screen.getAllByRole('button', { name: /^כללי:/ })[0]!);

    expect(toxicity).toMatchObject({ borderColor: colors.alert, backgroundColor: colors.alertMuted });
    expect(health).toMatchObject({ borderColor: colors.health, backgroundColor: colors.healthMuted });
    expect(general).toMatchObject({ borderColor: colors.aiBright, backgroundColor: colors.aiMuted });
    for (const chip of screen.getAllByRole('button')) expect(flat(chip).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
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
