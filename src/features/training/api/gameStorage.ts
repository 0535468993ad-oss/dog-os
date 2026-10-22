import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState } from '../types';
import { parseGameState } from '../utils/gameState';

// The offline cache of each dog's gamification state. Supabase is the source of truth (see
// gameRemote.ts); the cache lets the tab open and score sessions without a connection, and is
// reconciled with the server on the next load. It is deliberately not cleared on sign-out.

const KEY_PREFIX = 'training-game:v1:';

/** The cached state for a dog, or null when nothing usable is cached. */
export async function loadCachedGame(dogId: string): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${dogId}`);
  if (raw === null) return null;
  try {
    return parseGameState(JSON.parse(raw));
  } catch {
    // Corrupt JSON: treat as no cache, so the server copy wins.
    return null;
  }
}

/** Caches a dog's state on the device. */
export async function saveCachedGame(dogId: string, state: GameState): Promise<void> {
  await AsyncStorage.setItem(`${KEY_PREFIX}${dogId}`, JSON.stringify(state));
}
