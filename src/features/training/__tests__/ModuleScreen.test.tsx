// Characterization of the academy module screen: progress card, step toggling (disabled without a dog),
// tips, related-article navigation, and the not-found state.
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { makeDog, makeModule } from '@/test/fixtures';

import { ModuleScreen } from '../screens/ModuleScreen';

const mockModule = makeModule({
  tips: ['מסיימים בהצלחה'],
  steps: [
    { id: 'sit-1', module_id: 'sit', position: 1, title: 'פיתוי', instructions: 'מעל הראש' },
    { id: 'sit-2', module_id: 'sit', position: 2, title: 'מרקר', instructions: 'כן! ברגע הישיבה' },
  ],
});
const mockMutate = jest.fn();
const mockDogState = { dog: makeDog() as ReturnType<typeof makeDog> | null };

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, Stack: { Screen: () => null } }));
jest.mock('@/features/dogs/hooks', () => ({ useActiveDog: () => ({ activeDog: mockDogState.dog }) }));
jest.mock('../hooks/useKnowledgeBase', () => ({
  useKnowledgeBase: () => ({ data: [{ id: 'lure', title: 'פיתוי ועיצוב', summary: 'איך מפתים', related_module_ids: ['sit'] }] }),
}));
jest.mock('../hooks/useTrainingSummary', () => ({
  useTrainingSummary: () => ({
    isLoading: false,
    error: null,
    hasData: true,
    refetch: jest.fn(),
    modules: [mockModule],
    perModule: new Map([['sit', { completed: 1, total: 2, ratio: 0.5 }]]),
    completedSteps: new Set(['sit-1']),
  }),
  useToggleStep: () => ({ mutate: mockMutate }),
}));

describe('ModuleScreen', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockDogState.dog = makeDog();
  });

  it('shows the module, the dog’s progress, steps, tips and related articles', async () => {
    await render(<ModuleScreen moduleId="sit" />);
    expect(screen.getByRole('header', { name: 'ישיבה' })).toBeOnTheScreen();
    expect(screen.getByText('ההתקדמות של רקסי: 1 מתוך 2 שלבים')).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'שלב 1: פיתוי, הושלם' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'שלב 2: מרקר' })).not.toBeChecked();
    expect(screen.getByText('מסיימים בהצלחה')).toBeOnTheScreen();
  });

  it('toggles a step', async () => {
    const user = userEvent.setup();
    await render(<ModuleScreen moduleId="sit" />);
    await user.press(screen.getByRole('checkbox', { name: 'שלב 2: מרקר' }));
    expect(mockMutate).toHaveBeenCalledWith({ stepId: 'sit-2', completed: true });
  });

  it('opens a related article', async () => {
    const user = userEvent.setup();
    await render(<ModuleScreen moduleId="sit" />);
    await user.press(screen.getByRole('button', { name: 'מאמר: פיתוי ועיצוב' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/training/article/[articleId]', params: { articleId: 'lure' } });
  });

  it('disables steps without a dog, and reports a missing module', async () => {
    mockDogState.dog = null;
    const view = await render(<ModuleScreen moduleId="sit" />);
    expect(screen.getByRole('checkbox', { name: 'שלב 2: מרקר' })).toBeDisabled();
    expect(screen.queryByText(/ההתקדמות של/)).toBeNull();
    await view.rerender(<ModuleScreen moduleId="nope" />);
    expect(screen.getByText('המודול לא נמצא.')).toBeOnTheScreen();
  });
});
