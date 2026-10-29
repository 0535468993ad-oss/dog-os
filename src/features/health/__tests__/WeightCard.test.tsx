// Weight card: the date gets the wider share so a full Hebrew date never truncates, the pair wraps as whole fields, the latest weight uses tabular digits, and saving
// validates before it writes.
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { makeWeight } from '@/test/fixtures';

import { WeightCard } from '../records/WeightCard';

const mockMutateAsync = jest.fn();
jest.mock('@/features/health/hooks', () => ({ useLogWeight: () => ({ mutateAsync: mockMutateAsync, isPending: false }) }));
jest.mock('@/features/health/WeightChart', () => ({ WeightChart: () => null }));

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

beforeEach(() => mockMutateAsync.mockReset());

describe('WeightCard', () => {
  it('shows the latest weight in tabular digits', async () => {
    await render(<WeightCard dogId="dog-1" weights={[makeWeight({ weight_kg: 12.4 })]} />);
    expect(flat(screen.getByText('12.4 ק״ג')).fontVariant).toEqual(['tabular-nums']);
  });

  it('gives the date field the wider share, so a full Hebrew date fits beside the weight', async () => {
    await render(<WeightCard dogId="dog-1" weights={[]} />);
    const dateButton = screen.getByRole('button', { name: /^תאריך:/ });
    // Field wrapper → DateField root → trigger: the wrapper is two levels up.
    const wrapper = dateButton.parent?.parent;
    expect(wrapper && flat(wrapper)).toMatchObject({ flexGrow: 2, flexBasis: 200 });
  });

  it('rejects an out-of-range weight without saving', async () => {
    const user = userEvent.setup();
    await render(<WeightCard dogId="dog-1" weights={[]} />);

    await user.type(screen.getByLabelText('משקל (ק״ג)'), '0');
    await user.press(screen.getByRole('button', { name: 'שמירת שקילה' }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });
});
