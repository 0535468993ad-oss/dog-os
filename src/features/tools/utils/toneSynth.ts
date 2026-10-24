import { WHISTLE_MAX_HZ, WHISTLE_MIN_HZ, WHISTLE_SAMPLE_RATE, WHISTLE_STEP_HZ } from '../data/whistle';
import type { ToneSpec } from '../types';

// Pure audio helpers: a sine tone as a 16-bit mono PCM WAV file, base64 for data URIs, and the volume
// curve for the sound lab's fader. No audio APIs here – the hooks play what these build.

/** Snaps a frequency to the whistle's range and step. */
export function clampFrequency(hz: number): number {
  const stepped = Math.round(hz / WHISTLE_STEP_HZ) * WHISTLE_STEP_HZ;
  return Math.min(WHISTLE_MAX_HZ, Math.max(WHISTLE_MIN_HZ, stepped));
}

/** A sine tone as WAV bytes, with 10 ms fades so it starts and stops without a click. */
export function buildToneWav({ frequencyHz, durationMs, volume }: ToneSpec, sampleRate = WHISTLE_SAMPLE_RATE): Uint8Array {
  const samples = Math.max(1, Math.round((sampleRate * durationMs) / 1000));
  const fade = Math.min(Math.round(sampleRate * 0.01), Math.floor(samples / 2));
  const amplitude = Math.max(0, Math.min(1, volume)) * 32767;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, 'data');
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i += 1) {
    const envelope = Math.min(1, i / Math.max(1, fade), (samples - 1 - i) / Math.max(1, fade));
    const value = Math.round(Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate) * amplitude * envelope);
    view.setInt16(44 + i * 2, value, true);
  }
  return bytes;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Standard base64 (no Buffer/btoa dependency, so it runs the same on every platform). */
export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += ALPHABET[(triple >> 18) & 63];
    out += ALPHABET[(triple >> 12) & 63];
    out += b === undefined ? '=' : ALPHABET[(triple >> 6) & 63];
    out += c === undefined ? '=' : ALPHABET[triple & 63];
  }
  return out;
}

/** Fader step → player volume on a 40 dB log scale: step 1 ≈ 1%, the top step 100%. */
export function volumeForStep(step: number, steps: number): number {
  const clamped = Math.min(steps, Math.max(1, Math.round(step)));
  const db = -40 + ((clamped - 1) * 40) / Math.max(1, steps - 1);
  return Math.round(10 ** (db / 20) * 1000) / 1000;
}
