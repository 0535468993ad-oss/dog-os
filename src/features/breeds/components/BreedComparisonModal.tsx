import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card, ChipGroup, IconButton } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { BOAS_LABELS_HE } from '../data/breedLabels';
import { BREED_PROFILES } from '../data/breedsSeedData';
import { compareBreeds } from '../services/breedComparatorService';
import type { BreedProfile } from '../types';
import { DriveBars } from './DriveBars';

const yesNo = (value: boolean) => (value ? 'כן' : 'לא');

interface BreedComparisonModalProps {
  base: BreedProfile;
  visible: boolean;
  onClose: () => void;
}

/** Side-by-side comparison of this breed with another: drives, energy, maintenance and medical load. */
export function BreedComparisonModal({ base, visible, onClose }: BreedComparisonModalProps) {
  const [otherId, setOtherId] = useState<string | null>(null);
  const options = BREED_PROFILES.filter((profile) => profile.id !== base.id).map((profile) => ({ value: profile.id, label: profile.names.he }));
  const comparison = otherId ? compareBreeds(base.id, otherId) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header" style={styles.flex}>{`השוואה: ${base.names.he}`}</AppText>
          <IconButton icon="close" accessibilityLabel="סגירה" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <ChipGroup options={options} value={otherId} onChange={setOtherId} accessibilityLabel="גזע להשוואה" scrollable />
          {comparison ? (
            <>
              <AppText variant="caption" color="textSecondary">{`פסים מלאים: ${comparison.a.names.he} · מסגרת כתומה: ${comparison.b.names.he}`}</AppText>
              <Card>
                <DriveBars rows={comparison.drives.map((drive) => ({ labelHe: drive.labelHe, value: drive.a, compare: drive.b }))} />
              </Card>
              <Card>
                <View style={styles.table}>
                  <Row label="שעות פעילות ביום" a={`${comparison.energyHours.a}`} b={`${comparison.energyHours.b}`} />
                  <Row label="נשירה" a={`${comparison.maintenance.shedding.a}/5`} b={`${comparison.maintenance.shedding.b}/5`} />
                  <Row label="ריור" a={`${comparison.maintenance.drool.a}/5`} b={`${comparison.maintenance.drool.b}/5`} />
                  <Row label="תוחלת חיים" a={`${comparison.longevity.a.min}–${comparison.longevity.a.max}`} b={`${comparison.longevity.b.min}–${comparison.longevity.b.max}`} />
                  <Row label="סיכון לתסובב קיבה" a={yesNo(comparison.clinical.gdv.a)} b={yesNo(comparison.clinical.gdv.b)} />
                  <Row label="רגישות MDR1" a={yesNo(comparison.clinical.mdr1.a)} b={yesNo(comparison.clinical.mdr1.b)} />
                  <Row label="פנים שטוחות" a={BOAS_LABELS_HE[comparison.clinical.boas.a]} b={BOAS_LABELS_HE[comparison.clinical.boas.b]} />
                </View>
              </Card>
              <Card>
                <View style={styles.table}>
                  <AppText variant="label">מחלות תורשתיות</AppText>
                  {comparison.clinical.shared.length > 0 ? <AppText>{`משותפות: ${comparison.clinical.shared.join(', ')}`}</AppText> : null}
                  <AppText>{`רק ב${comparison.a.names.he}: ${comparison.clinical.onlyA.join(', ') || 'אין'}`}</AppText>
                  <AppText>{`רק ב${comparison.b.names.he}: ${comparison.clinical.onlyB.join(', ') || 'אין'}`}</AppText>
                </View>
              </Card>
            </>
          ) : (
            <AppText color="textSecondary">בחרו גזע להשוואה.</AppText>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** One comparison row: the label, then each breed's value. */
function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${a} מול ${b}`}>
      <AppText variant="caption" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.value}>
        {a}
      </AppText>
      <AppText variant="bodyStrong" color="accentOrange" style={styles.value}>
        {b}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  table: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    width: 72,
  },
});
