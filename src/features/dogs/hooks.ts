import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryClient';
import { toUserMessage } from '@/utils/errors';

import { deleteDog, getPhotoUrl, getProfile, listDogs, saveDog, setActiveDog, type DogInput, type PickedPhoto } from './api';

export function useDogs() {
  const user = useUser();
  return useQuery({ queryKey: queryKeys.dogs(user.id), queryFn: listDogs });
}

export function useProfile() {
  const user = useUser();
  return useQuery({ queryKey: queryKeys.profile(user.id), queryFn: () => getProfile(user.id) });
}

/** The dog every feature works on: profile.active_dog_id, falling back to the first dog. */
export function useActiveDog() {
  const dogs = useDogs();
  const profile = useProfile();
  const list = dogs.data ?? [];
  const activeDog = list.find((dog) => dog.id === profile.data?.active_dog_id) ?? list[0] ?? null;

  return {
    dogs: list,
    activeDog,
    isLoading: dogs.isLoading || profile.isLoading,
    error: dogs.error ?? profile.error,
    /** The dogs list is cached (a failed refresh then shows it as stale, not as an error page). */
    hasData: dogs.data !== undefined,
    refetch: () => Promise.all([dogs.refetch(), profile.refetch()]),
  };
}

export function useSetActiveDog() {
  const user = useUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (dogId: string) => setActiveDog(user.id, dogId),
    onMutate: async (dogId) => {
      // Optimistic: switching dogs should feel instant.
      await client.cancelQueries({ queryKey: queryKeys.profile(user.id) });
      const previous = client.getQueryData(queryKeys.profile(user.id));
      client.setQueryData(queryKeys.profile(user.id), (old: Awaited<ReturnType<typeof getProfile>>) =>
        old ? { ...old, active_dog_id: dogId } : old,
      );
      return { previous };
    },
    onError: (error, _dogId, context) => {
      client.setQueryData(queryKeys.profile(user.id), context?.previous);
      showToast(toUserMessage(error, 'לא הצלחנו להחליף את הכלב הפעיל. נסו שוב.'));
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.profile(user.id) }),
  });
}

export function useSaveDog() {
  const user = useUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id?: string; input: DogInput; photo?: PickedPhoto | null }) => saveDog(user.id, vars),
    // Settled, not success: a failure part-way may still have written rows.
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.dogs(user.id) });
      void client.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
    },
  });
}

export function useDeleteDog() {
  const user = useUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteDog,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.dogs(user.id) });
      void client.invalidateQueries({ queryKey: queryKeys.profile(user.id) });
    },
  });
}

export function useDogPhotoUrl(path: string | null) {
  return useQuery({
    queryKey: queryKeys.dogPhoto(path ?? ''),
    queryFn: () => getPhotoUrl(path!),
    enabled: !!path,
    staleTime: 50 * 60 * 1000, // signed URLs last an hour
    // Dropped before the hour is up, so an avatar that re-mounts later never shows an expired URL from the cache.
    gcTime: 55 * 60 * 1000,
  });
}
