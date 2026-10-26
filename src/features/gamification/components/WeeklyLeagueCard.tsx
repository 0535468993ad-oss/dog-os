import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { LEAGUE_TIERS } from '../data/leagues';
import type { LeagueStandings, LeagueZone } from '../types';

const ZONE_LABELS_HE: Readonly<Record<LeagueZone, string>> = {
  PROMOTION: 'אזור עלייה',
  SAFE: 'אזור בטוח',
  DEMOTION: 'אזור ירידה',
};

interface WeeklyLeagueCardProps {
  standings: LeagueStandings;
  /** The persona's alert, shown when rivals passed the user since yesterday. */
  overtakenAlertHe: string | null;
}

/** The weekly league table against computer-generated rivals – labelled as such – with the promotion zone. */
export function WeeklyLeagueCard({ standings, overtakenAlertHe }: WeeklyLeagueCardProps) {
  const tierName = LEAGUE_TIERS[standings.tier]?.nameHe ?? '';
  return (
    <Card>
      <View style={styles.root}>
        <View style={styles.row}>
          <AppText variant="subheading" accessibilityRole="header" style={styles.flex}>{`ליגה שבועית: ${tierName}`}</AppText>
          <Badge label={`${ZONE_LABELS_HE[standings.zone]} · מקום ${standings.userRank}`} tone={standings.zone === 'PROMOTION' ? 'success' : standings.zone === 'DEMOTION' ? 'warning' : 'neutral'} />
        </View>
        {overtakenAlertHe && standings.overtakenBy.length > 0 ? (
          <AppText variant="caption" color="warning" accessibilityRole="alert">
            {`${overtakenAlertHe} (${standings.overtakenBy.join(', ')})`}
          </AppText>
        ) : null}
        <View accessibilityRole="list">
          {standings.rows.map((row, index) => (
            <View key={row.id} style={[styles.tableRow, row.isUser && styles.userRow]} accessible accessibilityLabel={`מקום ${index + 1}: ${row.nameHe}, ${row.xp} XP`}>
              <AppText variant="caption" color={index < 3 ? 'accentMint' : 'textSecondary'} style={styles.place}>{`${index + 1}`}</AppText>
              <AppText variant={row.isUser ? 'bodyStrong' : 'body'} style={styles.flex}>
                {row.nameHe}
              </AppText>
              <AppText variant="caption">{`${row.xp} XP`}</AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" color="textSecondary">
          היריבים בליגה ממוחשבים – לא משתמשים אמיתיים. הם נותנים קצב לרוץ מולו. שלושת הראשונים עולים ליגה בסוף השבוע.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  userRow: {
    backgroundColor: colors.surfaceAlt,
  },
  place: {
    width: 20,
  },
});
