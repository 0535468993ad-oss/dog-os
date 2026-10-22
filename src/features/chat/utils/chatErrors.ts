import type { KnowledgeBaseErrorCode } from '../types';

export class ChatError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export class KnowledgeBaseError extends Error {
  constructor(
    public readonly code: KnowledgeBaseErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options);
    this.name = 'KnowledgeBaseError';
  }
}

export const CHAT_ERROR_MESSAGES: Record<string, string> = {
  rate_limited: 'הגעתם למגבלת ההודעות לשעה. נסו שוב מאוחר יותר.',
  ai_opted_out: 'שיתוף המידע עם היועץ החכם כבוי. אפשר להפעיל אותו בניהול הסכמות.',
  ai_unavailable: 'היועץ החכם לא זמין כרגע. נסו שוב בעוד כמה דקות.',
  unavailable: 'היועץ החכם לא זמין כרגע. נסו שוב בעוד כמה דקות.',
  not_deployed: 'היועץ החכם עוד לא הופעל בשרת. ההגדרה בצד השרת חסרה – נסו שוב מאוחר יותר.',
  unauthorized: 'פג תוקף ההתחברות. התחברו מחדש.',
  network: 'אין חיבור לשרת. בדקו את החיבור לאינטרנט.',
};
