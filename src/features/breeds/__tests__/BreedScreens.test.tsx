// The breed screens end to end: search and filter in the explorer, the four detail tabs with the
// bloat warning and disclaimer, the comparison modal, and the dog-profile intelligence badge.
import { render, screen, userEvent } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BreedIntelBadge } from '../components/BreedIntelBadge';
import { BREED_PROFILES } from '../data/breedsSeedData';
import { BreedDetailScreen } from '../screens/BreedDetailScreen';
import { BreedExplorerScreen } from '../screens/BreedExplorerScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useLocalSearchParams: jest.fn() }));

const params = useLocalSearchParams as jest.Mock;
const gdvCount = BREED_PROFILES.filter((profile) => profile.clinical.bloatGdvRisk.hasHighPredisposition).length;

describe('BreedExplorerScreen', () => {
  it('searches in Hebrew and opens a breed', async () => {
    const user = userEvent.setup();
    await render(<BreedExplorerScreen />);
    expect(screen.getByText(`${BREED_PROFILES.length} גזעים`)).toBeOnTheScreen();
    await user.type(screen.getByLabelText('חיפוש גזע'), 'שפרד');
    expect(screen.getByText('1 גזעים')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: /^רועה גרמני, German Shepherd Dog/ }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/breeds/[breedId]', params: { breedId: 'german-shepherd' } });
  });

  it('filters by bloat risk and shows an empty state for no match', async () => {
    const user = userEvent.setup();
    await render(<BreedExplorerScreen />);
    await user.press(screen.getByRole('checkbox', { name: 'סיכון לתסובב קיבה' }));
    expect(screen.getByText(`${gdvCount} גזעים`)).toBeOnTheScreen();
    // The poodle profile (toy/miniature) has no bloat predisposition, so the combination matches nothing.
    await user.type(screen.getByLabelText('חיפוש גזע'), 'פודל');
    expect(screen.getByText('לא נמצא גזע')).toBeOnTheScreen();
  });
});

describe('BreedDetailScreen', () => {
  it('shows the four tabs, the bloat warning and the medical disclaimer', async () => {
    params.mockReturnValue({ breedId: 'german-shepherd' });
    const user = userEvent.setup();
    await render(<BreedDetailScreen />);
    expect(screen.getAllByText(/פון שטפניץ/).length).toBeGreaterThan(0);
    await user.press(screen.getByRole('tab', { name: 'רדאר יצרים ואופי' }));
    expect(screen.getByLabelText('דחף טרף: 4 מתוך 5')).toBeOnTheScreen();
    expect(screen.getByText('דחף עבודה גבוה – דורש פריקת אנרגיה מוחית לפני תרגול משמעת.')).toBeOnTheScreen();
    await user.press(screen.getByRole('tab', { name: 'פרופיל וטרינרי ורפואי' }));
    expect(screen.getByText('אזהרה: נטייה גבוהה לתסובב קיבה (GDV)')).toBeOnTheScreen();
    expect(screen.getByText(/לא אבחנה/)).toBeOnTheScreen();
  });

  it('compares with another breed', async () => {
    params.mockReturnValue({ breedId: 'german-shepherd' });
    const user = userEvent.setup();
    await render(<BreedDetailScreen />);
    await user.press(screen.getByRole('button', { name: 'השוואה לגזע אחר' }));
    await user.press(screen.getByRole('radio', { name: 'בולדוג צרפתי' }));
    expect(screen.getByLabelText('סיכון לתסובב קיבה: כן מול לא')).toBeOnTheScreen();
  });

  it('handles an unknown breed id', async () => {
    params.mockReturnValue({ breedId: 'unicorn' });
    await render(<BreedDetailScreen />);
    expect(screen.getByText('הגזע לא נמצא')).toBeOnTheScreen();
  });
});

describe('BreedIntelBadge', () => {
  it('links a profiled breed and hides for others', async () => {
    const user = userEvent.setup();
    await render(<BreedIntelBadge breedId="doberman" />);
    await user.press(screen.getByRole('link', { name: 'כרטיס מודיעין גזע: דוברמן' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/breeds/[breedId]', params: { breedId: 'doberman' } });
    // A picker breed with no profile of its own (see breedsSeedData.test.ts).
    await render(<BreedIntelBadge breedId="standard-poodle" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
