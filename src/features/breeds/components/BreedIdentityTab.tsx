import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { COAT_LABELS_HE, SIZE_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile } from '../types';

const range = (r: { min: number; max: number }, unit: string) => `${r.min}–${r.max} ${unit}`;

/** The FCI line: group, and section and standard number where they were checked. */
export const fciLine = (fci: BreedProfile['fci']): string =>
  fci === null
    ? 'אין לגזע תקן FCI (לא מוכר בפדרציה הבינלאומית, או כלב מעורב).'
    : [`קבוצה ${fci.group}: ${fci.groupNameHe}`, fci.section !== undefined ? `סעיף ${fci.section}` : null, fci.standardNumber !== undefined ? `סטנדרט מספר ${fci.standardNumber}` : null].filter(Boolean).join(' · ');

/** Tab 1: identity and history – origin, founders, original purpose, FCI group and the body. */
export function BreedIdentityTab({ profile }: { profile: BreedProfile }) {
  const { genesis, fci, phenotype } = profile;
  return (
    <View style={styles.root}>
      <Card>
        <View style={styles.card}>
          <AppText variant="label">מוצא</AppText>
          <AppText>{`${genesis.countryOfOrigin} · ${genesis.centuryOfOrigin}`}</AppText>
          <AppText variant="label">ייעוד מקורי</AppText>
          <AppText>{genesis.originalUtilityAndFunction}</AppText>
          <AppText variant="label">דמויות מפתח</AppText>
          <AppText>{genesis.founderOrHistoricalKeyFigures}</AppText>
          <AppText variant="label">אבות הגזע</AppText>
          <BulletList items={genesis.ancestorBreeds} />
        </View>
      </Card>
      <AppText>{genesis.historicalContextNarrativeHe}</AppText>
      <Card>
        <View style={styles.card}>
          <AppText variant="label">סיווג FCI</AppText>
          <AppText>{fciLine(fci)}</AppText>
          <AppText variant="label">מבנה גוף</AppText>
          <AppText>{`${SIZE_LABELS_HE[phenotype.sizeCategory]} · זכר ${range(phenotype.maleWeightKg, 'ק״ג')}, ${range(phenotype.maleHeightCm, 'ס״מ')} · נקבה ${range(phenotype.femaleWeightKg, 'ק״ג')}, ${range(phenotype.femaleHeightCm, 'ס״מ')}`}</AppText>
          <AppText>{`${COAT_LABELS_HE[phenotype.coatType]} · נשירה ${phenotype.sheddingLevel}/5 · ריור ${phenotype.droolTendency}/5`}</AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
});
