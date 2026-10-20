import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';

import { addJournalEntry, deleteJournalEntry, fetchJournal } from './api';

export function useJournal(dogId: string | null) {
  return useQuery({ queryKey: queryKeys.journal(dogId ?? 'none'), queryFn: () => fetchJournal(dogId!), enabled: !!dogId });
}

export function useJournalMutations(dogId: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.journal(dogId) });
  const add = useMutation({ mutationFn: addJournalEntry, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteJournalEntry, onSuccess: invalidate });
  return { add, remove };
}
