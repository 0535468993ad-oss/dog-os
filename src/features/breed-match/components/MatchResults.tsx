import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Disclaimer, SectionHeader } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { BreedMatch, MatchTier } from '../types';
import { TIER_LABELS_HE } from '../utils/labels';
import { BreedDossierModal } from './BreedDossierModal';
import { BreedMatchCard } from './BreedMatchCard';

const TIER_ORDER: readonly MatchTier[] = ['OPTIMAL', 'GOOD_WITH_ADJUSTMENTS', 'HIGH_RISK_MISMATCH'];

interface MatchResultsProps {
  matches: readonly BreedMatch[];
  excludedCount: number;
  onEdit: () => void;
  onRestart: () => void;
}

/** The ranked breeds grouped by tier, with the dossier one tap away. */
export function MatchResults({ matches, excludedCount, onEdit, onRestart }: MatchResultsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = matches.find((match) => match.breed.id === openId) ?? null;

  return (
    <View style={styles.root}>
      <View style={styles.actions}>
        <Button title="שינוי תשובות" variant="secondary" compact icon="create-outline" onPress={onEdit} />
        <Button title="להתחיל מחדש" variant="ghost" compact icon="refresh" onPress={onRestart} />
      </View>
      {excludedCount > 0 ? (
        <AppText variant="caption" color="textSecondary">{`${excludedCount} גזעים עם פרווה נושרת הוסרו מהרשימה בגלל האלרגיה.`}</AppText>
      ) : null}
      {TIER_ORDER.map((tier) => {
        const inTier = matches.filter((match) => match.tier === tier);
        if (inTier.length === 0) return null;
        return (
          <View key={tier} style={styles.group}>
            <SectionHeader title={`${TIER_LABELS_HE[tier]} (${inTier.length})`} />
            {inTier.map((match) => (
              <BreedMatchCard key={match.breed.id} match={match} onOpen={() => setOpenId(match.breed.id)} />
            ))}
          </View>
        );
      })}
      <Disclaimer>
        ההתאמה מבוססת על מאפייני הגזע הטיפוסיים. כל כלב הוא פרט – מזג ההורים, הגידול והחשיפה המוקדמת משפיעים לא פחות מהגזע. המחירים הם הערכה לאוקטובר 2026.
      </Disclaimer>
      <BreedDossierModal match={open} onClose={() => setOpenId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  group: {
    gap: spacing.sm,
  },
});
