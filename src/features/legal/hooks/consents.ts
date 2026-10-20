import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';

import { fetchConsents, insertConsents } from '../api/consents';
import type { AiSharing, ConsentDecision } from '../types';
import { aiSharing, buildConsentRows } from '../utils/consentRules';

/** The signed-in user's consent records (disabled while signed out). */
export function useConsents(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.consents(userId ?? 'anonymous'),
    queryFn: fetchConsents,
    enabled: !!userId,
  });
}

/** Records a consent decision and refreshes everything that depends on it. */
export function useRecordConsents(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (decision: ConsentDecision) => insertConsents(buildConsentRows(decision)),
    onSuccess: (_data, decision) => {
      void client.invalidateQueries({ queryKey: queryKeys.consents(userId) });
      // Opting out stops AI work immediately: drop cached AI results so nothing keeps showing them.
      if (decision.types.includes('ai_data_sharing') && !decision.granted) client.removeQueries({ queryKey: queryKeys.allInsights });
    },
  });
}

/** AI-sharing state for the signed-in user. */
export function useAiSharing(userId: string): AiSharing {
  return aiSharing(useConsents(userId));
}
