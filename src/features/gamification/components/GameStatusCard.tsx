import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, GlassCard, ProgressBar } from '@/components/ui';
import { colors, glow, spacing } from '@/constants/theme';

import { DAILY_XP_CAP } from '../data/rules';
import type { GameState } from '../types';
import { activeDays, multiplierFor, nextRankGap, rankFor, streakFor } from '../utils/progression';
import { hasReward } from '../utils/view';

interface GameStatusCardProps {
  state: GameState;
  today: string;
  dogName: string;
  onOpenVault?: () => void;
}

/** The dog's rank card: XP towards the next rank, the streak multiplier and today's XP against the cap. */
export function GameStatusCard({ state, today, dogName, onOpenVault }: GameStatusCardProps) {
  const days = activeDays(state).length;
  const rank = rankFor(state.totalXp, days);
  const gap = nextRankGap(state.totalXp, days);
  const streak = streakFor(state, today);
  const multiplier = multiplierFor(streak);
  const todayXp = state.xpByDay[today] ?? 0;
  const span = gap ? gap.rank.minXp - rank.minXp : 1;
  const ratio = gap ? Math.min(1, (state.totalXp - rank.minXp) / span) : 1;
  const tactical = hasReward(state, 'profile-skin-tactical');

  return (
    <GlassCard style={tactical ? styles.tactical : undefined}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="caption" color={rank.themeColor}>{`דרגה ${rank.level} מתוך 10`}</AppText>
          <AppText variant="heading" accessibilityRole="header">{`${dogName} · ${rank.titleHe}`}</AppText>
        </View>
        <AppText variant="title" color="accentMint">{`${state.totalXp} XP`}</AppText>
      </View>
      <ProgressBar value={ratio} label={gap ? `התקדמות לדרגה ${gap.rank.level}` : 'הדרגה העליונה'} />
      <AppText variant="caption" color="textSecondary">
        {!gap
          ? 'הגעתם לפסגה. עכשיו – שימור בכל סביבה.'
          : gap.daysNeeded > 0
            ? `ל"${gap.rank.titleHe}": עוד ${gap.xpNeeded} XP ועוד ${gap.daysNeeded} ימי אימון נפרדים`
            : `ל"${gap.rank.titleHe}": עוד ${gap.xpNeeded} XP`}
      </AppText>
      <View style={styles.row} accessible accessibilityLabel={`רצף של ${streak} ימים, מכפיל ${multiplier}`}>
        <Ionicons name="flame" size={22} color={streak >= 3 ? colors.accentOrange : colors.textMuted} accessible={false} />
        <AppText variant="bodyStrong">{`רצף: ${streak} ${streak === 1 ? 'יום' : 'ימים'}`}</AppText>
        <AppText variant="caption" color={multiplier > 1 ? 'accentOrange' : 'textSecondary'}>
          {multiplier > 1 ? `מכפיל ×${multiplier}` : 'מכפיל ×1.2 מ־3 ימים, ×1.5 מ־7'}
        </AppText>
      </View>
      <AppText variant="caption" color="textSecondary">{`היום: ${todayXp} מתוך ${DAILY_XP_CAP} XP`}</AppText>
      {onOpenVault ? <Button title="ארון הגביעים והפרסים" variant="tonal" compact icon="trophy-outline" onPress={onOpenVault} /> : null}
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
  tactical: {
    borderWidth: 2,
    borderColor: colors.accentCyan,
    ...glow(colors.accentCyan),
  },
});
