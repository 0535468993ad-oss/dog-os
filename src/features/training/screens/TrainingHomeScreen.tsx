import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AppText, Screen, SegmentedControl } from '@/components/ui';

import type { SessionMode } from '@/features/gamification/types';

import { AcademyTab } from '../components/AcademyTab';
import { asCommandId, CommandsTab } from '../components/CommandsTab';
import { EncyclopediaTab } from '../components/EncyclopediaTab';
import type { MasterCommandId } from '../types';

type Section = 'commands' | 'academy' | 'encyclopedia';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'commands', label: 'פקודות' },
  { value: 'academy', label: 'אקדמיה' },
  { value: 'encyclopedia', label: 'אנציקלופדיה' },
];

/** Training tab shell. A deep link (?command=recall, &mode=rescue) remounts the sections on the commands tab with that command open. */
export function TrainingHomeScreen() {
  const params = useLocalSearchParams<{ command?: string; mode?: string }>();
  const linked = asCommandId(typeof params.command === 'string' ? params.command : null);
  const linkedMode = params.mode === 'rescue' ? 'STREAK_RESCUE' : 'STANDARD';

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          אימונים
        </AppText>
      }
    >
      <TrainingSections key={`${linked ?? ''}-${linkedMode}`} linked={linked} linkedMode={linkedMode} />
    </Screen>
  );
}

/** The section switch and the active section: the master commands, the academy modules and the encyclopedia. */
function TrainingSections({ linked, linkedMode }: { linked: MasterCommandId | null; linkedMode: SessionMode }) {
  const [section, setSection] = useState<Section>('commands');
  return (
    <>
      <SegmentedControl accessibilityLabel="אזור באימונים" value={section} onChange={setSection} segments={SECTIONS} />
      {section === 'commands' ? <CommandsTab initialCommandId={linked} initialMode={linkedMode} /> : null}
      {section === 'academy' ? <AcademyTab /> : null}
      {section === 'encyclopedia' ? <EncyclopediaTab /> : null}
    </>
  );
}
