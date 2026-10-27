import type { JournalCategory, JournalMood } from '@/lib/database.types';

export const JOURNAL_CATEGORY_LABELS: Record<JournalCategory, string> = {
  behavior: 'התנהגות',
  health: 'בריאות',
  training: 'אימון',
  general: 'כללי',
};

export const MOOD_LABELS: Record<JournalMood, string> = {
  great: 'מצוין',
  good: 'טוב',
  okay: 'בסדר',
  bad: 'קשה',
};
