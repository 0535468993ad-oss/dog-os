import { makeConsent } from '@/test/fixtures';

import { aiSharing, consentDocumentVersion, consentGate, latestConsents, missingConsents } from '../consents';
import { isLegalDocId, LEGAL_DOC_IDS, LEGAL_DOCUMENTS, LEGAL_VERSIONS } from '../documents';

const allCurrent = () => [
  makeConsent({ id: 'a', consent_type: 'terms_of_service', document_version: LEGAL_VERSIONS.terms_of_service }),
  makeConsent({ id: 'b', consent_type: 'privacy_policy', document_version: LEGAL_VERSIONS.privacy_policy }),
  makeConsent({ id: 'c', consent_type: 'ai_disclaimer', document_version: LEGAL_VERSIONS.ai_disclaimer }),
];

describe('latestConsents', () => {
  it('keeps the newest decision per type (rows arrive newest first)', () => {
    const newest = makeConsent({ id: 'new', granted: false });
    const older = makeConsent({ id: 'old', granted: true });
    expect(latestConsents([newest, older]).terms_of_service?.id).toBe('new');
  });
});

describe('missingConsents', () => {
  it('requires every document when nothing is recorded', () => {
    expect(missingConsents([])).toEqual(['terms_of_service', 'privacy_policy', 'ai_disclaimer']);
  });

  it('is satisfied by current, granted versions', () => {
    expect(missingConsents(allCurrent())).toEqual([]);
  });

  it('asks again after a document version changes', () => {
    const rows = allCurrent().map((row) => (row.consent_type === 'privacy_policy' ? { ...row, document_version: '2020-01-01' } : row));
    expect(missingConsents(rows)).toEqual(['privacy_policy']);
  });

  it('treats a later withdrawal as missing', () => {
    const withdrawal = makeConsent({ id: 'w', consent_type: 'ai_disclaimer', document_version: LEGAL_VERSIONS.ai_disclaimer, granted: false });
    expect(missingConsents([withdrawal, ...allCurrent()])).toEqual(['ai_disclaimer']);
  });

  it('ignores optional consents such as analytics', () => {
    expect(missingConsents([makeConsent({ id: 'x', consent_type: 'analytics', granted: false }), ...allCurrent()])).toEqual([]);
  });
});

describe('consentGate (fails closed)', () => {
  const PRODUCTION = { allowDevBypass: false, skipWhenMissing: false };
  const DEVELOPMENT = { allowDevBypass: true, skipWhenMissing: false };
  const DEV_WITH_SKIP = { allowDevBypass: true, skipWhenMissing: true };

  it('waits while loading', () => {
    expect(consentGate({ data: undefined, isError: false }, PRODUCTION)).toEqual({ state: 'loading' });
  });

  it('blocks with an error state when consent cannot be verified', () => {
    expect(consentGate({ data: undefined, isError: true }, PRODUCTION)).toEqual({ state: 'error' });
  });

  it('prefers cached data over a later refetch error', () => {
    expect(consentGate({ data: allCurrent(), isError: true }, PRODUCTION)).toEqual({ state: 'satisfied' });
  });

  it('lists what is missing', () => {
    expect(consentGate({ data: [], isError: false }, PRODUCTION)).toEqual({ state: 'required', missing: ['terms_of_service', 'privacy_policy', 'ai_disclaimer'] });
  });

  // An empty but existing table is the normal first-run case: the user is asked, nothing is auto-granted.
  it('asks a user with no records to consent rather than granting defaults', () => {
    expect(consentGate({ data: [], isError: false }, DEVELOPMENT).state).toBe('required');
  });

  describe('when the consent table has not been migrated', () => {
    const missingTable = { code: 'PGRST205', message: "Could not find the table 'public.user_consents' in the schema cache" };

    it('lets development builds through with a warning state', () => {
      expect(consentGate({ data: undefined, isError: true, error: missingTable }, DEVELOPMENT)).toEqual({ state: 'bypassed_dev', reason: 'schema_missing' });
    });

    it('still fails closed in production builds', () => {
      expect(consentGate({ data: undefined, isError: true, error: missingTable }, PRODUCTION)).toEqual({ state: 'error' });
    });
  });

  describe('development skip switch (EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE)', () => {
    it('skips the consent screen for a user without records', () => {
      expect(consentGate({ data: [], isError: false }, DEV_WITH_SKIP)).toEqual({ state: 'bypassed_dev', reason: 'dev_flag' });
    });

    it('does not turn a real failure into a pass', () => {
      expect(consentGate({ data: undefined, isError: true, error: new TypeError('Network request failed') }, DEV_WITH_SKIP)).toEqual({ state: 'error' });
    });

    it('changes nothing for a user who already consented', () => {
      expect(consentGate({ data: allCurrent(), isError: false }, DEV_WITH_SKIP)).toEqual({ state: 'satisfied' });
    });
  });

  it('fails closed on other errors even in development', () => {
    const network = new TypeError('Network request failed');
    expect(consentGate({ data: undefined, isError: true, error: network }, DEVELOPMENT)).toEqual({ state: 'error' });
    expect(consentGate({ data: undefined, isError: true, error: { code: '42501' } }, DEVELOPMENT)).toEqual({ state: 'error' });
  });
});

describe('aiSharing (opt-out)', () => {
  it('is allowed by default, when nothing was decided', () => {
    expect(aiSharing({ data: allCurrent() })).toBe('allowed');
  });

  it('is off after the user opts out', () => {
    const optOut = makeConsent({ id: 'o', consent_type: 'ai_data_sharing', granted: false });
    expect(aiSharing({ data: [optOut, ...allCurrent()] })).toBe('opted_out');
  });

  it('follows the latest decision when the user opts back in', () => {
    const optIn = makeConsent({ id: 'i', consent_type: 'ai_data_sharing', granted: true });
    const optOut = makeConsent({ id: 'o', consent_type: 'ai_data_sharing', granted: false });
    expect(aiSharing({ data: [optIn, optOut] })).toBe('allowed');
  });

  it('is unknown – so nothing is sent – until consents load', () => {
    expect(aiSharing({ data: undefined })).toBe('unknown');
  });

  it('stamps optional decisions with a dated version', () => {
    expect(consentDocumentVersion('ai_data_sharing')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(consentDocumentVersion('privacy_policy')).toBe(LEGAL_VERSIONS.privacy_policy);
  });
});

describe('legal documents', () => {
  it('validates document ids from route params', () => {
    expect(isLegalDocId('privacy')).toBe(true);
    expect(isLegalDocId('licenses')).toBe(true);
    expect(isLegalDocId('constructor')).toBe(false); // inherited object keys must not count
    expect(isLegalDocId(undefined)).toBe(false);
  });

  it.each(LEGAL_DOC_IDS)('%s has a dated version and non-empty sections', (id) => {
    const doc = LEGAL_DOCUMENTS[id];
    expect(doc.id).toBe(id);
    expect(doc.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(doc.sections.length).toBeGreaterThan(0);
    for (const section of doc.sections) expect(section.paragraphs.length).toBeGreaterThan(0);
  });
});
