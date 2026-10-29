import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Button, Disclaimer, GlassCard, SegmentedControl } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { GATE_LABELS_HE, MOTIVATOR_LABELS_HE, NERVE_LABELS_HE, RISK_WARNINGS } from '@/features/training/data/assessmentCopy';
import { TRACK_LABELS_HE } from '@/features/training/data/methodology';
import type { TrainingRecommendation, TrainingTrack } from '@/features/training/types';

const TRACKS = (Object.keys(TRACK_LABELS_HE) as TrainingTrack[]).map((value) => ({ value, label: TRACK_LABELS_HE[value] }));

interface ResultStepProps {
  dogName: string;
  recommendation: TrainingRecommendation;
  selected: TrainingTrack;
  onSelect: (track: TrainingTrack) => void;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
}

/** The behavioural profile card: the recommendation and why, this dog's warnings, and the owner's own track choice. */
export function ResultStep({ dogName, recommendation, selected, onSelect, saving, canSave, onSave }: ResultStepProps) {
  const [lockTapped, setLockTapped] = useState(false);
  const choose = (track: TrainingTrack) => {
    // The age floor: the only choice the owner can't make, and it says why.
    if (track === 'BALANCED' && recommendation.gate === 'LOCKED') {
      setLockTapped(true);
      return;
    }
    setLockTapped(false);
    onSelect(track);
  };

  return (
    <GlassCard>
      <AppText variant="title" accessibilityRole="header">{`תעודת אבחון התנהגותית – ${dogName}`}</AppText>
      <View style={styles.badges}>
        {recommendation.motivator ? <Badge label={MOTIVATOR_LABELS_HE[recommendation.motivator]} tone="info" /> : null}
        <Badge label={NERVE_LABELS_HE[recommendation.nerve]} tone="neutral" />
      </View>
      <View style={styles.block} accessibilityLiveRegion="polite">
        <Badge label={`מומלץ: ${TRACK_LABELS_HE[recommendation.track]}`} tone={recommendation.track === 'FORCE_FREE' ? 'success' : 'warning'} />
        <AppText variant="subheading">{recommendation.titleHe}</AppText>
      </View>
      <BulletList items={recommendation.reasonsHe} />
      {recommendation.adjustmentsHe.length > 0 ? (
        <>
          <AppText variant="label">{`מותאם ל${dogName}`}</AppText>
          <BulletList items={recommendation.adjustmentsHe} />
        </>
      ) : null}
      {recommendation.warnings.length > 0 ? (
        <>
          <AppText variant="label">חשוב לדעת</AppText>
          <BulletList items={recommendation.warnings.map((warning) => warning.textHe)} />
        </>
      ) : null}
      <AppText variant="label">באיזו שיטה תרצו לעבוד?</AppText>
      <SegmentedControl segments={TRACKS} value={selected} onChange={choose} accessibilityLabel="שיטת האילוף" />
      <AppText variant="caption" color="textSecondary">
        {GATE_LABELS_HE[recommendation.gate]}
      </AppText>
      {lockTapped ? (
        <AppText color="warning" accessibilityRole="alert">
          {RISK_WARNINGS.PUPPY_FLOOR.textHe}
        </AppText>
      ) : null}
      {selected !== recommendation.track ? (
        <AppText variant="caption" color="accentBronze">
          בחרתם מסלול אחר מההמלצה – זו החלטה שלכם, ואפשר לשנות אותה בכל רגע, גם לכל פקודה בנפרד.
        </AppText>
      ) : null}
      <Disclaimer>ההמלצה מבוססת על מה שסיפרתם, והיא מידע כללי – לא אבחון וטרינרי. בתוקפנות או בפחד קשה פנו לווטרינר מומחה להתנהגות.</Disclaimer>
      <Button title="שמירה והמשך" icon="checkmark" loading={saving} disabled={!canSave} onPress={onSave} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  block: {
    gap: spacing.xs,
  },
});
