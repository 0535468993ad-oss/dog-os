import { AppText, ErrorState, LoadingState } from '@/components/ui';
import type { SupportRequestRow } from '@/lib/database.types';
import { toUserMessage } from '@/utils/errors';

import { SupportRequestCard } from './SupportRequestCard';

interface SupportRequestListProps {
  requests: SupportRequestRow[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

/** The user's past requests, with loading, error and empty states. */
export function SupportRequestList({ requests, isLoading, error, onRetry }: SupportRequestListProps) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={toUserMessage(error)} onRetry={onRetry} />;
  if (!requests?.length) return <AppText color="textSecondary">עדיין לא שלחתם פניות.</AppText>;
  return (
    <>
      {requests.map((request) => (
        <SupportRequestCard key={request.id} request={request} />
      ))}
    </>
  );
}
