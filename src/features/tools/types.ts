// Contracts for the in-app reward tools: the sound desensitization lab and the high-frequency whistle.

export type SoundTriggerId = 'thunderstorm' | 'fireworks' | 'sirens' | 'baby-cry';

export interface SoundTrigger {
  id: SoundTriggerId;
  titleHe: string;
  /** Why this sound matters for dogs in Israel. */
  whyHe: string;
  /** Ionicons glyph name. */
  icon: string;
  /**
   * A bundled, licensed recording (require('…') asset id). null until one is added: the app never ships
   * stock audio without a recorded license.
   */
  source: number | null;
}

export interface ToneSpec {
  frequencyHz: number;
  durationMs: number;
  /** 0–1 */
  volume: number;
}
