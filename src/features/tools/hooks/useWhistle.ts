import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';

import { reportError } from '@/utils/errors';

import { WHISTLE_BURST_MS, WHISTLE_DEFAULT_HZ, WHISTLE_VOLUME } from '../data/whistle';
import { buildToneWav, clampFrequency } from '../utils/toneSynth';
import { toneUri } from './toneSource';

type Player = ReturnType<typeof createAudioPlayer>;

/** The whistle: a chosen frequency, and a short blast with a haptic pulse on each press. */
export function useWhistle() {
  const [frequencyHz, setFrequency] = useState(WHISTLE_DEFAULT_HZ);
  const [failed, setFailed] = useState(false);
  const player = useRef<Player | null>(null);

  // Plays even with the ringer switch off: the owner pressed the button on purpose.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch((error: unknown) => reportError(error, 'tools/whistle-mode'));
    return () => player.current?.remove();
  }, []);

  return {
    frequencyHz,
    failed,
    setFrequency: (hz: number) => setFrequency(clampFrequency(hz)),
    /** One blast at the current frequency. */
    blast: () => {
      try {
        const uri = toneUri(buildToneWav({ frequencyHz, durationMs: WHISTLE_BURST_MS, volume: WHISTLE_VOLUME }), `whistle-${frequencyHz}`);
        player.current?.remove();
        const next = createAudioPlayer(uri);
        player.current = next;
        next.play();
        setFailed(false);
      } catch (error) {
        reportError(error, 'tools/whistle-play');
        setFailed(true);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => undefined);
    },
  };
}
