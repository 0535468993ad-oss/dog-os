// Characterization of the vet encyclopedia article: urgency card, every optional section, breeds at
// risk, the disclaimer, and the not-found state.
import { render, screen } from '@testing-library/react-native';

import { makeVetArticle } from '@/test/fixtures';

import { VetArticleScreen } from '../VetArticleScreen';

const mockArticles = { current: [makeVetArticle()] };

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
jest.mock('../hooks', () => ({
  useVetKnowledge: () => ({ isLoading: false, error: null, data: { articles: mockArticles.current }, refetch: jest.fn() }),
}));

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
    for (const text of ['מצב חירום בכלבים גדולים', 'הקיבה מתמלאת גז ומסתובבת', 'סימנים', 'בטן נפוחה', 'מה עושים עכשיו', '1. נוסעים לווטרינר', 'גורמים וגורמי סיכון', 'אכילה מהירה', 'מתי לפנות לווטרינר', 'מניעה', 'ארוחות קטנות', 'גזעים בסיכון מוגבר']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/^רמת דחיפות: /)).toBeOnTheScreen();
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
