import { CHUNK_SIZE, createChunkedSecureStorage, type LegacyBackend, type SecureBackend } from '../chunkedSecureStorage';

const KEY = 'sb-project-auth-token';

/** In-memory keystore that enforces SecureStore's key rules and the ~2 KB value limit. */
function memoryKeystore() {
  const items = new Map<string, string>();
  const backend: jest.Mocked<SecureBackend> = {
    getItemAsync: jest.fn(async (key: string) => items.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error(`invalid key ${key}`);
      if (new TextEncoder().encode(value).length > 2048) throw new Error('value too large');
      items.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      items.delete(key);
    }),
  };
  return { items, backend };
}

function memoryLegacy(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const backend: jest.Mocked<LegacyBackend> = {
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      items.delete(key);
    }),
  };
  return { items, backend };
}

// A realistic session: long JWTs plus user metadata with Hebrew (multi-byte) text.
const session = JSON.stringify({
  access_token: 'a'.repeat(1200),
  refresh_token: 'r'.repeat(40),
  user: { id: 'u1', email: 'owner@example.com', user_metadata: { display_name: 'בעלים של כלב '.repeat(80) } },
});

describe('chunked secure storage', () => {
  it('round-trips a value larger than one keystore entry', async () => {
    const { backend } = memoryKeystore();
    const storage = createChunkedSecureStorage(backend);

    await storage.setItem(KEY, session);
    expect(session.length).toBeGreaterThan(CHUNK_SIZE * 3);
    await expect(storage.getItem(KEY)).resolves.toBe(session);
  });

  it('keeps every entry under the keystore size limit, even for Hebrew text', async () => {
    const { items, backend } = memoryKeystore();
    await createChunkedSecureStorage(backend).setItem(KEY, 'ש'.repeat(5000));
    for (const value of items.values()) expect(new TextEncoder().encode(value).length).toBeLessThanOrEqual(2048);
  });

  it('replaces the previous value and cleans up its chunks', async () => {
    const { items, backend } = memoryKeystore();
    const storage = createChunkedSecureStorage(backend);

    await storage.setItem(KEY, session);
    await storage.setItem(KEY, 'short');
    await expect(storage.getItem(KEY)).resolves.toBe('short');
    expect([...items.keys()].sort()).toEqual([`${KEY}.g2.0`, `${KEY}.manifest`]);
  });

  it('keeps the previous value when a write is interrupted', async () => {
    const { backend } = memoryKeystore();
    const storage = createChunkedSecureStorage(backend, { onError: () => undefined });
    await storage.setItem(KEY, 'old-session');

    let writes = 0;
    const original = backend.setItemAsync.getMockImplementation()!;
    backend.setItemAsync.mockImplementation(async (key, value) => {
      writes += 1;
      if (writes === 2) throw new Error('device locked'); // dies part-way through the new chunks
      return original(key, value);
    });
    await storage.setItem(KEY, session);

    await expect(storage.getItem(KEY)).resolves.toBe('old-session');
  });

  it('removes the value and all its chunks', async () => {
    const { items, backend } = memoryKeystore();
    const storage = createChunkedSecureStorage(backend);
    await storage.setItem(KEY, session);

    await storage.removeItem(KEY);
    expect(items.size).toBe(0);
    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });

  it('sanitizes keys to the characters the keystore accepts', async () => {
    const { backend } = memoryKeystore();
    const storage = createChunkedSecureStorage(backend);
    await storage.setItem('sb:project/auth token', 'v');
    await expect(storage.getItem('sb:project/auth token')).resolves.toBe('v');
  });

  describe('migration from unencrypted storage', () => {
    it('moves a legacy session into the keystore and deletes the plaintext copy', async () => {
      const { items, backend } = memoryKeystore();
      const legacy = memoryLegacy({ [KEY]: session });
      const storage = createChunkedSecureStorage(backend, { legacy: legacy.backend });

      await expect(storage.getItem(KEY)).resolves.toBe(session);
      expect(legacy.items.has(KEY)).toBe(false);
      expect(items.has(`${KEY}.manifest`)).toBe(true);
      await expect(storage.getItem(KEY)).resolves.toBe(session); // now served from the keystore
    });

    it('also clears a legacy copy on sign-out', async () => {
      const legacy = memoryLegacy({ [KEY]: session });
      await createChunkedSecureStorage(memoryKeystore().backend, { legacy: legacy.backend }).removeItem(KEY);
      expect(legacy.items.has(KEY)).toBe(false);
    });
  });

  describe('failures', () => {
    it('treats an unreadable keystore as signed out instead of crashing, and reports it', async () => {
      const { backend } = memoryKeystore();
      backend.getItemAsync.mockRejectedValue(new Error('keystore corrupted'));
      const onError = jest.fn();

      await expect(createChunkedSecureStorage(backend, { onError }).getItem(KEY)).resolves.toBeNull();
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'read');
    });

    it('treats a missing chunk as no session', async () => {
      const { items, backend } = memoryKeystore();
      const storage = createChunkedSecureStorage(backend, { onError: () => undefined });
      await storage.setItem(KEY, session);
      items.delete(`${KEY}.g1.1`);
      await expect(storage.getItem(KEY)).resolves.toBeNull();
    });

    it('reports a failed write without throwing into the auth client', async () => {
      const { backend } = memoryKeystore();
      backend.setItemAsync.mockRejectedValue(new Error('no space'));
      const onError = jest.fn();

      await expect(createChunkedSecureStorage(backend, { onError }).setItem(KEY, 'v')).resolves.toBeUndefined();
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'write');
    });
  });
});
