import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { AppText, Badge, Button, Card, Divider, ErrorState, LoadingState, Screen, SectionHeader } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import type { ConsentSource, ConsentType } from '@/lib/database.types';
import { colors, spacing } from '@/theme';
import { formatDate, formatTime } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { LegalLink } from './components';
import { useConsents, useRecordConsents } from './hooks/consents';
import { aiSharing, latestConsents } from './utils/consentRules';
import { setCookieConsent } from './hooks/cookieConsent';

const TYPE_LABELS: Record<ConsentType, string> = {
  terms_of_service: 'תקנון ותנאי שימוש',
  privacy_policy: 'מדיניות פרטיות',
  ai_disclaimer: 'הצהרת בינה מלאכותית',
  analytics: 'אנליטיקה',
  ai_data_sharing: 'שיתוף מידע עם ספק הבינה המלאכותית',
};

const SOURCE_LABELS: Record<ConsentSource, string> = {
  signup: 'בהרשמה',
  reconsent: 'אישור מחדש',
  settings: 'בהגדרות',
  cookie_banner: 'בבאנר העוגיות',
};

const REQUIRED_TYPES: ConsentType[] = ['terms_of_service', 'privacy_policy', 'ai_disclaimer'];

export function ConsentSettingsScreen() {
  const user = useUser();
  const consents = useConsents(user.id);
  const record = useRecordConsents(user.id);
  const [error, setError] = useState<string | null>(null);

  if (consents.isLoading) return <LoadingState />;
  if (consents.error) return <ErrorState message={toUserMessage(consents.error)} onRetry={() => void consents.refetch()} />;

  const rows = consents.data ?? [];
  const latest = latestConsents(rows);
  const analyticsOn = latest.analytics?.granted ?? false; // opt-in
  const aiSharingOn = aiSharing(consents) === 'allowed'; // opt-out

  const toggle = (type: 'analytics' | 'ai_data_sharing', granted: boolean) => {
    setError(null);
    record.mutate(
      { types: [type], granted, source: 'settings' },
      {
        onSuccess: () => {
          if (type === 'analytics' && Platform.OS === 'web') setCookieConsent(granted);
        },
        onError: (e) => setError(toUserMessage(e, 'לא הצלחנו לשמור את הבחירה. נסו שוב.')),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'ניהול הסכמות' }} />
      <AppText color="textSecondary">כאן מתועדות ההסכמות שנתתם, באיזו גרסת מסמך ומתי. התיעוד נשמר לפי חוק הגנת הפרטיות.</AppText>

      <SectionHeader title="הסכמות חובה לשימוש בשירות" />
      <Card>
        {REQUIRED_TYPES.map((type, index) => {
          const row = latest[type];
          return (
            <View key={type} style={styles.item}>
              {index > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <AppText variant="subheading" style={styles.flex}>
                  {TYPE_LABELS[type]}
                </AppText>
                <Badge label={row?.granted ? 'אושר' : 'לא אושר'} tone={row?.granted ? 'success' : 'warning'} icon={row?.granted ? 'checkmark' : 'alert'} />
              </View>
              {row ? (
                <AppText variant="caption" color="textSecondary">
                  {`גרסה ${formatDate(row.document_version)} · ${SOURCE_LABELS[row.source]} · ${formatDate(row.created_at.slice(0, 10))} ${formatTime(row.created_at)}`}
                </AppText>
              ) : null}
            </View>
          );
        })}
        <AppText variant="caption" color="textSecondary">
          הסכמות אלה נדרשות כדי להשתמש בשירות. כדי לחזור בכם מהן – מחקו את החשבון (פרופיל ← ״מחיקת החשבון״) או פנו אלינו.
        </AppText>
        <View style={styles.links}>
          <LegalLink doc="terms" />
          <LegalLink doc="privacy" />
        </View>
      </Card>

      <SectionHeader title="הסכמות רשות" />
      <Card>
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppText variant="subheading">{TYPE_LABELS.ai_data_sharing}</AppText>
            <AppText variant="caption" color="textSecondary">
              היועץ החכם והתובנות היומיות שולחים ל-Anthropic את פרטי הכלב, רשומות הבריאות והיומן כדי ליצור תשובה. כיבוי עוצר מיד כל שליחה; היועץ והתובנות מבוססות ה-AI לא יהיו זמינים, ושאר האפליקציה ממשיכה לעבוד.
            </AppText>
            <Button title="מה בדיוק נשלח?" variant="ghost" compact onPress={() => router.push('/advisor-context')} />
          </View>
          <Switch
            value={aiSharingOn}
            onValueChange={(on) => toggle('ai_data_sharing', on)}
            disabled={record.isPending}
            accessibilityLabel={TYPE_LABELS.ai_data_sharing}
            accessibilityState={{ checked: aiSharingOn, disabled: record.isPending }}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>
        <Divider />
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppText variant="subheading">{TYPE_LABELS.analytics}</AppText>
            <AppText variant="caption" color="textSecondary">
              נכון לעכשיו Dog OS לא מפעיל כלי אנליטיקה. הבחירה שלכם תכובד אם יתווסף כלי כזה, והוא לא יופעל בלי הסכמה.
            </AppText>
          </View>
          <Switch
            value={analyticsOn}
            onValueChange={(on) => toggle('analytics', on)}
            disabled={record.isPending}
            accessibilityLabel="הסכמה לאנליטיקה"
            accessibilityState={{ checked: analyticsOn, disabled: record.isPending }}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>
        {error ? (
          <AppText variant="caption" color="dangerText" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
      </Card>

      <SectionHeader title="היסטוריה" />
      <Card>
        {rows.length === 0 ? (
          <AppText color="textSecondary">אין רישומים.</AppText>
        ) : (
          rows.slice(0, 30).map((row) => (
            <AppText key={row.id} variant="caption">
              {`${formatDate(row.created_at.slice(0, 10))} ${formatTime(row.created_at)} – ${TYPE_LABELS[row.consent_type]}: ${row.granted ? 'אושר' : 'בוטל'} (${SOURCE_LABELS[row.source]})`}
            </AppText>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  item: {
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
