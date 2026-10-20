import type { AiSharing } from '@/features/legal/types';

import type { Insight } from './insight';

export interface InsightsToShow {
  source: 'ai' | 'rules';
  list: Insight[];
}

/**
 * Chooses what the insights card shows: AI insights when sharing is allowed and they arrived, otherwise
 * the rule-based ones. null while AI insights are still loading.
 */
export function selectInsights(input: { aiLoading: boolean; aiSharing: AiSharing; aiInsights: Insight[] | null | undefined; ruleInsights: () => Insight[] }): InsightsToShow | null {
  if (input.aiLoading) return null;
  if (input.aiSharing === 'allowed' && input.aiInsights?.length) return { source: 'ai', list: input.aiInsights };
  return { source: 'rules', list: input.ruleInsights() };
}
