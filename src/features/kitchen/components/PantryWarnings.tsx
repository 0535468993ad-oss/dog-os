import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { PantryReport } from '../types';
import { SafetyAlertBadge } from './SafetyAlertBadge';

/** Toxic and caution foods among the selected pantry items, toxic first. Renders nothing when all are safe. */
export function PantryWarnings({ report }: { report: PantryReport }) {
  if (report.toxic.length === 0 && report.caution.length === 0) return null;
  return (
    <View style={styles.list}>
      <AppText variant="subheading">שימו לב לפני שמבשלים</AppText>
      {report.toxic.map((item) => (
        <SafetyAlertBadge key={item.id} tier="TOXIC" title={item.nameHe} detailsHe={item.dangerDetailsHe} />
      ))}
      {report.caution.map((item) => (
        <SafetyAlertBadge key={item.id} tier="CAUTION" title={item.nameHe} detailsHe={`${item.preparationRulesHe} ${item.dangerDetailsHe ?? ''}`.trim()} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
});
