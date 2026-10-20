import { devSkipConsentGate } from '@/config/env';
import type { ConsentType, UserConsentRow } from '@/lib/database.types';
import { isSchemaMissingError } from '@/lib/supabaseErrors';

import { LEGAL_VERSIONS, type ConsentBearingType } from '../documents';
import type { AiSharing, ConsentDecision, ConsentGate, ConsentGateOptions, NewConsentRow } from '../types';

const REQUIRED: ConsentBearingType[] = ['terms_of_service', 'privacy_policy', 'ai_disclaimer'];

/** Version stamped on optional consent decisions (they have no document of their own). */
const OPTIONAL_CONSENT_VERSION = '2026-10-18';

/** Latest decision per consent type (rows are newest first). */
export function latestConsents(rows: UserConsentRow[]): Partial<Record<ConsentType, UserConsentRow>> {
  const latest: Partial<Record<ConsentType, UserConsentRow>> = {};
  for (const row of rows) latest[row.consent_type] ??= row;
  return latest;
}

/** Document version a decision on this consent type is recorded against. */
export function consentDocumentVersion(type: ConsentType): string {
  return type === 'analytics' || type === 'ai_data_sharing' ? OPTIONAL_CONSENT_VERSION : LEGAL_VERSIONS[type];
}

/** Rows to insert for one decision, each stamped with its document version. */
export function buildConsentRows(decision: ConsentDecision): NewConsentRow[] {
  return decision.types.map((type) => ({
    consent_type: type,
    document_version: consentDocumentVersion(type),
    granted: decision.granted,
    source: decision.source,
  }));
}

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
