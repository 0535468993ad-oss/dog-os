import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useUser } from '@/features/auth/AuthProvider';
import { useHealth, useVetKnowledge } from '@/features/health/hooks';
import { useJournal } from '@/features/journal/hooks';
import { useAiSharing, type AiSharing } from '@/features/legal/consents';
import { useTrainingSummary } from '@/features/training/hooks';
import type { DogRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { todayIso } from '@/utils/date';

import { fetchAiInsights } from './api';
import { healthReminders } from './logic/dailyTasks';
import { ruleBasedInsights } from './logic/ruleBasedInsights';
import { selectInsights } from './logic/selectInsights';

/** Today's AI insights; only runs while the user allows AI data sharing (else rules are used). */
export function useAiInsights(dogId: string | null, aiSharing: AiSharing) {
  return useQuery({
    queryKey: queryKeys.insights(dogId ?? 'none', todayIso()),
    queryFn: () => fetchAiInsights(dogId!),
    enabled: !!dogId && aiSharing === 'allowed',
    staleTime: 6 * 60 * 60 * 1000, // generated once a day server-side
    retry: false,
  });
}

/** Everything the dashboard shows for one dog, plus a pull-to-refresh that respects the AI opt-out. */
export function useDashboardData(dog: DogRow) {
  const user = useUser();
  const sharing = useAiSharing(user.id);
  const health = useHealth(dog.id);
  const training = useTrainingSummary(dog.id);
  const journal = useJournal(dog.id);
  const vet = useVetKnowledge();
  const ai = useAiInsights(dog.id, sharing);
  const [refreshing, setRefreshing] = useState(false);
  const today = todayIso();

  // Refetches everything; refetch() ignores `enabled`, so the AI call is gated by the opt-out here too.
  const refresh = () => {
    setRefreshing(true);
    const aiRefresh = sharing === 'allowed' ? [ai.refetch()] : [];
    void Promise.allSettled([health.refetch(), training.refetch(), journal.refetch(), ...aiRefresh]).finally(() => setRefreshing(false));
  };

  const breedArticles = (vet.data?.articles ?? []).filter((a) => a.category === 'breed_health' && !!dog.breed_id && a.breeds.includes(dog.breed_id));
  const insights = selectInsights({
    aiLoading: ai.isLoading,
    aiSharing: sharing,
    aiInsights: ai.data,
    ruleInsights: () =>
      ruleBasedInsights({
        dog,
        health: health.data,
        streak: training.streak,
        activeModule: training.activeModule,
        nextModule: training.nextModule,
        journal: journal.data,
        breedArticles,
      }),
  });

  return { today, sharing, health, training, journal, insights, reminders: healthReminders(health.data, today), refresh, refreshing };
}
