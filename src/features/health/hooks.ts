import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';

import { fetchHealth, fetchVetKnowledge, logWeight } from './api';

/** All health records of one dog: vaccinations, weights, feeding plan and medical notes. */
export function useHealth(dogId: string | null) {
  return useQuery({
    queryKey: queryKeys.health(dogId ?? 'none'),
    queryFn: () => fetchHealth(dogId!),
    enabled: !!dogId,
  });
}

/** Wraps a health write; refreshes the dog's health data (and dogs, since weight updates the dog). */
export function useHealthMutation<TVars>(dogId: string, mutationFn: (vars: TVars) => Promise<void>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.health(dogId) });
      void client.invalidateQueries({ queryKey: queryKeys.allDogs });
    },
  });
}

/** Logs a weigh-in for the dog (one per date; the database keeps the dog's current weight in sync). */
export function useLogWeight(dogId: string) {
  return useHealthMutation(dogId, (vars: { kg: number; date: string }) => logWeight(dogId, vars.kg, vars.date));
}

/** The veterinary encyclopedia, symptoms and symptom→condition map (shared content, cached for an hour). */
export function useVetKnowledge() {
  return useQuery({ queryKey: queryKeys.vetKnowledge, queryFn: fetchVetKnowledge, staleTime: 60 * 60 * 1000 });
}
