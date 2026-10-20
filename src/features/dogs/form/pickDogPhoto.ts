import * as ImagePicker from 'expo-image-picker';

import { reportError } from '@/utils/errors';

import type { PickedPhoto } from '../api';

export type PhotoPickResult = { status: 'picked'; photo: PickedPhoto } | { status: 'cancelled' } | { status: 'failed' };

/** Opens the photo library for a square, compressed profile photo. Never throws: failures are reported. */
export async function pickDogPhoto(): Promise<PhotoPickResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { status: 'cancelled' };
    return { status: 'picked', photo: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType } };
  } catch (error) {
    // e.g. photo library permission denied, or the picker failed to open.
    reportError(error, 'dog-photo-picker');
    return { status: 'failed' };
  }
}
