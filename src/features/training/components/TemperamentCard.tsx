import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Button, ChipGroup, GlassCard } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { GATE_LABELS_HE } from '../data/assessmentCopy';
import { TEMPERAMENT_HINTS_HE, TEMPERAMENT_LABELS_HE, TRACK_LABELS_HE } from '../data/methodology';
import type { TemperamentTrait, TrainingRecommendation } from '../types';

/** Reasons shown before "show the full explanation"; the rest stays one tap away. */
const VISIBLE_REASONS = 2;

const OPTIONS = (Object.keys(TEMPERAMENT_LABELS_HE) as TemperamentTrait[]).map((value) => ({ value, label: TEMPERAMENT_LABELS_HE[value] }));

interface TemperamentCardProps {
  dogName: string;
  trait: TemperamentTrait | null;
  recommendation: TrainingRecommendation | null;
  /** The dog has a full diagnostic assessment (the one-tap trait is then hidden). */
  assessed: boolean;
  onChange: (trait: TemperamentTrait) => void;
  onOpenAssessment: () => void;
}

/** The dog's profile and recommended track, with the full assessment one tap away (or a quick one-tap trait). */
export function TemperamentCard({ dogName, trait, recommendation, assessed, onChange, onOpenAssessment }: TemperamentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reasons = recommendation?.reasonsHe ?? [];
  const hasMore = reasons.length > VISIBLE_REASONS || (recommendation?.principlesHe.length ?? 0) > 0 || (recommendation?.adjustmentsHe.length ?? 0) > 0;
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">{`איך ${dogName} מתנהג ביומיום?`}</AppText>
      {assessed ? (
        <AppText color="textSecondary">ההמלצה מבוססת על האבחון ההתנהגותי המלא.</AppText>
      ) : (
        <>
          <ChipGroup options={OPTIONS} value={trait} onChange={onChange} accessibilityLabel="מזג הכלב" />
          {trait ? (
            <AppText variant="caption" color="textSecondary">
              {TEMPERAMENT_HINTS_HE[trait]}
            </AppText>
          ) : null}
        </>
      )}
      <Button title={assessed ? 'אבחון מחדש' : 'לאבחון ההתנהגותי המלא (כ־2 דקות)'} variant="tonal" icon="clipboard-outline" onPress={onOpenAssessment} />
      {recommendation ? (
        <>
          <View style={styles.meta}>
            <Badge label={`מומלץ: ${TRACK_LABELS_HE[recommendation.track]}`} tone={recommendation.track === 'FORCE_FREE' ? 'success' : 'warning'} />
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              {GATE_LABELS_HE[recommendation.gate]}
            </AppText>
          </View>
          <AppText variant="subheading">{recommendation.titleHe}</AppText>
          <BulletList items={expanded ? reasons : reasons.slice(0, VISIBLE_REASONS)} />
          {expanded ? (
            <>
              <AppText variant="label">איך עובדים</AppText>
              <BulletList items={recommendation.principlesHe} />
              {recommendation.adjustmentsHe.length > 0 ? (
                <>
                  <AppText variant="label">{`מותאם ל${dogName}`}</AppText>
                  <BulletList items={recommendation.adjustmentsHe} />
                </>
              ) : null}
            </>
          ) : null}
          {hasMore ? (
            <Button
              title={expanded ? 'הצגת פחות' : 'להסבר המלא'}
              variant="ghost"
              compact
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              onPress={() => setExpanded((open) => !open)}
            />
          ) : null}
          {recommendation.requiresProfessional ? (
            <AppText variant="caption" color="warning">
              ציוד אכיפה מכניסים רק בליווי מאלף מקצועי, אחרי שהפקודות נלמדו בתגמול.
            </AppText>
          ) : null}
        </>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // Badge and gate note share one line (wrapping when narrow) instead of stacking.
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flexShrink: 1,
  },
});
