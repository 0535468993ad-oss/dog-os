import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Disclaimer, ErrorState, LoadingState, Screen } from '@/components/ui';
import { SIZE_LABELS } from '@/features/dogs/breeds';
import { useActiveDog } from '@/features/dogs/hooks';
import { useHealth } from '@/features/health/hooks';
import { useJournal } from '@/features/journal/hooks';
import { useTrainingSummary } from '@/features/training/hooks';
import { colors, spacing } from '@/constants/theme';
import { formatAge, todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

// Mirrors what supabase/functions/_shared/dogContext.ts loads (and chat/index.ts adds) – keep the limits in sync.
const LIMITS = { weights: 6, notes: 5, journal: 7, chatHistory: 20 };

interface Item {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail: string;
}

/** Transparency: exactly which of the dog's data is sent to the AI provider with each chat message. */
export function AdvisorContextScreen() {
  const { activeDog, isLoading: dogsLoading } = useActiveDog();
  const dogId = activeDog?.id ?? null;
  const health = useHealth(dogId);
  const journal = useJournal(dogId);
  const training = useTrainingSummary(dogId);

  if (dogsLoading || health.isLoading || journal.isLoading || training.isLoading) return <LoadingState />;
  const error = health.error ?? journal.error ?? training.error;
  if (error) return <ErrorState message={toUserMessage(error)} onRetry={() => void Promise.all([health.refetch(), journal.refetch(), training.refetch()])} />;

  if (!activeDog) {
    return (
      <Screen edges={['bottom']}>
        <AppText>לא נבחר כלב, ולכן היועץ מקבל רק את ההודעה ואת היסטוריית השיחה הכללית – בלי מידע על כלב.</AppText>
        <Button title="הוספת כלב" onPress={() => router.push('/dogs/edit')} />
      </Screen>
    );
  }

  const data = health.data;
  const today = todayIso();
  const overdue = data?.vaccinations.filter((v) => v.due_date && v.due_date < today).length ?? 0;
  const weights = Math.min(data?.weights.length ?? 0, LIMITS.weights);
  const notes = Math.min(data?.notes.length ?? 0, LIMITS.notes);
  const entries = Math.min(journal.data?.length ?? 0, LIMITS.journal);

  const items: Item[] = [
    {
      icon: 'paw-outline',
      title: 'פרטי הכלב',
      detail: `${activeDog.name} · ${activeDog.breed} · ${formatAge(activeDog.birth_date)} · ${SIZE_LABELS[activeDog.size]}${activeDog.weight_kg != null ? ` · ${activeDog.weight_kg} ק״ג` : ''}`,
    },
    { icon: 'trending-up-outline', title: 'מעקב משקל', detail: weights ? `${weights} השקילות האחרונות` : 'אין שקילות' },
    {
      icon: 'medkit-outline',
      title: 'חיסונים',
      detail: data?.vaccinations.length ? `${data.vaccinations.length} חיסונים${overdue ? `, מתוכם ${overdue} באיחור` : ''}` : 'אין חיסונים רשומים',
    },
    { icon: 'restaurant-outline', title: 'תוכנית האכלה', detail: data?.food.length ? `${data.food.length} מזונות` : 'לא הוגדרה' },
    { icon: 'document-text-outline', title: 'הערות רפואיות', detail: notes ? `${notes} ההערות האחרונות (עד 300 תווים כל אחת)` : 'אין הערות' },
    {
      icon: 'school-outline',
      title: 'אימונים',
      detail: `${training.activeModule ? `מודול פעיל: ${training.activeModule.title}` : 'אין מודול פעיל'} · ${training.completedModules} מודולים הושלמו · רצף ${training.streak} ימים`,
    },
    { icon: 'book-outline', title: 'יומן התנהגות', detail: entries ? `${entries} הרשומות האחרונות (עד 300 תווים כל אחת)` : 'אין רשומות' },
    { icon: 'heart-outline', title: 'נטיות בריאותיות של הגזע', detail: activeDog.breed_id ? 'מהאנציקלופדיה הווטרינרית של Dog OS' : 'רק לגזע שנבחר מהרשימה' },
    { icon: 'chatbubbles-outline', title: 'היסטוריית השיחה', detail: `${LIMITS.chatHistory} ההודעות האחרונות בשיחה על ${activeDog.name}` },
  ];

  return (
    <Screen edges={['bottom']}>
      <AppText color="textSecondary">
        {`כדי שלא תצטרכו לחזור על עצמכם, עם כל הודעה ליועץ נשלח תקציר של המידע הבא על ${activeDog.name}. המידע נשלח ל-Anthropic (ספק הבינה המלאכותית) רק לצורך יצירת התשובה, ולפי תנאי Anthropic אינו משמש לאימון מודלים כברירת מחדל.`}
      </AppText>
      <Card>
        {items.map((item) => (
          <View key={item.title} style={styles.row} accessible accessibilityLabel={`${item.title}: ${item.detail}`}>
            <Ionicons name={item.icon} size={22} color={colors.primary} accessible={false} />
            <View style={styles.flex}>
              <AppText variant="label">{item.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {item.detail}
              </AppText>
            </View>
          </View>
        ))}
      </Card>
      <AppText color="textSecondary">
        לא נשלחים: כתובת האימייל, הסיסמה, תמונות, מיקום או מידע על כלבים אחרים בחשבון. כדי לשנות את מה שהיועץ יודע – עדכנו או מחקו את הרשומות עצמן.
      </AppText>
      <Button title="כיבוי שיתוף המידע עם ה-AI" variant="secondary" onPress={() => router.push('/consents')} />
      <Disclaimer>תשובות היועץ הן מידע כללי ואינן מחליפות וטרינר.</Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
