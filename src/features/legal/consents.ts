import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { devSkipConsentGate } from '@/config/env';
import type { ConsentSource, ConsentType, UserConsentRow } from '@/lib/database.types';
import { queryKeys } from '@/lib/queryClient';
import { isSchemaMissingError, supabase, unwrap } from '@/lib/supabase';

import { LEGAL_VERSIONS, type ConsentBearingType } from './documents';

const REQUIRED: ConsentBearingType[] = ['terms_of_service', 'privacy_policy', 'ai_disclaimer'];

async function fetchConsents(): Promise<UserConsentRow[]> {
  return unwrap(await supabase.from('user_consents').select('*').order('created_at', { ascending: false }));
}

/** Latest decision per consent type (rows are newest first). */
export function latestConsents(rows: UserConsentRow[]): Partial<Record<ConsentType, UserConsentRow>> {
  const latest: Partial<Record<ConsentType, UserConsentRow>> = {};
  for (const row of rows) latest[row.consent_type] ??= row;
  return latest;
}

/** Version stamped on optional consent decisions (they have no document of their own). */
const OPTIONAL_CONSENT_VERSION = '2026-10-18';

export function consentDocumentVersion(type: ConsentType): string {
  return type === 'analytics' || type === 'ai_data_sharing' ? OPTIONAL_CONSENT_VERSION : LEGAL_VERSIONS[type];
}

export type AiSharing = 'allowed' | 'opted_out' | 'unknown';

/**
 * Whether the user's data may be sent to the AI provider. Opt-out: allowed unless the latest decision
 * withdrew it. "unknown" (consents not loaded or unavailable) means nothing is sent – the server enforces
 * the same rule with public.ai_data_sharing_allowed(), this only keeps the UI honest.
 */
export function aiSharing(query: { data: UserConsentRow[] | undefined }): AiSharing {
  if (!query.data) return 'unknown';
  const latest = latestConsents(query.data).ai_data_sharing;
  return latest && !latest.granted ? 'opted_out' : 'allowed';
}

/** Which required documents the user has not yet accepted in their current version. */
export function missingConsents(rows: UserConsentRow[]): ConsentBearingType[] {
  const latest = latestConsents(rows);
  return REQUIRED.filter((type) => {
    const row = latest[type];
    return !row || !row.granted || row.document_version !== LEGAL_VERSIONS[type];
  });
}

export type ConsentGate =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'required'; missing: ConsentBearingType[] }
  | { state: 'satisfied' }
  /**
   * Development only, always shown with a warning banner: the consent table hasn't been migrated
   * ('schema_missing'), or EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE=1 skips asking a user without records ('dev_flag').
   */
  | { state: 'bypassed_dev'; reason: 'schema_missing' | 'dev_flag' };

export interface ConsentGateOptions {
  /** Let development builds through when the consent table doesn't exist yet. */
  allowDevBypass: boolean;
  /** Development switch: don't stop at the consent screen when records are missing. */
  skipWhenMissing: boolean;
}

const DEFAULT_GATE_OPTIONS: ConsentGateOptions = { allowDevBypass: __DEV__, skipWhenMissing: devSkipConsentGate };

/**
 * Whether a signed-in user may use the app. Fails closed: if consent can't be verified (lookup error) the
 * user is held at a retry screen rather than let in – processing must rest on a recorded consent (GDPR
 * art. 7(1), Privacy Protection Law). Cached data wins over a later background refetch error.
 *
 * Development builds have two exceptions so local work isn't blocked: a database where the consent table
 * doesn't exist yet, and the EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE switch. Both load the app with a visible
 * warning. Consent is never auto-granted – no record is written – and production builds always fail closed
 * (both options are false there). Other errors (network, permissions) fail closed even in development.
 */
export function consentGate(
  query: { data: UserConsentRow[] | undefined; isError: boolean; error?: unknown },
  options: ConsentGateOptions = DEFAULT_GATE_OPTIONS,
): ConsentGate {
  if (query.data) {
    const missing = missingConsents(query.data);
    if (!missing.length) return { state: 'satisfied' };
    return options.skipWhenMissing ? { state: 'bypassed_dev', reason: 'dev_flag' } : { state: 'required', missing };
  }
  if (!query.isError) return { state: 'loading' };
  return options.allowDevBypass && isSchemaMissingError(query.error) ? { state: 'bypassed_dev', reason: 'schema_missing' } : { state: 'error' };
}

export function useConsents(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.consents(userId ?? 'anonymous'),
    queryFn: fetchConsents,
    enabled: !!userId,
  });
}

export function useRecordConsents(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { types: ConsentType[]; granted: boolean; source: ConsentSource }) => {
      const rows = input.types.map((type) => ({
        consent_type: type,
        document_version: consentDocumentVersion(type),
        granted: input.granted,
        source: input.source,
      }));
      unwrap(await supabase.from('user_consents').insert(rows));
    },
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: queryKeys.consents(userId) });
      // Opting out stops AI work immediately: drop cached AI results so nothing keeps showing them.
      if (input.types.includes('ai_data_sharing') && !input.granted) client.removeQueries({ queryKey: queryKeys.allInsights });
    },
  });
}

/** AI-sharing state for the signed-in user. */
export function useAiSharing(userId: string): AiSharing {
  return aiSharing(useConsents(userId));
}
