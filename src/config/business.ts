// Legal entity details shown in the footer, legal documents and accessibility statement.
// TODO(owner): replace every placeholder with the registered details before publishing.
// Values in square brackets are rendered as-is so missing details are visible, never invented.

export interface BusinessInfo {
  /** Registered name (as in the Israeli Registrar of Companies / Tax Authority). */
  legalName: string;
  /** ח.פ. / ע.מ. / ת.ז. of the registered business. */
  registrationNumber: string;
  email: string;
  privacyEmail: string;
  address: string;
  phone: string;
  /** Accessibility coordinator (רכז/ת נגישות) – required in the accessibility statement. */
  accessibilityCoordinator: { name: string; email: string; phone: string };
  /** Governing-law jurisdiction for the Terms of Service. */
  jurisdiction: string;
}

export const business: BusinessInfo = {
  legalName: '[שם העסק הרשום]',
  registrationNumber: '[ח.פ./ע.מ.]',
  email: '[support@example.com]',
  privacyEmail: '[privacy@example.com]',
  address: '[כתובת רשומה]',
  phone: '[טלפון]',
  accessibilityCoordinator: {
    name: '[שם רכז/ת הנגישות]',
    email: '[accessibility@example.com]',
    phone: '[טלפון]',
  },
  jurisdiction: 'בתי המשפט המוסמכים במחוז תל אביב-יפו',
};

export const isBusinessInfoComplete = !JSON.stringify(business).includes('[');
