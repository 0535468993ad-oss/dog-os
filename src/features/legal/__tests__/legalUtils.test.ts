import { LEGAL_VERSIONS } from '../documents';
import { buildConsentRows } from '../utils/consentRules';
import { formatIls, perInstallment } from '../utils/pricing';

describe('buildConsentRows', () => {
  it('stamps each type with its document version', () => {
    expect(buildConsentRows({ types: ['terms_of_service', 'ai_data_sharing'], granted: true, source: 'signup' })).toEqual([
      { consent_type: 'terms_of_service', document_version: LEGAL_VERSIONS.terms_of_service, granted: true, source: 'signup' },
      { consent_type: 'ai_data_sharing', document_version: '2026-10-18', granted: true, source: 'signup' },
    ]);
  });

  it('records a withdrawal', () => {
    expect(buildConsentRows({ types: ['analytics'], granted: false, source: 'settings' })).toEqual([
      expect.objectContaining({ consent_type: 'analytics', granted: false }),
    ]);
  });
});

describe('pricing', () => {
  it('rounds each installment to agorot', () => {
    expect(perInstallment(100, 3)).toBe(33.33);
    expect(perInstallment(120, 12)).toBe(10);
  });

  it('formats shekels', () => {
    expect(formatIls(1234.5)).toMatch(/1,234\.50/);
    expect(formatIls(1234.5)).toContain('₪');
  });
});
