import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';

import { fetchHealth, loadVetKnowledge, loadVetPhone, logWeight, saveVetPhone } from './api';
import { normalizeVetPhone } from './logic/vetContact';

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

/**
 * The veterinary encyclopedia, symptoms and symptom→condition map (shared content, fresh for an hour). Falls
 * back to the device copy offline; that copy counts as stale at once, so the next refetch retries the network.
 */
export function useVetKnowledge() {
  return useQuery({
    queryKey: queryKeys.vetKnowledge,
    queryFn: loadVetKnowledge,
    staleTime: (query) => (query.state.data?.offline ? 0 : 60 * 60 * 1000),
  });
}

/** The vet number saved on this device (null when none). */
export function useVetPhone() {
  return useQuery({ queryKey: queryKeys.vetPhone, queryFn: loadVetPhone, staleTime: Infinity });
}

/** Saves a typed vet number after normalizing it; rejects with INVALID_PHONE when it can't be dialled. */
export function useSaveVetPhone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: string | null) => {
      if (input === null) return saveVetPhone(null);
      const phone = normalizeVetPhone(input);
      if (!phone) throw new Error('INVALID_PHONE');
      return saveVetPhone(phone);
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.vetPhone }),
  });
}
