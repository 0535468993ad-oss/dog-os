import { BREED_PROFILES } from '../data/breedsSeedData';
import type { BreedProfile } from '../types';

// Breed facts other features rely on: the profile for a dog's breed id, and the work-drive flag the
// training engine shows for high-drive working breeds.

export const WORK_DRIVE_FLAG_HE = 'דחף עבודה גבוה – דורש פריקת אנרגיה מוחית לפני תרגול משמעת.';

/** The profile for a breed id (dogs.breed_id), if one exists. */
export function findBreedProfile(breedId: string | null | undefined): BreedProfile | undefined {
  return breedId ? BREED_PROFILES.find((profile) => profile.id === breedId) : undefined;
}

/** A working or guarding breed (FCI 1–2) with high prey drive, high handler focus and two or more hours of daily energy. */
export function isHighDriveWorkingBreed(profile: BreedProfile): boolean {
  const { drives, fci } = profile;
  return fci !== null && (fci.group === 1 || fci.group === 2) && drives.preyDrive >= 4 && drives.handlerFocusBiddability >= 4 && drives.energyStaminaHoursDaily >= 2;
}
