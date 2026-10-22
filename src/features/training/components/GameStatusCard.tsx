import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, GlassCard, ProgressBar } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { DAILY_XP_CAP } from '../data/gameRules';
import type { GameState } from '../types';
import { activeDays, levelFor, multiplierFor, nextLevelGap, streakFor } from '../utils/progression';

/** Level, XP towards the next level, the daily streak with its multiplier, and today's XP against the cap. */
export function GameStatusCard({ state, today, dogName }: { state: GameState; today: string; dogName: string }) {
  const days = activeDays(state).length;
  const level = levelFor(state.totalXp, days);
  const gap = nextLevelGap(state.totalXp, days);
  const streak = streakFor(state, today);
  const multiplier = multiplierFor(streak);
  const todayXp = state.xpByDay[today] ?? 0;
  const span = gap ? gap.level.minXp - level.minXp : 1;
  const ratio = gap ? Math.min(1, (state.totalXp - level.minXp) / span) : 1;

  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="caption" color="accentCyan">{`דרגה ${level.level} מתוך 10`}</AppText>
          <AppText variant="heading" accessibilityRole="header">{`${dogName} · ${level.titleHe}`}</AppText>
        </View>
        <AppText variant="title" color="accentMint">{`${state.totalXp} XP`}</AppText>
      </View>
      <ProgressBar value={ratio} label={gap ? `התקדמות לדרגה ${gap.level.level}` : 'הדרגה העליונה'} />
      {gap ? (
        <AppText variant="caption" color="textSecondary">
          {gap.daysNeeded > 0
            ? `לדרגה ${gap.level.level}: עוד ${gap.xpNeeded} XP ועוד ${gap.daysNeeded} ימי אימון נפרדים`
            : `לדרגה ${gap.level.level}: עוד ${gap.xpNeeded} XP`}
        </AppText>
      ) : (
        <AppText variant="caption" color="textSecondary">
          הגעתם לפסגה. עכשיו – שימור בכל סביבה.
        </AppText>
      )}
      <View style={styles.row} accessible accessibilityLabel={`רצף של ${streak} ימים, מכפיל ${multiplier}`}>
        <Ionicons name="flame" size={22} color={streak >= 3 ? colors.accentOrange : colors.textMuted} accessible={false} />
        <AppText variant="bodyStrong">{`רצף: ${streak} ${streak === 1 ? 'יום' : 'ימים'}`}</AppText>
        <AppText variant="caption" color={multiplier > 1 ? 'accentOrange' : 'textSecondary'}>
          {multiplier > 1 ? `מכפיל ×${multiplier}` : 'מכפיל ×1.2 מ־3 ימים, ×1.5 מ־7'}
        </AppText>
      </View>
      <AppText variant="caption" color="textSecondary">{`היום: ${todayXp} מתוך ${DAILY_XP_CAP} XP`}</AppText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
