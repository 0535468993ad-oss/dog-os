import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { showToast } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import type { TrainingProgressRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { computeStreak, toIsoDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { fetchBookmarks, fetchKnowledgeBase, fetchTrainingCatalog, fetchTrainingProgress, setBookmarked, setStepCompleted, type TrainingModule } from './api';

const CATALOG_STALE_MS = 60 * 60 * 1000; // shared content changes rarely

export function useTrainingCatalog() {
  return useQuery({ queryKey: queryKeys.trainingCatalog, queryFn: fetchTrainingCatalog, staleTime: CATALOG_STALE_MS });
}

export function useTrainingProgress(dogId: string | null) {
  return useQuery({
    queryKey: queryKeys.trainingProgress(dogId ?? 'none'),
    queryFn: () => fetchTrainingProgress(dogId!),
    enabled: !!dogId,
  });
}

export interface ModuleProgress {
  completed: number;
  total: number;
  ratio: number;
}

/** Progress per module, the module in progress, and the streak – derived from one progress query. */
export function useTrainingSummary(dogId: string | null) {
  const catalog = useTrainingCatalog();
  const progress = useTrainingProgress(dogId);

  return useMemo(() => {
    const modules: TrainingModule[] = catalog.data ?? [];
    const rows: TrainingProgressRow[] = progress.data ?? [];
    const completedSteps = new Set(rows.map((row) => row.step_id));
    const lastActivity = new Map<string, string>();
    const moduleOfStep = new Map(modules.flatMap((m) => m.steps.map((s) => [s.id, m.id] as const)));
    for (const row of rows) {
      const moduleId = moduleOfStep.get(row.step_id);
      if (moduleId && !lastActivity.has(moduleId)) lastActivity.set(moduleId, row.completed_at);
    }

    const perModule = new Map<string, ModuleProgress>(
      modules.map((m) => {
        const completed = m.steps.filter((s) => completedSteps.has(s.id)).length;
        return [m.id, { completed, total: m.steps.length, ratio: m.steps.length ? completed / m.steps.length : 0 }];
      }),
    );

    const activeModule =
      modules
        .filter((m) => {
          const p = perModule.get(m.id);
          return p && p.completed > 0 && p.completed < p.total;
        })
        .sort((a, b) => (lastActivity.get(b.id) ?? '').localeCompare(lastActivity.get(a.id) ?? ''))[0] ?? null;

    const nextModule = activeModule ?? modules.find((m) => (perModule.get(m.id)?.completed ?? 0) === 0) ?? null;
    const streak = computeStreak(rows.map((row) => toIsoDate(new Date(row.completed_at))));
    const completedModules = modules.filter((m) => {
      const p = perModule.get(m.id);
      return p && p.total > 0 && p.completed === p.total;
    }).length;

    return {
      modules,
      completedSteps,
      perModule,
      activeModule,
      nextModule,
      streak,
      completedModules,
      isLoading: catalog.isLoading || progress.isLoading,
      error: catalog.error ?? progress.error,
      /** The catalog (and, for a dog, its progress) is cached. */
      hasData: catalog.data !== undefined && (!dogId || progress.data !== undefined),
      refetch: () => Promise.all([catalog.refetch(), progress.refetch()]),
    };
  }, [catalog, progress, dogId]);
}

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

export function useKnowledgeBase() {
  return useQuery({ queryKey: queryKeys.knowledgeBase, queryFn: fetchKnowledgeBase, staleTime: CATALOG_STALE_MS });
}

export function useBookmarks() {
  const user = useUser();
  return useQuery({ queryKey: queryKeys.knowledgeBookmarks(user.id), queryFn: fetchBookmarks });
}

export function useToggleBookmark() {
  const user = useUser();
  const client = useQueryClient();
  const key = queryKeys.knowledgeBookmarks(user.id);
  return useMutation({
    mutationFn: ({ articleId, bookmarked }: { articleId: string; bookmarked: boolean }) => setBookmarked(articleId, bookmarked),
    onMutate: async ({ articleId, bookmarked }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<string[]>(key);
      client.setQueryData<string[]>(key, (old = []) => (bookmarked ? [...old, articleId] : old.filter((id) => id !== articleId)));
      return { previous };
    },
    onError: (error, _vars, context) => {
      client.setQueryData(key, context?.previous);
      showToast(toUserMessage(error, 'לא הצלחנו לעדכן את המאמרים השמורים. נסו שוב.'));
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}
