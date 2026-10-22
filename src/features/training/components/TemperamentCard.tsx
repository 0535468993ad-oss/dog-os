import { AppText, Badge, BulletList, ChipGroup, GlassCard } from '@/components/ui';

import { TEMPERAMENT_HINTS_HE, TEMPERAMENT_LABELS_HE, TRACK_LABELS_HE } from '../data/methodology';
import type { TemperamentTrait, TrainingRecommendation } from '../types';

const OPTIONS = (Object.keys(TEMPERAMENT_LABELS_HE) as TemperamentTrait[]).map((value) => ({ value, label: TEMPERAMENT_LABELS_HE[value] }));

interface TemperamentCardProps {
  dogName: string;
  trait: TemperamentTrait | null;
  recommendation: TrainingRecommendation | null;
  onChange: (trait: TemperamentTrait) => void;
}

/** Asks how the dog behaves day to day, and shows the recommended track with its reasons. */
export function TemperamentCard({ dogName, trait, recommendation, onChange }: TemperamentCardProps) {
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">{`איך ${dogName} מתנהג ביומיום?`}</AppText>
      <ChipGroup options={OPTIONS} value={trait} onChange={onChange} accessibilityLabel="מזג הכלב" />
      {trait ? (
        <AppText variant="caption" color="textSecondary">
          {TEMPERAMENT_HINTS_HE[trait]}
        </AppText>
      ) : null}
      {recommendation ? (
        <>
          <Badge label={`מומלץ: ${TRACK_LABELS_HE[recommendation.track]}`} tone={recommendation.track === 'FORCE_FREE' ? 'success' : 'warning'} />
          <AppText variant="subheading">{recommendation.titleHe}</AppText>
          <BulletList items={recommendation.reasonsHe} />
          <AppText variant="label">איך עובדים</AppText>
          <BulletList items={recommendation.principlesHe} />
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
