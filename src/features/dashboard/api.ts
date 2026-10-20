import { supabase } from '@/lib/supabase';
import { reportError } from '@/utils/errors';

import { isInsight, type Insight } from './logic/insight';

/** AI insights from the `insights` Edge Function, or null when unavailable (the dashboard falls back to rules). */
export async function fetchAiInsights(dogId: string): Promise<Insight[] | null> {
  const { data, error } = await supabase.functions.invoke<unknown>('insights', { body: { dogId } });
  if (error) {
    reportError(error, 'insights:fallback-to-rules');
    return null;
  }
  const list = (data as { insights?: unknown } | null)?.insights;
  if (!Array.isArray(list)) return null;
  const insights = list.filter(isInsight);
  return insights.length ? insights : null;
}
