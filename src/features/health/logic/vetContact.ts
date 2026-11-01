// Emergency contact helpers: the owner's saved vet number and a map search for an open emergency clinic.

/** A typed phone number cleaned to digits (with an optional leading +), or null when it can't be dialled. */
export function normalizeVetPhone(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned) ? cleaned : null;
}

/** The dialler URL for a normalized number. */
export function telUrl(phone: string): string {
  return `tel:${phone}`;
}

/** Google Maps search for a 24-hour vet near the device (Maps uses the phone's location when allowed). */
export const NEARBY_EMERGENCY_VET_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('וטרינר חירום 24 שעות')}`;
