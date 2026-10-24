import { toBase64 } from '../utils/toneSynth';

// Web: browsers play a data: URI directly, and there is no cache directory to write to.

/** A playable URI for the WAV bytes. */
export function toneUri(bytes: Uint8Array, _name: string): string {
  return `data:audio/wav;base64,${toBase64(bytes)}`;
}
