import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';

import { addJournalEntry, deleteJournalEntry, fetchJournalPage, fetchRecentJournal } from '../api/journalApi';
import { flattenJournalPages, JOURNAL_PAGE_SIZE, nextJournalOffset, RECENT_JOURNAL_LIMIT } from '../utils/journalPaging';

/** The journal list, paged from the server (15 entries per page), flattened with one copy per entry. */
export function useJournalFeed(dogId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.journalFeed(dogId ?? 'none'),
    queryFn: ({ pageParam }) => fetchJournalPage(dogId ?? '', pageParam, JOURNAL_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, pages) => nextJournalOffset(pages),
    select: (data) => flattenJournalPages(data.pages),
    enabled: !!dogId,
  });
}

/** The newest `limit` entries (dashboard and advisor context: 20; the vet report asks for its 30), not the whole journal. */
export function useRecentJournal(dogId: string | null, limit: number = RECENT_JOURNAL_LIMIT) {
  return useQuery({
    queryKey: queryKeys.journalRecent(dogId ?? 'none', limit),
    queryFn: () => fetchRecentJournal(dogId ?? '', limit),
    enabled: !!dogId,
  });
}

/** Adding and deleting entries; both refresh every journal query for the dog (the list and the recent entries). */
export function useJournalMutations(dogId: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.journal(dogId) });
  const add = useMutation({ mutationFn: addJournalEntry, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteJournalEntry, onSuccess: invalidate });
  return { add, remove };
}
