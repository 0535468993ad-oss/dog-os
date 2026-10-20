import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';

import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

const MESSAGES: Record<DevBypassReason, { title: string; body: string }> = {
  schema_missing: {
    title: 'מצב פיתוח: חסרות טבלאות במסד הנתונים',
    body: 'המיגרציות ב-supabase/migrations לא הורצו, ולכן בדיקת ההסכמות דולגה ותכונות רבות לא יעבדו. הריצו אותן ב-SQL Editor לפי הסדר.',
  },
  dev_flag: {
    title: 'מצב פיתוח: מסך ההסכמות מדולג',
    body: 'EXPO_PUBLIC_DEV_SKIP_CONSENT_GATE=1 – למשתמש הזה אין הסכמות רשומות, ולא נרשמה הסכמה. בגרסת ייצור המשתמש יתבקש לאשר.',
  },
};

export type DevBypassReason = 'schema_missing' | 'dev_flag';

/**
 * Development builds only: shown whenever the consent gate was skipped (see consentGate), so a bypass is
 * impossible to mistake for a working setup.
 */
export function DevSchemaWarning({ reason }: { reason: DevBypassReason }) {
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();

  if (!__DEV__ || dismissed) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <View style={styles.banner}>
        <View accessible accessibilityRole="alert" style={styles.text}>
          <AppText variant="label" style={styles.title}>
            {MESSAGES[reason].title}
          </AppText>
          <AppText variant="caption" style={styles.body}>
            {MESSAGES[reason].body}
          </AppText>
        </View>
        <Button title="הסתרה" variant="secondary" compact onPress={() => setDismissed(true)} accessibilityLabel="הסתרת אזהרת מצב הפיתוח" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  banner: {
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderColor: colors.warning,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadow.card,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.warning,
  },
  body: {
    color: colors.textPrimary,
  },
});
