import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { showToast } from '@/components/ui';
import type { TrainingProgressRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { toUserMessage } from '@/utils/errors';

import { fetchTrainingCatalog, fetchTrainingProgress, setStepCompleted } from '../api/catalog';
import type { TrainingModule } from '../types';
import { summarizeTraining } from '../utils/trainingSummary';

/** Shared content changes rarely. */
export const CATALOG_STALE_MS = 60 * 60 * 1000;

/** The module catalog. */
export function useTrainingCatalog() {
  return useQuery({ queryKey: queryKeys.trainingCatalog, queryFn: fetchTrainingCatalog, staleTime: CATALOG_STALE_MS });
}

/** A dog's completed steps (disabled without a dog). */
export function useTrainingProgress(dogId: string | null) {
  return useQuery({
    queryKey: queryKeys.trainingProgress(dogId ?? 'none'),
    queryFn: () => (dogId ? fetchTrainingProgress(dogId) : Promise.resolve<TrainingProgressRow[]>([])),
    enabled: !!dogId,
  });
}

/** Progress per module, the module in progress, and the streak – derived from one progress query. */
export function useTrainingSummary(dogId: string | null) {
  const catalog = useTrainingCatalog();
  const progress = useTrainingProgress(dogId);

  return useMemo(() => {
    const modules: TrainingModule[] = catalog.data ?? [];
    return {
      modules,
      ...summarizeTraining(modules, progress.data ?? []),
      isLoading: catalog.isLoading || progress.isLoading,
      error: catalog.error ?? progress.error,
      /** The catalog (and, for a dog, its progress) is cached. */
      hasData: catalog.data !== undefined && (!dogId || progress.data !== undefined),
      refetch: () => Promise.all([catalog.refetch(), progress.refetch()]),
    };
  }, [catalog, progress, dogId]);
}

/** Marks a module step done or not done, optimistically, rolling back with a toast on failure. */
export function useToggleStep(dogId: string) {
  const client = useQueryClient();
  const key = queryKeys.trainingProgress(dogId);
  return useMutation({
    mutationFn: ({ stepId, completed }: { stepId: string; completed: boolean }) => setStepCompleted(dogId, stepId, completed),
    onMutate: async ({ stepId, completed }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<TrainingProgressRow[]>(key);
      client.setQueryData<TrainingProgressRow[]>(key, (old = []) =>
        completed
          ? [{ id: `optimistic-${stepId}`, user_id: '', dog_id: dogId, step_id: stepId, completed_at: new Date().toISOString() }, ...old]
          : old.filter((row) => row.step_id !== stepId),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      client.setQueryData(key, context?.previous);
      showToast(toUserMessage(error, 'לא הצלחנו לשמור את ההתקדמות. נסו שוב.'));
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
