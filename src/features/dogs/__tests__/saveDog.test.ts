import type { ProfileRow } from '@/lib/database.types';
import { makeDog, TEST_USER_ID } from '@/test/fixtures';

import { saveDog, type DogInput, type SaveDogOps } from '../api';

const input: DogInput = { name: 'רקסי', breed: 'מעורב', breedId: null, birthDate: '2024-01-01', size: 'medium', weightKg: 12 };
const photo = { uri: 'file:///photo.jpg', base64: 'AAAA', mimeType: 'image/jpeg' };

function profile(activeDogId: string | null): ProfileRow {
  return { id: TEST_USER_ID, display_name: null, active_dog_id: activeDogId, onboarding_completed: false, created_at: '', updated_at: '' };
}

function makeOps(overrides: Partial<SaveDogOps> = {}): jest.Mocked<SaveDogOps> {
  const created = makeDog({ id: 'new-dog' });
  return {
    createDog: jest.fn().mockResolvedValue(created),
    updateDog: jest.fn().mockResolvedValue(makeDog({ id: 'existing' })),
    uploadDogPhoto: jest.fn().mockResolvedValue({ ...created, profile_photo_path: 'u/new-dog.jpg' }),
    getProfile: jest.fn().mockResolvedValue(profile(null)),
    setActiveDog: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<SaveDogOps>;
}

describe('saveDog', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it('creates a first dog and makes it the active one', async () => {
    const ops = makeOps();
    const result = await saveDog(TEST_USER_ID, { input }, ops);
    expect(result).toEqual({ dog: expect.objectContaining({ id: 'new-dog' }), photoFailed: false });
    expect(ops.setActiveDog).toHaveBeenCalledWith(TEST_USER_ID, 'new-dog');
  });

  it('keeps the current active dog when adding another', async () => {
    const ops = makeOps({ getProfile: jest.fn().mockResolvedValue(profile('older-dog')) });
    await saveDog(TEST_USER_ID, { input }, ops);
    expect(ops.setActiveDog).not.toHaveBeenCalled();
  });

  // Regression: a failed upload used to fail the whole save, so a retry created the dog twice.
  it('reports a failed photo upload without failing the save', async () => {
    const ops = makeOps({ uploadDogPhoto: jest.fn().mockRejectedValue(new Error('storage down')) });
    const result = await saveDog(TEST_USER_ID, { input, photo }, ops);
    expect(result.photoFailed).toBe(true);
    expect(result.dog.id).toBe('new-dog');
    expect(ops.createDog).toHaveBeenCalledTimes(1);
  });

  it('does not fail the save when activating the new dog fails', async () => {
    const ops = makeOps({ setActiveDog: jest.fn().mockRejectedValue(new Error('network')) });
    await expect(saveDog(TEST_USER_ID, { input }, ops)).resolves.toMatchObject({ photoFailed: false });
  });

  it('returns the dog with its uploaded photo', async () => {
    const ops = makeOps();
    const result = await saveDog(TEST_USER_ID, { input, photo }, ops);
    expect(result.dog.profile_photo_path).toBe('u/new-dog.jpg');
    expect(ops.uploadDogPhoto).toHaveBeenCalledWith(TEST_USER_ID, expect.objectContaining({ id: 'new-dog' }), photo);
  });

  it('updates an existing dog without touching the active dog', async () => {
    const ops = makeOps();
    await saveDog(TEST_USER_ID, { id: 'existing', input }, ops);
    expect(ops.updateDog).toHaveBeenCalledWith('existing', input);
    expect(ops.createDog).not.toHaveBeenCalled();
    expect(ops.getProfile).not.toHaveBeenCalled();
  });

  it('fails when the dog itself cannot be saved', async () => {
    const ops = makeOps({ createDog: jest.fn().mockRejectedValue(new Error('rls')) });
    await expect(saveDog(TEST_USER_ID, { input, photo }, ops)).rejects.toThrow('rls');
    expect(ops.uploadDogPhoto).not.toHaveBeenCalled();
  });
});
