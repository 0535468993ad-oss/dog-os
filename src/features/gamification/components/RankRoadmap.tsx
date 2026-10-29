import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { RANKS } from '../data/ranksData';

/** The 1–10 ladder: each rank's threshold, perk and reward, with the current rank highlighted. */
export function RankRoadmap({ currentLevel }: { currentLevel: number }) {
  return (
    <View style={styles.list} accessibilityRole="list">
      {RANKS.map((rank) => {
        const reached = rank.level <= currentLevel;
        const current = rank.level === currentLevel;
        const days = rank.minActiveDays > 0 ? ` · ${rank.minActiveDays} ימי אימון` : '';
        return (
          <View
            key={rank.level}
            style={[styles.row, current && styles.current]}
            accessible
            accessibilityLabel={`דרגה ${rank.level}, ${rank.titleHe}${current ? ', הדרגה הנוכחית' : reached ? ', הושגה' : ''}. ${rank.minXp} XP${days}. פרס: ${rank.unlockedReward.titleHe}`}
          >
            <View style={[styles.level, reached && { borderColor: colors[rank.themeColor] }]}>
              <AppText variant="bodyStrong" color={reached ? rank.themeColor : 'textMuted'}>
                {rank.level}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="subheading">{rank.titleHe}</AppText>
              <AppText variant="caption" color="textSecondary">{`${rank.minXp} XP${days}`}</AppText>
              <AppText variant="caption">{rank.perkDescriptionHe}</AppText>
              {rank.unlockedReward.availability === 'COMING_SOON' ? <Badge label="בקרוב" tone="neutral" icon="time-outline" /> : null}
            </View>
            {reached ? <Ionicons name="checkmark-circle" size={22} color={colors.accentMint} accessible={false} /> : <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} accessible={false} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  current: {
    borderColor: colors.accentCyan,
  },
  level: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
    gap: spacing.xxs,
  },
});
