import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, ChipGroup, ErrorState, FeedbackBanner, LoadingState, Screen, SectionHeader, TextField, type Feedback } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { LegalLink } from '@/features/legal/components';
import type { SupportRequestStatus, SupportRequestType } from '@/lib/database.types';
import { spacing } from '@/theme';
import { formatDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, SupportRateLimitError } from './api';
import { useCreateSupportRequest, useSupportRequests } from './hooks';

const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABELS) as SupportRequestType[]).map((value) => ({ value, label: REQUEST_TYPE_LABELS[value] }));

const STATUS_TONE: Record<SupportRequestStatus, 'info' | 'warning' | 'success'> = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
};

const TYPE_HINTS: Partial<Record<SupportRequestType, string>> = {
  privacy_access: 'אפשר גם לייצא את כל המידע מיד: פרופיל ← ״ייצוא המידע שלי״.',
  privacy_correction: 'רוב המידע ניתן לעריכה ישירה באפליקציה. פרטו כאן מה לא הצלחתם לתקן.',
  privacy_deletion: 'מחיקת החשבון וכל המידע זמינה מיד: פרופיל ← ״מחיקת החשבון״. כאן ניתן לבקש מחיקה חלקית.',
  accessibility: 'תארו את המסך, המכשיר והטכנולוגיה המסייעת (למשל קורא מסך) שבה השתמשתם.',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  type?: string;
  subject?: string;
  message?: string;
  email?: string;
}

export function RequestsScreen({ initialType }: { initialType?: SupportRequestType }) {
  const user = useUser();
  const requests = useSupportRequests();
  const create = useCreateSupportRequest();

  const [type, setType] = useState<SupportRequestType | null>(initialType ?? null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const submit = async () => {
    const next: FormErrors = {};
    if (!type) next.type = 'בחרו את סוג הפנייה.';
    if (subject.trim().length < 2) next.subject = 'הזינו נושא קצר.';
    if (message.trim().length < 10) next.message = 'פרטו את הפנייה (10 תווים לפחות).';
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) next.email = 'כתובת האימייל אינה תקינה.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !type) return;

    setFeedback(null);
    try {
      await create.mutateAsync({
        requestType: type,
        subject: subject.trim(),
        message: message.trim(),
        contactEmail: email.trim() || null,
      });
      setSubject('');
      setMessage('');
      setEmail('');
      setFeedback({ kind: 'success', text: 'הפנייה התקבלה. נשיב לאימייל שלכם, ובפניות פרטיות – תוך 30 יום לכל היותר.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof SupportRateLimitError ? 'שלחתם כבר כמה פניות היום. נסו שוב מחר או כתבו לנו באימייל.' : toUserMessage(error, 'שליחת הפנייה נכשלה. נסו שוב.'),
      });
    }
  };

  const hint = type ? TYPE_HINTS[type] : undefined;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'פניות פרטיות ונגישות' }} />
      <AppText color="textSecondary">
        כאן ניתן לממש את הזכויות שלכם לפי חוק הגנת הפרטיות, לדווח על בעיית נגישות או לפנות אלינו בכל נושא. הפנייה נשמרת בחשבון שלכם וניתן לעקוב אחרי הסטטוס שלה.
      </AppText>
      <View style={styles.links}>
        <LegalLink doc="privacy" />
        <LegalLink doc="accessibility" />
      </View>

      <Card>
        <View style={styles.group}>
          <AppText variant="label" color="textSecondary">
            סוג הפנייה
          </AppText>
          <ChipGroup options={TYPE_OPTIONS} value={type} onChange={setType} accessibilityLabel="סוג הפנייה" />
          {errors.type ? (
            <AppText variant="caption" color="dangerText" accessibilityRole="alert">
              {errors.type}
            </AppText>
          ) : null}
          {hint ? (
            <AppText variant="caption" color="info">
              {hint}
            </AppText>
          ) : null}
        </View>
        <TextField label="נושא" value={subject} onChangeText={setSubject} error={errors.subject} maxLength={120} />
        <TextField label="פירוט" value={message} onChangeText={setMessage} error={errors.message} maxLength={4000} multiline />
        <TextField
          label="אימייל לחזרה"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          optional
          hint={`אם ריק – נשיב ל-${user.email ?? 'אימייל החשבון'}`}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          inputMode="email"
          maxLength={254}
        />
        <FeedbackBanner feedback={feedback} />
        <Button title="שליחת הפנייה" onPress={submit} loading={create.isPending} fullWidth />
      </Card>

      <SectionHeader title="הפניות שלי" />
      {requests.isLoading ? (
        <LoadingState />
      ) : requests.error ? (
        <ErrorState message={toUserMessage(requests.error)} onRetry={() => void requests.refetch()} />
      ) : !requests.data?.length ? (
        <AppText color="textSecondary">עדיין לא שלחתם פניות.</AppText>
      ) : (
        requests.data.map((request) => (
          <Card key={request.id}>
            <View style={styles.row}>
              <AppText variant="subheading" style={styles.flex}>
                {request.subject}
              </AppText>
              <Badge label={REQUEST_STATUS_LABELS[request.status]} tone={STATUS_TONE[request.status]} />
            </View>
            <AppText variant="caption" color="textSecondary">
              {`${REQUEST_TYPE_LABELS[request.request_type]} · ${formatDate(request.created_at.slice(0, 10))}`}
            </AppText>
            <AppText numberOfLines={3}>{request.message}</AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
