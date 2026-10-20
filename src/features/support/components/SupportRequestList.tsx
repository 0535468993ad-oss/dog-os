import { AppText, ErrorState, LoadingState, StaleDataNotice } from '@/components/ui';
import type { SupportRequestRow } from '@/lib/database.types';
import { cacheState } from '@/lib/queryView';
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
  const view = cacheState(error, requests !== undefined);
  if (view === 'failed') return <ErrorState message={toUserMessage(error)} onRetry={onRetry} />;
  const notice = <StaleDataNotice visible={view === 'stale'} onRetry={onRetry} />;
  if (!requests?.length) {
    return (
      <>
        {notice}
        <AppText color="textSecondary">עדיין לא שלחתם פניות.</AppText>
      </>
    );
  }
  return (
    <>
      {notice}
      {requests.map((request) => (
        <SupportRequestCard key={request.id} request={request} />
      ))}
    </>
  );
}
