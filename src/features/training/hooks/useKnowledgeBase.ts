import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryClient';
import { toUserMessage } from '@/utils/errors';

import { fetchBookmarks, fetchKnowledgeBase, setBookmarked } from '../api/knowledge';
import { CATALOG_STALE_MS } from './useTrainingSummary';

/** The encyclopedia articles. */
export function useKnowledgeBase() {
  return useQuery({ queryKey: queryKeys.knowledgeBase, queryFn: fetchKnowledgeBase, staleTime: CATALOG_STALE_MS });
}

/** The signed-in user's bookmarked article ids. */
export function useBookmarks() {
  const user = useUser();
  return useQuery({ queryKey: queryKeys.knowledgeBookmarks(user.id), queryFn: fetchBookmarks });
}

/** Bookmarks or un-bookmarks an article, optimistically, rolling back with a toast on failure. */
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
