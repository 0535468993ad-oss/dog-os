import { createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { reportError } from '@/utils/errors';

import { SOUND_TRIGGERS, VOLUME_STEPS } from '../data/soundLab';
import type { SoundTriggerId } from '../types';
import { volumeForStep } from '../utils/toneSynth';

type Player = ReturnType<typeof createAudioPlayer>;

/** The sound lab: which sound, the fader step, and play/pause of its licensed recording (when installed). */
export function useSoundLab() {
  const [triggerId, setTriggerId] = useState<SoundTriggerId>('thunderstorm');
  const [step, setStepState] = useState(1);
  const [playing, setPlaying] = useState(false);
  // The player is an imperative object, owned here rather than by a hook, so its volume can be set.
  const player = useRef<Player | null>(null);
  const trigger = SOUND_TRIGGERS.find((entry) => entry.id === triggerId) ?? SOUND_TRIGGERS[0];
  const source = trigger?.source ?? null;

  /** Stops and releases the current player. */
  const stop = () => {
    player.current?.remove();
    player.current = null;
    setPlaying(false);
  };

  useEffect(() => () => player.current?.remove(), []);

  return {
    trigger,
    triggerId,
    step,
    hasRecording: source !== null,
    playing,
    /** Switching sounds always restarts from the quietest step. */
    selectTrigger: (id: SoundTriggerId) => {
      stop();
      setTriggerId(id);
      setStepState(1);
    },
    setStep: (next: number) => {
      const clamped = Math.min(VOLUME_STEPS, Math.max(1, Math.round(next)));
      setStepState(clamped);
      if (player.current) player.current.volume = volumeForStep(clamped, VOLUME_STEPS);
    },
    toggle: () => {
      if (source === null) return;
      if (playing) {
        stop();
        return;
      }
      try {
        const next = createAudioPlayer(source);
        next.loop = true;
        next.volume = volumeForStep(step, VOLUME_STEPS);
        next.play();
        player.current = next;
        setPlaying(true);
      } catch (error) {
        reportError(error, 'tools/sound-lab-play');
      }
    },
  };
}
