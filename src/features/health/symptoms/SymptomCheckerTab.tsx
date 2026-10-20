import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, Checkbox, ChipGroup, Disclaimer, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import { spacing } from '@/theme';
import { toUserMessage } from '@/utils/errors';

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
  if (knowledge.error || !knowledge.data) return <ErrorState message={toUserMessage(knowledge.error)} onRetry={() => void knowledge.refetch()} />;

  const { symptoms, articles, conditionsBySymptom } = knowledge.data;
  const { redFlagOptions, urgency, matches } = triageSymptoms({ symptoms, selectedIds: selected, checkedRedFlags: redFlags, articles, conditionsBySymptom });

  // Adds or removes one red flag from the checked set.
  const toggleFlag = (flag: string, checked: boolean) => setRedFlags((prev) => (checked ? [...prev, flag] : prev.filter((f) => f !== flag)));

  return (
    <View style={styles.list}>
      <Disclaimer>בודק הסימפטומים עוזר להעריך כמה דחוף לפנות לווטרינר. הוא אינו מאבחן מחלות. {MEDICAL_DISCLAIMER}</Disclaimer>

      <SectionHeader title="1. מה אתם רואים?" />
      <ChipGroup multiple options={symptoms.map((s) => ({ value: s.id, label: s.name }))} value={selected} onChange={setSelected} accessibilityLabel="בחירת סימפטומים" />

      {redFlagOptions.length ? (
        <>
          <SectionHeader title="2. האם יש גם אחד מאלה?" />
          <Card>
            {redFlagOptions.map((flag) => (
              <Checkbox key={flag} checked={redFlags.includes(flag)} onChange={(checked) => toggleFlag(flag, checked)} label={flag} />
            ))}
          </Card>
        </>
      ) : null}

      {urgency ? <UrgencyVerdict urgency={urgency} /> : <AppText color="textSecondary">בחרו סימפטום אחד או יותר כדי לראות הערכת דחיפות.</AppText>}

      {matches.length ? (
        <>
          <SectionHeader title="מצבים שכדאי להכיר" />
          <AppText variant="caption" color="textSecondary">
            רשימה זו מבוססת על התאמה בין סימפטומים – היא אינה אבחנה.
          </AppText>
          {matches.map((article) => (
            <VetArticleCard key={article.id} article={article} />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
