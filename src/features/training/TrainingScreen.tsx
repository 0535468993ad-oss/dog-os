import { useState } from 'react';

import { AppText, Screen, SegmentedControl } from '@/components/ui';

import { AcademyTab } from './academy/AcademyTab';
import { EncyclopediaTab } from './encyclopedia/EncyclopediaTab';

type Section = 'academy' | 'encyclopedia';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'academy', label: 'אקדמיה' },
  { value: 'encyclopedia', label: 'אנציקלופדיה' },
];

/** Training tab shell: title and the switch between the academy and the encyclopedia. */
export function TrainingScreen() {
  const [section, setSection] = useState<Section>('academy');

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          אימונים
        </AppText>
      }
    >
      <SegmentedControl accessibilityLabel="אזור באימונים" value={section} onChange={setSection} segments={SECTIONS} />
      {section === 'academy' ? <AcademyTab /> : <EncyclopediaTab />}
    </Screen>
  );
}
