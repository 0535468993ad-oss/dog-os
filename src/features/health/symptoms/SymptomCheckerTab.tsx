import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Checkbox, ChipGroup, Disclaimer, ErrorState, LoadingState, SectionHeader, StaleDataNotice } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { EmergencyActions } from '../encyclopedia/EmergencyActions';
import { VetArticleCard } from '../encyclopedia/VetArticleCard';
import { useVetKnowledge } from '../hooks';
import { MEDICAL_DISCLAIMER } from '../labels';
import { triageSymptoms } from '../logic/symptomTriage';
import { UrgencyVerdict } from './UrgencyVerdict';

/** Symptom checker: estimates how urgently to see a vet. Never presents a diagnosis. */
export function SymptomCheckerTab() {
  const knowledge = useVetKnowledge();
  const [selected, setSelected] = useState<string[]>([]);
  const [redFlags, setRedFlags] = useState<string[]>([]);

  if (knowledge.isLoading) return <LoadingState />;
  if (!knowledge.data) {
    return (
      <View style={styles.list}>
        <EmergencyActions />
        <ErrorState message={toUserMessage(knowledge.error)} onRetry={() => void knowledge.refetch()} />
      </View>
    );
  }

  const { symptoms, articles, conditionsBySymptom } = knowledge.data;
  const { redFlagOptions, urgency, reason, matches } = triageSymptoms({ symptoms, selectedIds: selected, checkedRedFlags: redFlags, articles, conditionsBySymptom });

  // Adds or removes one red flag from the checked set.
  const toggleFlag = (flag: string, checked: boolean) => setRedFlags((prev) => (checked ? [...prev, flag] : prev.filter((f) => f !== flag)));

  return (
    <View style={styles.list}>
      <StaleDataNotice visible={cacheState(knowledge.error, true) === 'stale' || !!knowledge.data.offline} onRetry={() => void knowledge.refetch()} />
      <Disclaimer>בודק הסימפטומים עוזר להעריך כמה דחוף לפנות לווטרינר. הוא אינו מאבחן מחלות. {MEDICAL_DISCLAIMER}</Disclaimer>

      <View style={styles.section}>
        <SectionHeader
          title="1. מה אתם רואים?"
          action={
            selected.length ? (
              <Button
                title="ניקוי"
                icon="close"
                variant="ghost"
                compact
                onPress={() => {
                  setSelected([]);
                  setRedFlags([]);
                }}
                accessibilityLabel="ניקוי כל הסימנים שנבחרו"
              />
            ) : null
          }
        />
        <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
          {selected.length ? `נבחרו ${selected.length === 1 ? 'סימן אחד' : `${selected.length} סימנים`}. אפשר לבחור כמה.` : 'אפשר לבחור כמה סימנים.'}
        </AppText>
        <ChipGroup multiple options={symptoms.map((s) => ({ value: s.id, label: s.name }))} value={selected} onChange={setSelected} accessibilityLabel="בחירת סימפטומים" />
      </View>

      {redFlagOptions.length ? (
        <View style={styles.section}>
          <SectionHeader title="2. האם יש גם אחד מאלה?" />
          <Card tone="danger">
            <AppText variant="caption" color="textSecondary">
              כל אחד מהסימנים האלה הופך את המצב לחירום.
            </AppText>
            {redFlagOptions.map((flag) => (
              <Checkbox key={flag} checked={redFlags.includes(flag)} onChange={(checked) => toggleFlag(flag, checked)} label={flag} />
            ))}
          </Card>
        </View>
      ) : null}

      {urgency && reason ? <UrgencyVerdict urgency={urgency} reason={reason} /> : <AppText color="textSecondary">בחרו סימפטום אחד או יותר כדי לראות הערכת דחיפות.</AppText>}
      {urgency === 'emergency' ? <EmergencyActions /> : null}

      {matches.length ? (
        <View style={styles.section}>
          <SectionHeader title="מצבים שכדאי להכיר" />
          <AppText variant="caption" color="textSecondary">
            רשימה זו מבוססת על התאמה בין סימפטומים – היא אינה אבחנה.
          </AppText>
          {matches.map((article) => (
            <VetArticleCard key={article.id} article={article} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sections sit further apart than the items inside them, so each group reads as one block.
  list: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
});
