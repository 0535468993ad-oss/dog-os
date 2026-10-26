import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import { LEAGUE_TIERS } from '../data/leagues';
import type { UpkeepNotice } from '../hooks/useGamification';

/** The launch banner: a freeze shield saved the streak, and/or the league tier moved. */
export function UpkeepNoticeBanner({ notice, onDismiss }: { notice: UpkeepNotice | null; onDismiss: () => void }) {
  if (!notice) return null;
  const lines: string[] = [];
  if (notice.shieldDays.length > 0) lines.push(`מגן הרצף הציל אותך! ${notice.shieldDays.length === 1 ? 'יום אחד שפוספס כוסה' : `${notice.shieldDays.length} ימים שפוספסו כוסו`}, והרצף ממשיך.`);
  if (notice.league) {
    const to = LEAGUE_TIERS[notice.league.to]?.nameHe ?? '';
    lines.push(notice.league.to > notice.league.from ? `עליתם לליגת ${to}!` : `ירדתם לליגת ${to}. שבוע חדש, הזדמנות חדשה.`);
  }
  return (
    <View style={styles.root} accessibilityRole="alert">
      {lines.map((line) => (
        <AppText key={line} variant="bodyStrong">
          {line}
        </AppText>
      ))}
      <Button title="סגירה" variant="ghost" compact onPress={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentMint,
    backgroundColor: colors.successMuted,
  },
});
