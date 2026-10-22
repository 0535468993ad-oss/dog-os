import { useState } from 'react';

import { AppText, Screen, SegmentedControl } from '@/components/ui';

import { AcademyTab } from './components/AcademyTab';
import { CommandsTab } from './components/CommandsTab';
import { EncyclopediaTab } from './components/EncyclopediaTab';

type Section = 'commands' | 'academy' | 'encyclopedia';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'commands', label: 'פקודות' },
  { value: 'academy', label: 'אקדמיה' },
  { value: 'encyclopedia', label: 'אנציקלופדיה' },
];

/** Training tab shell: the master commands, the academy modules and the encyclopedia. */
export function TrainingScreen() {
  const [section, setSection] = useState<Section>('commands');

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          אימונים
        </AppText>
      }
    >
      <SegmentedControl accessibilityLabel="אזור באימונים" value={section} onChange={setSection} segments={SECTIONS} />
      {section === 'commands' ? <CommandsTab /> : null}
      {section === 'academy' ? <AcademyTab /> : null}
      {section === 'encyclopedia' ? <EncyclopediaTab /> : null}
    </Screen>
  );
}
