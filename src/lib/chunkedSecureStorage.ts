// Session storage on top of the platform keystore (iOS Keychain / Android Keystore via expo-secure-store).
//
// A Supabase session (JWT + refresh token + user) is usually 2–4 KB, while some iOS releases reject keystore
// values above ~2 KB. Values are therefore split into small chunks. Writes are crash-safe: chunks go under
// a new generation and the manifest naming that generation is written last, so an interrupted write leaves
// the previous value intact instead of a corrupted mix.

/** The subset of expo-secure-store used here; injectable for tests. */
export interface SecureBackend {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/** Where sessions lived before (unencrypted); read once to migrate, then cleared. */
export interface LegacyBackend {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// 600 UTF-16 units encode to at most 1800 UTF-8 bytes – under the ~2048-byte limit even for Hebrew text.
export const CHUNK_SIZE = 600;

interface Manifest {
  generation: number;
  chunks: number;
}

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const sanitize = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
const manifestKey = (key: string) => `${sanitize(key)}.manifest`;
const chunkKey = (key: string, generation: number, index: number) => `${sanitize(key)}.g${generation}.${index}`;

function parseManifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && 'generation' in value && 'chunks' in value) {
      const { generation, chunks } = value;
      if (Number.isInteger(generation) && Number.isInteger(chunks) && (chunks as number) >= 0) {
        return { generation: generation as number, chunks: chunks as number };
      }
    }
  } catch {
    // fall through: treat as absent
  }
  return null;
}

export function createChunkedSecureStorage(
  secure: SecureBackend,
  options: { legacy?: LegacyBackend; onError?: (error: unknown, operation: string) => void } = {},
): StorageAdapter {
  const report = options.onError ?? (() => undefined);

  async function deleteGeneration(key: string, manifest: Manifest) {
    await Promise.all(Array.from({ length: manifest.chunks }, (_, i) => secure.deleteItemAsync(chunkKey(key, manifest.generation, i))));
  }

  async function read(key: string): Promise<string | null> {
    const manifest = parseManifest(await secure.getItemAsync(manifestKey(key)));
    if (!manifest) return null;
    const parts = await Promise.all(Array.from({ length: manifest.chunks }, (_, i) => secure.getItemAsync(chunkKey(key, manifest.generation, i))));
    if (parts.some((part) => part === null)) throw new Error('secure storage: missing chunk');
    return parts.join('');
  }

  async function write(key: string, value: string): Promise<void> {
    const previous = parseManifest(await secure.getItemAsync(manifestKey(key)));
    const next: Manifest = { generation: (previous?.generation ?? 0) + 1, chunks: Math.ceil(value.length / CHUNK_SIZE) };
    for (let i = 0; i < next.chunks; i += 1) {
      await secure.setItemAsync(chunkKey(key, next.generation, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await secure.setItemAsync(manifestKey(key), JSON.stringify(next)); // commit point
    if (previous) await deleteGeneration(key, previous);
  }

  async function remove(key: string): Promise<void> {
    const manifest = parseManifest(await secure.getItemAsync(manifestKey(key)));
    await secure.deleteItemAsync(manifestKey(key));
    if (manifest) await deleteGeneration(key, manifest);
  }

  return {
    async getItem(key) {
      try {
        const value = await read(key);
        if (value !== null || !options.legacy) return value;
        // One-time migration of a session saved unencrypted by an earlier version.
        const legacyValue = await options.legacy.getItem(key);
        if (legacyValue === null) return null;
        await write(key, legacyValue);
        await options.legacy.removeItem(key);
        return legacyValue;
      } catch (error) {
        // An unreadable keystore entry must not crash start-up: behave as signed out.
        report(error, 'read');
        return null;
      }
    },
    async setItem(key, value) {
      try {
        await write(key, value);
      } catch (error) {
        // The session stays valid in memory; it just won't survive a restart.
        report(error, 'write');
      }
    },
    async removeItem(key) {
      try {
        await remove(key);
        await options.legacy?.removeItem(key);
      } catch (error) {
        report(error, 'remove');
      }
    },
  };
}
