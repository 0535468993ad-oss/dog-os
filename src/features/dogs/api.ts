import type { DogRow, DogSize, ProfileRow } from '@/lib/database.types';
import { supabase, unwrap } from '@/lib/supabase';
import { reportError } from '@/utils/errors';

import { assertPhotoAllowed } from './photoFile';

export const PHOTO_BUCKET = 'dog-photos';

export interface DogInput {
  name: string;
  breed: string;
  breedId: string | null;
  birthDate: string;
  size: DogSize;
  weightKg: number | null;
}

const toRow = (input: DogInput) => ({
  name: input.name,
  breed: input.breed,
  breed_id: input.breedId,
  birth_date: input.birthDate,
  size: input.size,
  weight_kg: input.weightKg,
});

export async function listDogs(): Promise<DogRow[]> {
  return unwrap(await supabase.from('dogs').select('*').order('created_at'));
}

export async function createDog(input: DogInput): Promise<DogRow> {
  return unwrap(await supabase.from('dogs').insert(toRow(input)).select().single());
}

export async function updateDog(id: string, input: DogInput): Promise<DogRow> {
  return unwrap(await supabase.from('dogs').update(toRow(input)).eq('id', id).select().single());
}

export async function deleteDog(dog: DogRow): Promise<void> {
  unwrap(await supabase.from('dogs').delete().eq('id', dog.id));
  if (dog.profile_photo_path) {
    // Best effort: the row is already gone, an orphaned photo is only a storage leak.
    await supabase.storage.from(PHOTO_BUCKET).remove([dog.profile_photo_path]);
  }
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', userId).maybeSingle());
}

export async function setActiveDog(userId: string, dogId: string | null): Promise<void> {
  unwrap(await supabase.from('profiles').update({ active_dog_id: dogId }).eq('id', userId));
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface PickedPhoto {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
}

/** Uploads to dog-photos/<userId>/<dogId>-<ts>.<ext> (the folder RLS allows) and links it to the dog. */
export async function uploadDogPhoto(userId: string, dog: DogRow, photo: PickedPhoto): Promise<DogRow> {
  const body = photo.base64 ? base64ToBytes(photo.base64) : await (await fetch(photo.uri)).arrayBuffer();
  const { contentType, ext } = assertPhotoAllowed(photo.mimeType, body.byteLength);
  const path = `${userId}/${dog.id}-${Date.now()}.${ext}`;

  unwrap(await supabase.storage.from(PHOTO_BUCKET).upload(path, body, { contentType, upsert: false }));
  let updated: DogRow;
  try {
    updated = unwrap(await supabase.from('dogs').update({ profile_photo_path: path }).eq('id', dog.id).select().single());
  } catch (error) {
    // Don't leave an unreferenced copy of the user's photo in storage.
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw error;
  }
  if (dog.profile_photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([dog.profile_photo_path]);
  return updated;
}

export interface SaveDogOps {
  createDog: typeof createDog;
  updateDog: typeof updateDog;
  uploadDogPhoto: typeof uploadDogPhoto;
  getProfile: typeof getProfile;
  setActiveDog: typeof setActiveDog;
}

const defaultOps: SaveDogOps = { createDog, updateDog, uploadDogPhoto, getProfile, setActiveDog };

export interface SaveDogResult {
  dog: DogRow;
  /** The dog was saved but its new photo was not; the form reports it without failing the save. */
  photoFailed: boolean;
}

/**
 * Creates or updates a dog, then uploads its photo. Once the dog row exists the save has succeeded: a
 * photo failure is reported, never thrown, so retrying can't create the same dog twice. A first dog
 * becomes the active one.
 */
export async function saveDog(
  userId: string,
  { id, input, photo }: { id?: string; input: DogInput; photo?: PickedPhoto | null },
  ops: SaveDogOps = defaultOps,
): Promise<SaveDogResult> {
  let dog = id ? await ops.updateDog(id, input) : await ops.createDog(input);

  if (!id) {
    // Non-critical after the insert (useActiveDog falls back to the first dog), so it can't fail the save.
    try {
      const profile = await ops.getProfile(userId);
      if (!profile?.active_dog_id) await ops.setActiveDog(userId, dog.id);
    } catch (error) {
      reportError(error, 'dog-set-active');
    }
  }

  let photoFailed = false;
  if (photo) {
    try {
      dog = await ops.uploadDogPhoto(userId, dog, photo);
    } catch (error) {
      reportError(error, 'dog-photo-upload');
      photoFailed = true;
    }
  }
  return { dog, photoFailed };
}

export async function getPhotoUrl(path: string): Promise<string> {
  const { signedUrl } = unwrap(await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60));
  return signedUrl;
}
