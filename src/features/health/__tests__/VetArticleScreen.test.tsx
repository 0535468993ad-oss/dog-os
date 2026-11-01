// Characterization of the vet encyclopedia article (urgency card, every optional section, numbered steps,
// breeds at risk, the disclaimer, the not-found state), plus the emergency strip, article cards and the
// symptom checker's verdict.
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Linking, StyleSheet } from 'react-native';

import { makeSymptom, makeVetArticle } from '@/test/fixtures';

import { EmergencyActions } from '../encyclopedia/EmergencyActions';
import { EmergencyStrip, emergencyIcon } from '../encyclopedia/EmergencyStrip';
import { NEARBY_EMERGENCY_VET_URL } from '../logic/vetContact';
import { VetArticleCard } from '../encyclopedia/VetArticleCard';
import { SymptomCheckerTab } from '../symptoms/SymptomCheckerTab';
import { VetArticleScreen } from '../VetArticleScreen';

const mockArticles = { current: [makeVetArticle()] };
const mockPhone: { current: string | null } = { current: null };
const mockSavePhone = jest.fn();
const mockSymptoms = {
  current: [
    makeSymptom({ id: 'itching', name: 'גירוד', base_urgency: 'home_care' }),
    makeSymptom({ id: 'bad-breath', name: 'ריח רע מהפה', base_urgency: 'home_care', red_flags: ['נפיחות בפנים'] }),
  ],
};

jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, router: { push: jest.fn() } }));
jest.mock('../hooks', () => ({
  useVetKnowledge: () => ({
    isLoading: false,
    error: null,
    data: { articles: mockArticles.current, symptoms: mockSymptoms.current, conditionsBySymptom: new Map<string, string[]>() },
    refetch: jest.fn(),
  }),
  useVetPhone: () => ({ data: mockPhone.current }),
  useSaveVetPhone: () => ({ mutate: mockSavePhone, isPending: false }),
}));

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe('VetArticleScreen', () => {
  it('renders an emergency article with every section', async () => {
    mockArticles.current = [
      makeVetArticle({
        causes: 'אכילה מהירה',
        actions: [{ title: 'נוסעים לווטרינר', body: 'מיד' }],
        when_to_call_vet: 'תמיד',
        prevention: 'ארוחות קטנות',
      }),
    ];
    await render(<VetArticleScreen articleId="bloat" />);
    expect(screen.getByRole('header', { name: 'היפוך קיבה' })).toBeOnTheScreen();
    for (const text of ['מצב חירום בכלבים גדולים', 'הקיבה מתמלאת גז ומסתובבת', 'סימנים', 'בטן נפוחה', 'מה עושים עכשיו', 'נוסעים לווטרינר', 'גורמים וגורמי סיכון', 'אכילה מהירה', 'מתי לפנות לווטרינר', 'מניעה', 'ארוחות קטנות', 'גזעים בסיכון מוגבר']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/^רמת דחיפות: /)).toBeOnTheScreen();
    expect(screen.getByLabelText('שלב 1: נוסעים לווטרינר. מיד')).toBeOnTheScreen();
  });

  it('uses the non-emergency action heading and omits empty sections', async () => {
    mockArticles.current = [makeVetArticle({ category: 'condition', urgency: null, actions: [{ title: 'מנוחה', body: 'יומיים' }], breeds: [], signs: [] })];
    await render(<VetArticleScreen articleId="bloat" />);
    expect(screen.getByText('מה עושים')).toBeOnTheScreen();
    for (const text of ['סימנים', 'גורמים וגורמי סיכון', 'מתי לפנות לווטרינר', 'מניעה', 'גזעים בסיכון מוגבר']) expect(screen.queryByText(text)).toBeNull();
    expect(screen.queryByText(/^רמת דחיפות: /)).toBeNull();
  });

  it('reports a missing article', async () => {
    await render(<VetArticleScreen articleId="nope" />);
    expect(screen.getByText('הערך לא נמצא.')).toBeOnTheScreen();
  });
});

