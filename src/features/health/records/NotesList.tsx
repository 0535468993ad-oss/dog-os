import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, Button, Card, SectionHeader } from '@/components/ui';
import type { MedicalNoteRow } from '@/lib/database.types';
import { formatDate } from '@/utils/date';

/** The dog's medical notes, newest first; each opens its edit form. */
export function NotesList({ notes }: { notes: MedicalNoteRow[] }) {
  return (
    <>
      <SectionHeader
        title="הערות רפואיות"
        action={<Button title="הוספה" icon="add" variant="ghost" compact onPress={() => router.push('/health/note')} accessibilityLabel="הוספת הערה רפואית" />}
      />
      {notes.length === 0 ? (
        <Card>
          <AppText color="textSecondary">תעדו ביקורים, אבחנות ותרופות שנרשמו – זה עוזר גם ליועץ החכם וגם לדוח לווטרינר.</AppText>
        </Card>
      ) : (
        notes.map((n, index) => (
          <Animated.View key={n.id} entering={enterAt(index)}>
            <Card onPress={() => router.push({ pathname: '/health/note', params: { id: n.id } })} accessibilityLabel={`${n.title}, ${formatDate(n.noted_on)}. עריכה`}>
              <AppText variant="subheading">{n.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {formatDate(n.noted_on)}
              </AppText>
              {n.body ? <AppText numberOfLines={3}>{n.body}</AppText> : null}
            </Card>
          </Animated.View>
        ))
      )}
    </>
  );
}
