import { useState } from 'react';

import { AppText, Screen, SegmentedControl } from '@/components/ui';

import { EncyclopediaTab } from './encyclopedia/EncyclopediaTab';
import { RecordsTab } from './records/RecordsTab';
import { SymptomCheckerTab } from './symptoms/SymptomCheckerTab';

type Section = 'records' | 'encyclopedia' | 'symptoms';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'records', label: 'המעקב שלי' },
  { value: 'encyclopedia', label: 'אנציקלופדיה' },
  { value: 'symptoms', label: 'בודק סימפטומים' },
];

/** Health tab shell: parallax title and the switch between records, encyclopedia and symptom checker. */
export function HealthScreen() {
  const [section, setSection] = useState<Section>('records');

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          בריאות ותזונה
        </AppText>
      }
    >
      <SegmentedControl accessibilityLabel="אזור בבריאות" value={section} onChange={setSection} segments={SECTIONS} />
      {section === 'records' ? <RecordsTab /> : section === 'encyclopedia' ? <EncyclopediaTab /> : <SymptomCheckerTab />}
    </Screen>
  );
}