describe('EmergencyStrip', () => {
  it('shows full titles with a per-emergency icon and opens the first-aid article', async () => {
    const long = makeVetArticle({ id: 'poisoning', title: 'הרעלות: מזונות וחומרים מסוכנים' });
    await render(<EmergencyStrip articles={[long]} />);

    expect(screen.getByRole('header', { name: 'גישה מהירה למצבי חירום' })).toBeOnTheScreen();
    expect(screen.getByText('הרעלות: מזונות וחומרים מסוכנים').props.numberOfLines).toBeUndefined();
    await userEvent.press(screen.getByRole('button', { name: 'חירום: הרעלות: מזונות וחומרים מסוכנים' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/health/article/[articleId]', params: { articleId: 'poisoning' } });
  });

  it('falls back to the generic alert icon for unknown emergencies', () => {
    expect(emergencyIcon('heatstroke')).toBe('thermometer-outline');
    expect(emergencyIcon('constructor')).toBe('alert-circle-outline');
    expect(emergencyIcon('new-emergency')).toBe('alert-circle-outline');
  });
});

describe('VetArticleCard', () => {
  it('never truncates the summary and keeps badges off the title row', async () => {
    await render(<VetArticleCard article={makeVetArticle({ summary: 'סיכום ארוך שחייב להופיע במלואו בלי שלוש נקודות בסוף' })} />);
    expect(screen.getByText(/סיכום ארוך/).props.numberOfLines).toBeUndefined();
    const badgeRow = screen.getByText('חירום').parent?.parent;
    expect(badgeRow && flat(badgeRow)).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap' });
  });
});

describe('SymptomCheckerTab', () => {
  it('escalates several mild signs to a vet visit and says why, then clears', async () => {
    const user = userEvent.setup();
    await render(<SymptomCheckerTab />);

    await user.press(screen.getByRole('checkbox', { name: 'גירוד' }));
    expect(screen.getByText('רמת דחיפות: טיפול ביתי')).toBeOnTheScreen();

    await user.press(screen.getByRole('checkbox', { name: 'ריח רע מהפה' }));
    expect(screen.getByText('רמת דחיפות: ביקור וטרינר')).toBeOnTheScreen();
    expect(screen.getByText(/כמה סימנים יחד מצדיקים בדיקה/)).toBeOnTheScreen();
    expect(screen.getByText('נבחרו 2 סימנים. אפשר לבחור כמה.')).toBeOnTheScreen();

    await user.press(screen.getByRole('checkbox', { name: 'נפיחות בפנים' }));
    expect(screen.getByText('רמת דחיפות: חירום')).toBeOnTheScreen();
    expect(screen.getByText(/סימנתם סימן אזהרה/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ניקוי כל הסימנים שנבחרו' }));
    expect(screen.queryByText(/^רמת דחיפות/)).toBeNull();
  });
});

describe('EmergencyActions', () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  beforeEach(() => {
    openURL.mockClear();
    mockSavePhone.mockReset();
    mockPhone.current = null;
  });

  it('always offers the nearest emergency vet, and asks to save a number when none is saved', async () => {
    await render(<EmergencyActions />);
    expect(screen.queryByRole('button', { name: /^התקשרו לווטרינר/ })).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'וטרינר חירום פתוח קרוב' }));
    expect(openURL).toHaveBeenCalledWith(NEARBY_EMERGENCY_VET_URL);

    await userEvent.press(screen.getByRole('button', { name: 'שמירת מספר הווטרינר' }));
    await userEvent.type(screen.getByLabelText('מספר הווטרינר שלכם'), '03-1234567');
    await userEvent.press(screen.getByRole('button', { name: 'שמירה' }));
    expect(mockSavePhone).toHaveBeenCalledWith('03-1234567', expect.anything());
  });

  it('dials the saved vet in one tap', async () => {
    mockPhone.current = '031234567';
    await render(<EmergencyActions />);
    await userEvent.press(screen.getByRole('button', { name: 'התקשרו לווטרינר שלכם, 031234567' }));
    expect(openURL).toHaveBeenCalledWith('tel:031234567');
  });

  it('shows an inline error when the number cannot be dialled', async () => {
    mockSavePhone.mockImplementation((_value: string, options: { onError: (e: Error) => void }) => options.onError(new Error('INVALID_PHONE')));
    await render(<EmergencyActions />);
    await userEvent.press(screen.getByRole('button', { name: 'שמירת מספר הווטרינר' }));
    await userEvent.press(screen.getByRole('button', { name: 'שמירה' }));
    expect(screen.getByText(/מספר לא תקין/)).toBeOnTheScreen();
  });

  it('appears on emergency articles', async () => {
    mockArticles.current = [makeVetArticle()];
    await render(<VetArticleScreen articleId="bloat" />);
    expect(screen.getByRole('button', { name: 'וטרינר חירום פתוח קרוב' })).toBeOnTheScreen();
  });
});

