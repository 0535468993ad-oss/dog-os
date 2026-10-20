import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterAt, PressableScale } from '@/components/motion';
import { AppText, Badge, Button, Card, ErrorState, LoadingState, Screen, SectionHeader, TextField } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';
import { SIZE_SHORT_LABELS } from '@/features/dogs/breeds';
import { DogAvatar } from '@/features/dogs/components';
import { useActiveDog, useSetActiveDog } from '@/features/dogs/hooks';
import { BusinessFooter } from '@/features/legal/components';
import { resetCookieConsent } from '@/features/legal/cookieConsent';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/theme';
import { formatAge } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { deleteMyAccount, exportMyData } from './api';

const DELETE_PHRASE = 'מחיקה';

export function ProfileScreen() {
  const user = useUser();
  const { dogs, activeDog, isLoading, error, refetch } = useActiveDog();
  const setActive = useSetActiveDog();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  const runExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await exportMyData(user.email);
      setMessage({ kind: 'info', text: 'קובץ המידע הופק.' });
    } catch (e) {
      setMessage({ kind: 'error', text: toUserMessage(e, 'הייצוא נכשל. נסו שוב.') });
    } finally {
      setExporting(false);
    }
  };

  const runDelete = async () => {
    setDeleting(true);
    setMessage(null);
    try {
      await deleteMyAccount();
      // The auth listener moves to the sign-in screen.
    } catch (e) {
      setDeleting(false);
      setMessage({ kind: 'error', text: toUserMessage(e, 'מחיקת החשבון נכשלה. נסו שוב או פנו אלינו.') });
    }
  };

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          פרופיל והגדרות
        </AppText>
      }
    >
      <SectionHeader title="הכלבים שלי" action={<Button title="הוספה" icon="add" variant="ghost" compact onPress={() => router.push('/dogs/edit')} accessibilityLabel="הוספת כלב" />} />
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={toUserMessage(error)} onRetry={() => void refetch()} />
      ) : dogs.length === 0 ? (
        <Card>
          <AppText color="textSecondary">עדיין לא הוספתם כלב.</AppText>
          <Button title="הוספת כלב" onPress={() => router.push('/dogs/edit')} />
        </Card>
      ) : (
        dogs.map((dog, index) => {
          const isActive = dog.id === activeDog?.id;
          return (
            <Animated.View key={dog.id} entering={enterAt(index)}>
              <Card>
                <View style={styles.row}>
                  <DogAvatar dog={dog} size={56} />
                  <View style={styles.flex}>
                    <View style={styles.row}>
                      <AppText variant="subheading">{dog.name}</AppText>
                      {isActive ? <Badge label="פעיל" tone="primary" icon="checkmark" /> : null}
                    </View>
                    <AppText variant="caption" color="textSecondary">
                      {`${dog.breed} · ${formatAge(dog.birth_date)} · ${SIZE_SHORT_LABELS[dog.size]}${dog.weight_kg != null ? ` · ${dog.weight_kg} ק״ג` : ''}`}
                    </AppText>
                  </View>
                </View>
                <View style={styles.actions}>
                  {!isActive ? <Button title="הפוך לפעיל" variant="secondary" compact onPress={() => setActive.mutate(dog.id)} accessibilityLabel={`הפיכת ${dog.name} לכלב הפעיל`} /> : null}
                  <Button title="עריכה" variant="secondary" compact onPress={() => router.push({ pathname: '/dogs/edit', params: { id: dog.id } })} accessibilityLabel={`עריכת הפרופיל של ${dog.name}`} />
                </View>
              </Card>
            </Animated.View>
          );
        })
      )}

      <SectionHeader title="כלים" />
      <Card>
        <SettingsRow icon="book-outline" label="יומן התנהגות" onPress={() => router.push('/journal')} />
        <SettingsRow icon="document-text-outline" label="דוח לווטרינר / מאלף" onPress={() => router.push('/report')} />
      </Card>

      <SectionHeader title="פרטיות ומידע" />
      <Card>
        <AppText variant="caption" color="textSecondary">{`מחובר/ת כ-${user.email ?? ''}`}</AppText>
        <SettingsRow icon="key-outline" label="שינוי סיסמה" onPress={() => router.push('/account/password')} />
        <SettingsRow icon="download-outline" label={exporting ? 'מייצא…' : 'ייצוא המידע שלי (JSON)'} onPress={runExport} disabled={exporting} />
        <SettingsRow icon="checkbox-outline" label="ניהול הסכמות" onPress={() => router.push('/consents')} />
        <SettingsRow icon="mail-outline" label="פניות פרטיות, נגישות ויצירת קשר" onPress={() => router.push('/requests')} />
        {Platform.OS === 'web' ? <SettingsRow icon="options-outline" label="הגדרות עוגיות" onPress={resetCookieConsent} /> : null}
        <SettingsRow icon="shield-checkmark-outline" label="מדיניות פרטיות" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} />
        <SettingsRow icon="reader-outline" label="תקנון ותנאי שימוש" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} />
        <SettingsRow icon="accessibility-outline" label="הצהרת נגישות" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'accessibility' } })} />
        <SettingsRow icon="cash-outline" label="מדיניות ביטולים והחזרים" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'refunds' } })} />
        <SettingsRow icon="ellipse-outline" label="מדיניות עוגיות" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'cookies' } })} />
        <SettingsRow icon="code-slash-outline" label="רישיונות קוד פתוח, גופנים ואייקונים" onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'licenses' } })} />
      </Card>

      {message ? (
        <AppText color={message.kind === 'error' ? 'dangerText' : 'success'} accessibilityRole="alert">
          {message.text}
        </AppText>
      ) : null}

      <Button title="יציאה מהחשבון" variant="secondary" icon="log-out-outline" onPress={() => void signOut()} />

      {deleteOpen ? (
        <Card tone="danger">
          <AppText variant="subheading" color="dangerText">
            מחיקת חשבון לצמיתות
          </AppText>
          <AppText>כל המידע – כלבים, רשומות בריאות, אימונים, יומן, שיחות ותמונות – יימחק ולא ניתן יהיה לשחזר אותו. מומלץ לייצא את המידע קודם.</AppText>
          <TextField label={`הקלידו ״${DELETE_PHRASE}״ לאישור`} value={deletePhrase} onChangeText={setDeletePhrase} autoCapitalize="none" />
          <View style={styles.actions}>
            <Button title="ביטול" variant="secondary" onPress={() => setDeleteOpen(false)} />
            <Button title="מחיקת החשבון" variant="danger" onPress={runDelete} loading={deleting} disabled={deletePhrase.trim() !== DELETE_PHRASE} />
          </View>
        </Card>
      ) : (
        <Button title="מחיקת החשבון" variant="ghost" onPress={() => setDeleteOpen(true)} />
      )}

      <BusinessFooter />
    </Screen>
  );
}

function SettingsRow({ icon, label, onPress, disabled }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={styles.settingsRow}
    >
      <Ionicons name={icon} size={22} color={colors.primary} accessible={false} />
      <AppText style={styles.flex}>{label}</AppText>
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA + 4,
    borderRadius: radius.md,
  },
});
