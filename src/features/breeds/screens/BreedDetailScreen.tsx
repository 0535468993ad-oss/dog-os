import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, EmptyState, Screen, SegmentedControl } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { BreedBehaviorTab } from '../components/BreedBehaviorTab';
import { BreedComparisonModal } from '../components/BreedComparisonModal';
import { BreedIdentityTab } from '../components/BreedIdentityTab';
import { BreedMedicalTab } from '../components/BreedMedicalTab';
import { BreedTemperamentTab } from '../components/BreedTemperamentTab';
import { SIZE_LABELS_HE } from '../data/breedLabels';
import { BREED_SOURCES_HE } from '../data/breedsSeedData';
import { findBreedProfile } from '../utils/breedTraits';

type Tab = 'identity' | 'temperament' | 'behavior' | 'medical';

const TABS: { value: Tab; label: string }[] = [
  { value: 'identity', label: 'תעודת זהות והיסטוריה' },
  { value: 'temperament', label: 'רדאר יצרים ואופי' },
  { value: 'behavior', label: 'אתגרי התנהגות' },
  { value: 'medical', label: 'פרופיל וטרינרי ורפואי' },
];

/** A breed's full profile in four tabs, with a side-by-side comparison against another breed. */
export function BreedDetailScreen() {
  const params = useLocalSearchParams<{ breedId?: string }>();
  const profile = findBreedProfile(typeof params.breedId === 'string' ? params.breedId : null);
  const [tab, setTab] = useState<Tab>('identity');
  const [comparing, setComparing] = useState(false);

  if (!profile) {
    return (
      <Screen edges={[]}>
        <EmptyState icon="help-circle-outline" title="הגזע לא נמצא" body="אין לנו עדיין כרטיס מודיעין לגזע הזה." />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {profile.names.he}
        </AppText>
        <AppText variant="caption" color="textSecondary">{`${profile.names.en} · ${profile.names.original}`}</AppText>
        <View style={styles.badges}>
          <Badge label={SIZE_LABELS_HE[profile.phenotype.sizeCategory]} />
          {profile.fci ? <Badge label={`FCI ${profile.fci.group}`} /> : <Badge label="ללא תקן FCI" />}
          {profile.clinical.bloatGdvRisk.hasHighPredisposition ? <Badge tone="warning" icon="warning-outline" label="סיכון לתסובב קיבה" /> : null}
        </View>
      </View>
      <SegmentedControl segments={TABS} value={tab} onChange={setTab} accessibilityLabel="אזור בכרטיס הגזע" />
      {tab === 'identity' ? <BreedIdentityTab profile={profile} /> : null}
      {tab === 'temperament' ? <BreedTemperamentTab profile={profile} /> : null}
      {tab === 'behavior' ? <BreedBehaviorTab profile={profile} /> : null}
      {tab === 'medical' ? <BreedMedicalTab profile={profile} /> : null}
      <Button title="השוואה לגזע אחר" icon="git-compare-outline" variant="secondary" onPress={() => setComparing(true)} />
      <AppText variant="caption" color="textSecondary">
        {BREED_SOURCES_HE}
      </AppText>
      <BreedComparisonModal base={profile} visible={comparing} onClose={() => setComparing(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
