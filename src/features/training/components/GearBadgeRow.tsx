import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { GearItem } from '../types';

/** The gear a command needs, as a row of badges; each badge keeps its safety note. */
export function GearBadgeRow({ gear }: { gear: readonly GearItem[] }) {
  if (gear.length === 0) return null;
  return (
    <View style={styles.root}>
      <AppText variant="label">ציוד טקטי</AppText>
      <View style={styles.row} accessibilityRole="list">
        {gear.map((item) => (
          <View key={item.nameHe} style={styles.badge} accessible accessibilityLabel={item.noteHe ? `${item.nameHe}: ${item.noteHe}` : item.nameHe}>
            <View style={styles.title}>
              <Ionicons name="construct-outline" size={14} color={colors.textSecondary} accessible={false} />
              <AppText variant="caption" style={styles.name}>
                {item.nameHe}
              </AppText>
            </View>
            {item.noteHe ? (
              <AppText variant="caption" color="textSecondary">
                {item.noteHe}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    maxWidth: '100%',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
  },
});
