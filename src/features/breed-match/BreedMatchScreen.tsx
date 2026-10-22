import { Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Screen, SegmentedControl } from '@/components/ui';

import { AdultAdoptionGuide } from './components/AdultAdoptionGuide';
import { LifestyleQuiz } from './components/LifestyleQuiz';
import { VolhardEvaluator } from './components/VolhardEvaluator';

type Tab = 'match' | 'puppy' | 'adult';

// Segment labels stay short (one line on a phone); each tab opens with its full title.
const TABS: readonly { value: Tab; label: string; title: string; intro: string }[] = [
  { value: 'match', label: 'התאמת גזע', title: 'התאמת גזע חכמה', intro: 'שש שאלות על החיים שלכם כמו שהם באמת – ונראה אילו גזעים יפרחו אצלכם, ואילו יסבלו.' },
  { value: 'puppy', label: 'מבחן גור', title: 'מבחן אופי לגור (Volhard PAT)', intro: 'עשרה מבחנים קצרים לגור בן 7 שבועות: סף גירוי, ויסות תסכול, התאוששות ודחפים.' },
  { value: 'adult', label: 'כלב בוגר', title: 'אבחון כלב בוגר ומדריך אימוץ', intro: 'איך פוגשים כלב מקלט בהוגנות ובבטחה, ואיפה מוצאים כלב – ממגדל אחראי או מעמותה.' },
];

/** Breed match hub: lifestyle-based breed ranking, the Volhard puppy test, and adult adoption. */
export function BreedMatchScreen() {
  const [tab, setTab] = useState<Tab>('match');
  const current = TABS.find((entry) => entry.value === tab) ?? TABS[0];

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'בחירת כלב' }} />
      <SegmentedControl segments={TABS} value={tab} onChange={setTab} accessibilityLabel="אזורי בחירת הכלב" />
      {current ? (
        <>
          <AppText variant="title" accessibilityRole="header">
            {current.title}
          </AppText>
          <AppText color="textSecondary">{current.intro}</AppText>
        </>
      ) : null}
      {tab === 'match' ? <LifestyleQuiz /> : null}
      {tab === 'puppy' ? <VolhardEvaluator /> : null}
      {tab === 'adult' ? <AdultAdoptionGuide /> : null}
    </Screen>
  );
}
