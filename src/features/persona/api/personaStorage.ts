import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PERSONA } from '../data/personasData';
import type { PersonaSettings } from '../types';
import { isPersonaId } from '../utils/personaCopy';

// The persona choice and the signed honour contracts live on the device: they are a display preference,
// not user data the server needs. Validated on read, so a corrupt value falls back to the default.

const KEY = 'persona:v1';
const DOG_ID = /^[0-9a-z-]{1,64}$/i;

export const DEFAULT_PERSONA_SETTINGS: PersonaSettings = { personaId: DEFAULT_PERSONA, contracts: {} };

/** Parses stored settings, falling back field by field. */
export function parsePersonaSettings(raw: unknown): PersonaSettings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return DEFAULT_PERSONA_SETTINGS;
  const value = raw as Record<string, unknown>;
  const contracts: Record<string, string> = {};
  if (typeof value.contracts === 'object' && value.contracts !== null && !Array.isArray(value.contracts)) {
    for (const [dogId, at] of Object.entries(value.contracts)) {
      if (DOG_ID.test(dogId) && typeof at === 'string' && !Number.isNaN(Date.parse(at))) contracts[dogId] = at;
    }
  }
  return { personaId: isPersonaId(value.personaId) ? value.personaId : DEFAULT_PERSONA, contracts };
}

/** The saved settings, or the defaults. */
export async function loadPersonaSettings(): Promise<PersonaSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) return DEFAULT_PERSONA_SETTINGS;
  try {
    return parsePersonaSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_PERSONA_SETTINGS;
  }
}

/** Saves the settings. */
export async function savePersonaSettings(settings: PersonaSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
