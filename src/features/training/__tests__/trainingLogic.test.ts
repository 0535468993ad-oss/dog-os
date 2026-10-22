import { makeModule } from '@/test/fixtures';

import type { KnowledgeArticle } from '../types';
import { categoryOptions, filterArticles, METHOD_OPTIONS } from '../utils/articleSearch';
import { isModuleComplete, moduleAccessibilityLabel, streakTitle } from '../utils/moduleProgress';

function article(overrides: Partial<KnowledgeArticle>): KnowledgeArticle {
  return {
    id: 'a',
    category: 'methodology',
    methods: ['positive_reinforcement'],
    title: 'חיזוק חיובי',
    summary: 'למה זה עובד',
    historical_context: 'סקינר',
    principles: 'עיתוי',
    steps: [],
    pros: [],
    cons: [],
    practical_tips: [],
    related_module_ids: [],
    reading_minutes: 5,
    sort_order: 1,
    created_at: '',
    ...overrides,
  };
}

const articles = [
  article({ id: 'pr' }),
  article({ id: 'clicker', category: 'core_command', methods: ['clicker_training'], title: 'עבודה עם קליקר', historical_context: '' }),
  article({ id: 'anxiety', category: 'behavioral_issue', methods: ['desensitization'], title: 'חרדת נטישה', summary: 'הדרגתיות', principles: '', historical_context: '' }),
];

const none = new Set<string>();

describe('filterArticles', () => {
  it('returns everything with no filters', () => {
    expect(filterArticles(articles, { query: '', category: 'all', method: 'all', saved: none })).toHaveLength(3);
  });

  it('shows only bookmarked articles under "saved"', () => {
    expect(filterArticles(articles, { query: '', category: 'saved', method: 'all', saved: new Set(['clicker']) }).map((a) => a.id)).toEqual(['clicker']);
  });

  it('filters by category and by method', () => {
    expect(filterArticles(articles, { query: '', category: 'behavioral_issue', method: 'all', saved: none }).map((a) => a.id)).toEqual(['anxiety']);
    expect(filterArticles(articles, { query: '', category: 'all', method: 'clicker_training', saved: none }).map((a) => a.id)).toEqual(['clicker']);
  });

  it('searches title, summary, principles and history', () => {
    expect(filterArticles(articles, { query: 'סקינר', category: 'all', method: 'all', saved: none }).map((a) => a.id)).toEqual(['pr']);
    expect(filterArticles(articles, { query: 'הדרגתיות', category: 'all', method: 'all', saved: none }).map((a) => a.id)).toEqual(['anxiety']);
  });
});

describe('filter options', () => {
  it('shows the saved count and every category', () => {
    const options = categoryOptions(4);
    expect(options[1]).toEqual({ value: 'saved', label: 'שמורים (4)' });
    expect(options).toHaveLength(2 + 5);
  });

  it('starts the method list with "all"', () => {
    expect(METHOD_OPTIONS[0]?.value).toBe('all');
  });
});

describe('module progress', () => {
  it('is complete only when every step is done', () => {
    expect(isModuleComplete({ completed: 3, total: 3, ratio: 1 })).toBe(true);
    expect(isModuleComplete({ completed: 2, total: 3, ratio: 0.66 })).toBe(false);
    expect(isModuleComplete({ completed: 0, total: 0, ratio: 0 })).toBe(false);
    expect(isModuleComplete(undefined)).toBe(false);
  });

  it('uses the Hebrew singular for one day', () => {
    expect(streakTitle(1)).toBe('רצף אימונים: 1 יום');
    expect(streakTitle(5)).toBe('רצף אימונים: 5 ימים');
  });

  it('describes the module for screen readers', () => {
    expect(moduleAccessibilityLabel(makeModule({ title: 'ישיבה' }), { completed: 1, total: 4, ratio: 0.25 })).toBe('ישיבה, מתחילים, 1 מתוך 4 שלבים');
  });
});
