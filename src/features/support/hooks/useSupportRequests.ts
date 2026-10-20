import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUser } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryClient';

import { createSupportRequest, fetchSupportRequests } from '../api/supportRequests';

/** The signed-in user's support requests. */
export function useSupportRequests() {
  const user = useUser();
  return useQuery({ queryKey: queryKeys.supportRequests(user.id), queryFn: fetchSupportRequests });
}

/** Sends a request and refreshes the list. */
export function useCreateSupportRequest() {
  const user = useUser();
  const client = useQueryClient();
  return useMutation({
    mutationFn: createSupportRequest,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.supportRequests(user.id) }),
  });
}
