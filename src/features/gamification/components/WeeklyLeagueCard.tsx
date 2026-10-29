import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import { radius, spacing, tabularNums, tints, type ColorToken, type TintToken } from '@/constants/theme';

import { LEAGUE_TIERS } from '../data/leagues';
import type { LeagueStandings, LeagueZone } from '../types';

const ZONE_LABELS_HE: Readonly<Record<LeagueZone, string>> = {
  PROMOTION: 'אזור עלייה',
  SAFE: 'אזור בטוח',
  DEMOTION: 'אזור ירידה',
};

// Gold, silver and bronze place badges for the podium; the number inside keeps the cue color-independent.
const MEDALS: readonly { text: ColorToken; tint: TintToken }[] = [
  { text: 'medalGold', tint: 'medalGold' },
  { text: 'medalSilver', tint: 'medalSilver' },
  { text: 'medalBronze', tint: 'medalBronze' },
];

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
          {standings.rows.map((row, index) => {
            const medal = MEDALS[index];
            return (
              <View
                key={row.id}
                testID={row.isUser ? 'league-user-row' : undefined}
                style={[styles.tableRow, row.isUser && styles.userRow]}
                accessible
                accessibilityLabel={`מקום ${index + 1}: ${row.nameHe}, ${row.xp} XP`}
              >
                <View testID={`league-place-${index + 1}`} style={[styles.place, medal && { backgroundColor: tints[medal.tint] }]}>
                  <AppText variant="caption" color={medal ? medal.text : 'textSecondary'} style={[styles.placeText, tabularNums]}>{`${index + 1}`}</AppText>
                </View>
                <AppText variant={row.isUser ? 'bodyStrong' : 'body'} style={styles.flex}>
                  {row.nameHe}
                </AppText>
                <AppText variant="caption" style={tabularNums}>{`${row.xp} XP`}</AppText>
              </View>
            );
          })}
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
    // Every row reserves the border width, so the user's highlighted row doesn't shift the table.
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userRow: {
    backgroundColor: tints.primaryHighlight,
    borderColor: tints.primaryHighlightBorder,
  },
  place: {
    minWidth: 26,
    minHeight: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeText: {
    textAlign: 'center',
  },
});
