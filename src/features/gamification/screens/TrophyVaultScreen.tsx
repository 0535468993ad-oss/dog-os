import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Card, ErrorState, LoadingState, Screen, SegmentedControl, showToast } from '@/components/ui';
import { useActiveDog } from '@/features/dogs/hooks';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { BadgeGrid } from '../components/BadgeGrid';
import { GameStatusCard } from '../components/GameStatusCard';
import { RankRoadmap } from '../components/RankRoadmap';
import { RewardToolsPanel } from '../components/RewardToolsPanel';
import { useGamification } from '../hooks/useGamification';
import type { ClaimRefusal } from '../services/gamificationEngine';
import { badgesView, rankAt, rewardsView, toGamificationState } from '../utils/view';

type Tab = 'ranks' | 'badges' | 'tools';

const TABS: readonly { value: Tab; label: string }[] = [
  { value: 'ranks', label: 'דרגות ופרסים' },
  { value: 'badges', label: 'תגים' },
  { value: 'tools', label: 'הכלים שלי' },
];

const REFUSALS: Readonly<Record<ClaimRefusal, string>> = {
  UNKNOWN: 'הפרס לא נמצא.',
  ALREADY_CLAIMED: 'הפרס כבר אצלכם.',
  COMING_SOON: 'הפרס הזה עוד בהכנה.',
  LEVEL_TOO_LOW: 'עוד לא הגעתם לדרגה של הפרס הזה.',
};

/** The trophy vault: the rank ladder with its rewards, the badges, and the unlocked tools. */
export function TrophyVaultScreen() {
  const { activeDog, isLoading } = useActiveDog();
  const game = useGamification(activeDog?.id ?? null);
  const [tab, setTab] = useState<Tab>('ranks');

  if (isLoading || game.isLoading) return <LoadingState />;
  if (game.error) return <ErrorState message={toUserMessage(game.error, 'לא הצלחנו לטעון את ההתקדמות.')} onRetry={game.refetch} />;
  if (!activeDog) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={{ title: 'ארון הגביעים' }} />
        <Card tone="info">
          <AppText>הוסיפו כלב בלשונית הפרופיל כדי להתחיל לצבור דרגות ותגים.</AppText>
        </Card>
      </Screen>
    );
  }

  const today = todayIso();
  const summary = toGamificationState(game.state, today);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'ארון הגביעים' }} />
      <GameStatusCard state={game.state} today={today} dogName={activeDog.name} />
      <SegmentedControl segments={TABS} value={tab} onChange={setTab} accessibilityLabel="אזורי ארון הגביעים" />
      {tab === 'ranks' ? <RankRoadmap currentLevel={summary.currentLevel} /> : null}
      {tab === 'badges' ? (
        <BadgeGrid
          badges={badgesView(game.state)}
          onReviewToxins={() => {
            game.recordToxinReview();
            router.push('/kitchen');
          }}
        />
      ) : null}
      {tab === 'tools' ? (
        <RewardToolsPanel
          rewards={rewardsView(game.state)}
          certificate={{ dogName: activeDog.name, breed: activeDog.breed, completedOn: today, rankTitleHe: rankAt(summary.currentLevel).titleHe }}
          onClaim={(rewardId) => {
            const refused = game.claim(rewardId);
            if (refused) showToast(REFUSALS[refused]);
          }}
        />
      ) : null}
    </Screen>
  );
}
