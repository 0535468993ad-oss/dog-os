export type InsightKind = 'health' | 'training' | 'behavior' | 'nutrition';

export interface Insight {
  kind: InsightKind;
  priority: 'high' | 'normal';
  title: string;
  body: string;
}

const KINDS: readonly string[] = ['health', 'training', 'behavior', 'nutrition'];

/** Validates one insight from the Edge Function response (external input). */
export function isInsight(value: unknown): value is Insight {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return KINDS.includes(v.kind as string) && (v.priority === 'high' || v.priority === 'normal') && typeof v.title === 'string' && typeof v.body === 'string';
}
