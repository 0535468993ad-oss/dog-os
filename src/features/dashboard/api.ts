import { supabase } from '@/lib/supabase';
import { readFunctionError, reportError } from '@/utils/errors';

import { isInsight, type Insight } from './logic/insight';
import { isExpectedInsightsFailure } from './logic/insightsFailure';

/** AI insights from the `insights` Edge Function, or null when unavailable (the dashboard falls back to rules). */
export async function fetchAiInsights(dogId: string): Promise<Insight[] | null> {
  const { data, error } = await supabase.functions.invoke<unknown>('insights', { body: { dogId } });
  if (error) {
    // Expected outages (not deployed, AI unavailable, rate limit, opt-out) fall back silently.
    if (!isExpectedInsightsFailure(await readFunctionError(error))) reportError(error, 'insights:fallback-to-rules');
    return null;
  }
  const list = (data as { insights?: unknown } | null)?.insights;
  if (!Array.isArray(list)) return null;
  const insights = list.filter(isInsight);
  return insights.length ? insights : null;
}
