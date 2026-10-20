import type { ConsentSource, ConsentType } from '@/lib/database.types';

import type { ConsentBearingType } from './documents';

/** Whether the user's data may go to the AI provider; "unknown" until consents load (nothing is sent). */
export type AiSharing = 'allowed' | 'opted_out' | 'unknown';

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

/** One consent decision as the user makes it (one or more types, granted or withdrawn). */
export interface ConsentDecision {
  types: ConsentType[];
  granted: boolean;
  source: ConsentSource;
}

/** A row ready for insertion into user_consents (user_id is set by the database). */
export interface NewConsentRow {
  consent_type: ConsentType;
  document_version: string;
  granted: boolean;
  source: ConsentSource;
}
