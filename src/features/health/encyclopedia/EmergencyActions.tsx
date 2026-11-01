import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, showToast, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { reportError } from '@/utils/errors';

import { useSaveVetPhone, useVetPhone } from '../hooks';
import { NEARBY_EMERGENCY_VET_URL, telUrl } from '../logic/vetContact';

/** Opens a dialler or map link; a failure says what to do instead, since this runs in an emergency. */
function openLink(url: string) {
  Linking.openURL(url).catch((error: unknown) => {
    reportError(error, 'health/emergencyLink');
    showToast('לא הצלחנו לפתוח. חייגו ידנית או חפשו "וטרינר חירום" במפות.');
  });
}

/**
 * The two actions every emergency screen needs: call the owner's own vet (number saved on this device) and
 * find an open emergency clinic nearby. Works with no knowledge data and no network for the call.
 */
export function EmergencyActions() {
  const phone = useVetPhone();
  const save = useSaveVetPhone();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saved = phone.data ?? null;

  // Saves the typed number; a number that can't be dialled stays in the field with an inline error.
  const submit = (value: string | null) => {
    setError(null);
    save.mutate(value, {
      onSuccess: () => {
        setEditing(false);
        showToast(value === null ? 'המספר הוסר.' : 'מספר הווטרינר נשמר במכשיר.');
      },
      onError: (e) => setError(e instanceof Error && e.message === 'INVALID_PHONE' ? 'מספר לא תקין. הקלידו מספר טלפון מלא, למשל 03-1234567.' : 'השמירה נכשלה. נסו שוב.'),
    });
  };

  return (
    <Card tone="danger">
      <View style={styles.actions}>
        {saved ? <Button title="התקשרו לווטרינר שלכם" icon="call" onPress={() => openLink(telUrl(saved))} accessibilityLabel={`התקשרו לווטרינר שלכם, ${saved}`} fullWidth /> : null}
        <Button title="וטרינר חירום פתוח קרוב" icon="navigate-outline" variant="danger" onPress={() => openLink(NEARBY_EMERGENCY_VET_URL)} accessibilityHint="פותח חיפוש במפות" fullWidth />
      </View>
      {editing ? (
        <View style={styles.form}>
          <TextField
            label="מספר הווטרינר שלכם"
            value={draft}
            onChangeText={setDraft}
            keyboardType="phone-pad"
            inputMode="tel"
            autoComplete="tel"
            placeholder="03-1234567"
            hint="נשמר רק במכשיר הזה."
            error={error}
          />
          <View style={styles.row}>
            <Button title="שמירה" compact onPress={() => submit(draft)} loading={save.isPending} />
            <Button title="ביטול" variant="ghost" compact onPress={() => setEditing(false)} />
            {saved ? <Button title="הסרת המספר" variant="ghost" compact onPress={() => submit(null)} /> : null}
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          {saved ? (
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              {`הווטרינר שלכם: ${saved}`}
            </AppText>
          ) : (
            <AppText variant="caption" color="textSecondary" style={styles.flex}>
              שמרו את מספר הווטרינר כדי לחייג בלחיצה אחת ברגע חירום.
            </AppText>
          )}
          <Button
            title={saved ? 'שינוי' : 'שמירת מספר'}
            icon="create-outline"
            variant="ghost"
            compact
            onPress={() => {
              setDraft(saved ?? '');
              setError(null);
              setEditing(true);
            }}
            accessibilityLabel={saved ? 'שינוי מספר הווטרינר' : 'שמירת מספר הווטרינר'}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
