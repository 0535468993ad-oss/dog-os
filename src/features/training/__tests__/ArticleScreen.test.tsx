// Characterization of the encyclopedia article screen: every optional section, the header bookmark,
// related-module navigation, and the not-found state.
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { makeModule } from '@/test/fixtures';

import { ArticleScreen } from '../screens/ArticleScreen';
import type { KnowledgeArticle } from '../types';

const mockArticle: KnowledgeArticle = {
  id: 'clicker',
  category: 'methodology',
  methods: ['positive_reinforcement', 'operant_conditioning'],
  title: 'אילוף קליקר',
  summary: 'מרקר מדויק ברגע הנכון',
  historical_context: 'פותח במחקרי למידה',
  principles: 'תזמון ועקביות',
  steps: [
    { title: 'טעינת הקליקר', body: 'קליק ואז חטיף' },
    { title: 'סימון התנהגות', body: 'קליק ברגע הביצוע' },
  ],
  pros: ['מדויק'],
  cons: ['דורש תרגול'],
  practical_tips: ['אימונים קצרים'],
  related_module_ids: ['sit'],
  reading_minutes: 4,
  sort_order: 1,
  created_at: '2026-01-01T10:00:00.000Z',
};
const mockToggle = jest.fn();
const mockData = { articles: [mockArticle] as KnowledgeArticle[], bookmarks: [] as string[] };

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  Stack: { Screen: ({ options }: { options: { headerRight?: () => ReactNode } }) => options.headerRight?.() ?? null },
}));
jest.mock('../hooks/useKnowledgeBase', () => ({
  useKnowledgeBase: () => ({ isLoading: false, error: null, data: mockData.articles, refetch: jest.fn() }),
  useBookmarks: () => ({ data: mockData.bookmarks }),
  useToggleBookmark: () => ({ mutate: mockToggle }),
}));
const mockCatalog = [makeModule()];
jest.mock('../hooks/useTrainingSummary', () => ({ useTrainingCatalog: () => ({ data: mockCatalog }) }));

describe('ArticleScreen', () => {
  beforeEach(() => {
    mockToggle.mockClear();
    mockData.articles = [mockArticle];
    mockData.bookmarks = [];
  });

  it('renders every section of a full article', async () => {
    await render(<ArticleScreen articleId="clicker" />);
    expect(screen.getByRole('header', { name: 'אילוף קליקר' })).toBeOnTheScreen();
    for (const text of ['שיטות ומתודולוגיות', 'חיזוק חיובי', 'התניה אופרנטית', 'מרקר מדויק ברגע הנכון', 'רקע היסטורי', 'פותח במחקרי למידה', 'עקרונות', 'תזמון ועקביות', 'ביצוע מעשי – צעד אחר צעד', '1. טעינת הקליקר', '2. סימון התנהגות', 'יתרונות', 'חסרונות ואתגרים', 'טיפים מהשטח', 'תרגלו באקדמיה']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it('bookmarks from the header, and un-bookmarks a saved article', async () => {
    const user = userEvent.setup();
    const view = await render(<ArticleScreen articleId="clicker" />);
    await user.press(screen.getByRole('button', { name: 'שמירת המאמר' }));
    expect(mockToggle).toHaveBeenCalledWith({ articleId: 'clicker', bookmarked: true });
    mockData.bookmarks = ['clicker'];
    await view.rerender(<ArticleScreen articleId="clicker" />);
    await user.press(screen.getByRole('button', { name: 'הסרה מהשמורים' }));
    expect(mockToggle).toHaveBeenLastCalledWith({ articleId: 'clicker', bookmarked: false });
  });

  it('opens a related module', async () => {
    const user = userEvent.setup();
    await render(<ArticleScreen articleId="clicker" />);
    await user.press(screen.getByRole('button', { name: 'מודול: ישיבה' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/training/module/[moduleId]', params: { moduleId: 'sit' } });
  });

  it('omits empty sections, and reports a missing article', async () => {
    mockData.articles = [{ ...mockArticle, historical_context: '', principles: '', steps: [], pros: [], cons: [], practical_tips: [], related_module_ids: [] }];
    const view = await render(<ArticleScreen articleId="clicker" />);
    for (const text of ['רקע היסטורי', 'עקרונות', 'יתרונות', 'טיפים מהשטח', 'תרגלו באקדמיה']) expect(screen.queryByText(text)).toBeNull();
    await view.rerender(<ArticleScreen articleId="nope" />);
    expect(screen.getByText('המאמר לא נמצא.')).toBeOnTheScreen();
  });
});
