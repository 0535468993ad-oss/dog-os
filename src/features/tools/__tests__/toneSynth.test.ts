// The whistle's tone generator and the sound lab's volume curve.
import { WHISTLE_MAX_HZ, WHISTLE_MIN_HZ } from '../data/whistle';
import { SOUND_TRIGGERS } from '../data/soundLab';
import { buildToneWav, clampFrequency, toBase64, volumeForStep } from '../utils/toneSynth';

const text = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));

describe('toneSynth', () => {
  it('keeps the whistle inside 15–22 kHz, on 500 Hz steps', () => {
    expect(clampFrequency(10_000)).toBe(WHISTLE_MIN_HZ);
    expect(clampFrequency(30_000)).toBe(WHISTLE_MAX_HZ);
    expect(clampFrequency(16_240)).toBe(16_000);
  });

  it('builds a valid 16-bit mono PCM WAV of the right length', () => {
    const wav = buildToneWav({ frequencyHz: 18_000, durationMs: 100, volume: 0.5 }, 44_100);
    const view = new DataView(wav.buffer);
    expect(text(wav, 0, 4)).toBe('RIFF');
    expect(text(wav, 8, 4)).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(44_100);
    expect(view.getUint32(40, true)).toBe(4410 * 2);
    expect(wav.length).toBe(44 + 4410 * 2);
    // Faded in: the first sample is silent.
    expect(view.getInt16(44, true)).toBe(0);
  });

  it('encodes base64 like the standard', () => {
    expect(toBase64(new Uint8Array([77, 97, 110]))).toBe('TWFu');
    expect(toBase64(new Uint8Array([77, 97]))).toBe('TWE=');
    expect(toBase64(new Uint8Array([77]))).toBe('TQ==');
  });

  it('raises volume on a 40 dB log curve, quietest first', () => {
    expect(volumeForStep(1, 10)).toBe(0.01);
    expect(volumeForStep(10, 10)).toBe(1);
    const steps = Array.from({ length: 10 }, (_, i) => volumeForStep(i + 1, 10));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });

  it('ships no unlicensed recordings', () => {
    expect(SOUND_TRIGGERS.map((trigger) => trigger.id)).toEqual(['thunderstorm', 'fireworks', 'sirens', 'baby-cry']);
    expect(SOUND_TRIGGERS.every((trigger) => trigger.source === null)).toBe(true);
  });
});
