import type { BreedProfile } from '../types';
import { COMPANION_PROFILES } from './profiles/companionProfiles';
import { GUARDIAN_PROFILES } from './profiles/guardianProfiles';
import { GUNDOG_PROFILES } from './profiles/gundogProfiles';
import { HERDING_PROFILES } from './profiles/herdingProfiles';
import { HOUND_PROFILES } from './profiles/houndProfiles';
import { MOLOSSER_SCHNAUZER_PROFILES } from './profiles/molosserSchnauzerProfiles';
import { PASTORAL_PROFILES } from './profiles/pastoralProfiles';
import { SPITZ_PRIMITIVE_PROFILES } from './profiles/spitzPrimitiveProfiles';
import { SPITZ_TERRIER_PROFILES } from './profiles/spitzTerrierProfiles';
import { TERRIER_DACHSHUND_PROFILES } from './profiles/terrierDachshundProfiles';
import { TOY_COMPANION_PROFILES } from './profiles/toyCompanionProfiles';
import { WORKING_GUARDIAN_PROFILES } from './profiles/workingGuardianProfiles';

/** The 75-breed catalog: the twelve foundational profiles first, then the rest by FCI group (content split across data/profiles/). */
export const BREED_PROFILES: readonly BreedProfile[] = [
  ...HERDING_PROFILES,
  ...GUARDIAN_PROFILES,
  ...COMPANION_PROFILES,
  ...SPITZ_TERRIER_PROFILES,
  ...PASTORAL_PROFILES,
  ...WORKING_GUARDIAN_PROFILES,
  ...MOLOSSER_SCHNAUZER_PROFILES,
  ...TERRIER_DACHSHUND_PROFILES,
  ...SPITZ_PRIMITIVE_PROFILES,
  ...HOUND_PROFILES,
  ...GUNDOG_PROFILES,
  ...TOY_COMPANION_PROFILES,
];

/** Where every number and claim in the profiles comes from, shown on the detail screen. */
export const BREED_SOURCES_HE =
  'סטנדרטים של ה־FCI (מספר הסטנדרט מופיע בפרופיל כשהוא נבדק מול רשימת ה־FCI), דירוג הרישום של ה־AKC לשנת 2024 בארצות הברית (לגזעים שה־AKC מדרג), וספרות וטרינרית על מחלות תורשתיות בגזעים. הדירוגים הם נטיות של הגזע – לא תחזית לכלב מסוים.';
