import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, DateField, SectionHeader, TextField } from '@/components/ui';
import type { WeightLogRow } from '@/lib/database.types';
import { spacing, tabularNums } from '@/constants/theme';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { useLogWeight } from '../hooks';
import { parseWeightKg, WEIGHT_RANGE_ERROR } from '../logic/weightInput';
import { WeightChart } from '../WeightChart';

/** Latest weight, trend chart and a form to log a weigh-in. */
export function WeightCard({ dogId, weights }: { dogId: string; weights: WeightLogRow[] }) {
  const logWeight = useLogWeight(dogId);
  const [weight, setWeight] = useState('');
  const [weighedOn, setWeighedOn] = useState<string>(todayIso());
  const [error, setError] = useState<string | null>(null);
  const latest = weights[weights.length - 1];

  // Validates the typed weight, then saves it; the field clears on success.
  const submit = async () => {
    const kg = parseWeightKg(weight);
    if (kg === null) {
      setError(WEIGHT_RANGE_ERROR);
      return;
    }
    setError(null);
    try {
      await logWeight.mutateAsync({ kg, date: weighedOn });
      setWeight('');
    } catch (e) {
      setError(toUserMessage(e));
    }
  };

  return (
    <>
      <SectionHeader title="משקל" />
      <Card>
        {latest ? <AppText variant="heading" style={tabularNums}>{`${latest.weight_kg} ק״ג`}</AppText> : <AppText color="textSecondary">עדיין אין שקילות.</AppText>}
        <WeightChart weights={weights} />
        <View style={styles.form}>
          <View style={styles.weightField}>
            <TextField label="משקל (ק״ג)" value={weight} onChangeText={setWeight} inputMode="decimal" keyboardType="decimal-pad" placeholder="12.4" error={error} />
          </View>
          <View style={styles.dateField}>
            <DateField label="תאריך" value={weighedOn} onChange={setWeighedOn} maximumDate={todayIso()} />
          </View>
        </View>
        <Button title="שמירת שקילה" onPress={submit} loading={logWeight.isPending} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  // The date gets twice the share: a full Hebrew date ("29 באוקטובר 2026") needs ~190pt with its icon,
  // the weight only a few digits. Below that width the date wraps onto its own line as a whole.
  weightField: {
    flexGrow: 1,
    flexBasis: 100,
  },
  dateField: {
    flexGrow: 2,
    flexBasis: 200,
  },
});
