import type { BreedProfile } from '../types';
import { COMPANION_PROFILES } from './profiles/companionProfiles';
import { GUARDIAN_PROFILES } from './profiles/guardianProfiles';
import { HERDING_PROFILES } from './profiles/herdingProfiles';
import { SPITZ_TERRIER_PROFILES } from './profiles/spitzTerrierProfiles';

/** The twelve foundational breed profiles (content split across data/profiles/). */
export const BREED_PROFILES: readonly BreedProfile[] = [...HERDING_PROFILES, ...GUARDIAN_PROFILES, ...COMPANION_PROFILES, ...SPITZ_TERRIER_PROFILES];

/** Where every number and claim in the profiles comes from, shown on the detail screen. */
export const BREED_SOURCES_HE =
  'סטנדרטים של ה־FCI (מספר הסטנדרט מופיע בכל פרופיל), דירוג הרישום של ה־AKC לשנת 2024 בארצות הברית, וספרות וטרינרית על מחלות תורשתיות בגזעים. הדירוגים הם נטיות של הגזע – לא תחזית לכלב מסוים.';
