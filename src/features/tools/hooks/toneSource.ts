import { File, Paths } from 'expo-file-system';

// Native: the generated WAV is written to the cache directory and played from there (AVPlayer and
// ExoPlayer don't take data: URIs). The web variant is toneSource.web.ts.

/** A playable URI for the WAV bytes, cached per frequency. */
export function toneUri(bytes: Uint8Array, name: string): string {
  const file = new File(Paths.cache, `${name}.wav`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}
