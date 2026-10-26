import { AppText, Badge, BulletList, Button, ChipGroup, GlassCard } from '@/components/ui';

import { GATE_LABELS_HE } from '../data/assessmentCopy';
import { TEMPERAMENT_HINTS_HE, TEMPERAMENT_LABELS_HE, TRACK_LABELS_HE } from '../data/methodology';
import type { TemperamentTrait, TrainingRecommendation } from '../types';

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
          <Badge label={`מומלץ: ${TRACK_LABELS_HE[recommendation.track]}`} tone={recommendation.track === 'FORCE_FREE' ? 'success' : 'warning'} />
          <AppText variant="caption" color="textSecondary">
            {GATE_LABELS_HE[recommendation.gate]}
          </AppText>
          <AppText variant="subheading">{recommendation.titleHe}</AppText>
          <BulletList items={recommendation.reasonsHe} />
          <AppText variant="label">איך עובדים</AppText>
          <BulletList items={recommendation.principlesHe} />
          {recommendation.adjustmentsHe.length > 0 ? (
            <>
              <AppText variant="label">{`מותאם ל${dogName}`}</AppText>
              <BulletList items={recommendation.adjustmentsHe} />
            </>
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
