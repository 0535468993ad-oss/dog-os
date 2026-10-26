import type { PersonaDefinition, PersonaId } from '../types';
import { CLINICAL_PRO } from './personas/clinical';
import { ANXIOUS_MOM, TEL_AVIV_HIPSTER } from './personas/soft';
import { ARS, DRILL_SERGEANT } from './personas/street';

/** Every persona, by id. CLINICAL_PRO is the default and the emergency voice. */
export const PERSONAS: Readonly<Record<PersonaId, PersonaDefinition>> = { ARS, TEL_AVIV_HIPSTER, DRILL_SERGEANT, ANXIOUS_MOM, CLINICAL_PRO };

export const DEFAULT_PERSONA: PersonaId = 'CLINICAL_PRO';

/** The switcher's order. */
export const PERSONA_ORDER: readonly PersonaId[] = ['CLINICAL_PRO', 'ARS', 'TEL_AVIV_HIPSTER', 'DRILL_SERGEANT', 'ANXIOUS_MOM'];

/** The honour contract, signed with a three-second press. */
export const CONTRACT_TITLE_HE = 'חוזה הכבוד עם {dogName}';
export const CONTRACT_TERMS_HE: readonly string[] = [
  'להתאמן עם {dogName} כמה דקות כמעט בכל יום – קצר, ממוקד ומהנה.',
  'ללמד בתגמול ובסבלנות, בלי כוח ובלי כעס.',
  'לסיים כל אימון בהצלחה, ולהוריד קושי כשקשה.',
  'לרשום רק אימונים שבאמת קרו.',
];
