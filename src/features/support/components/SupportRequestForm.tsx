import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, ChipGroup, FeedbackBanner, TextField, type Feedback } from '@/components/ui';
import type { SupportRequestType } from '@/lib/database.types';
import { spacing } from '@/constants/theme';

import type { SupportFormErrors, SupportFormValues } from '../types';
import { TYPE_HINTS, TYPE_OPTIONS } from '../utils/labels';

interface SupportRequestFormProps {
  values: SupportFormValues;
  errors: SupportFormErrors;
  feedback: Feedback | null;
  submitting: boolean;
  /** Where replies go when the email field is left empty. */
  accountEmail: string | undefined;
  onChange: <K extends keyof SupportFormValues>(key: K, value: SupportFormValues[K]) => void;
  onSubmit: () => void;
}

/** The new-request form: type, subject, details and an optional reply address. */
export function SupportRequestForm({ values, errors, feedback, submitting, accountEmail, onChange, onSubmit }: SupportRequestFormProps) {
  const hint = values.type ? TYPE_HINTS[values.type] : undefined;

  return (
    <Card>
      <View style={styles.group}>
        <AppText variant="label" color="textSecondary">
          סוג הפנייה
        </AppText>
        <ChipGroup options={TYPE_OPTIONS} value={values.type} onChange={(type: SupportRequestType) => onChange('type', type)} accessibilityLabel="סוג הפנייה" />
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
      <TextField label="נושא" value={values.subject} onChangeText={(text) => onChange('subject', text)} error={errors.subject} maxLength={120} />
      <TextField label="פירוט" value={values.message} onChangeText={(text) => onChange('message', text)} error={errors.message} maxLength={4000} multiline />
      <TextField
        label="אימייל לחזרה"
        value={values.email}
        onChangeText={(text) => onChange('email', text)}
        error={errors.email}
        optional
        hint={`אם ריק – נשיב ל-${accountEmail ?? 'אימייל החשבון'}`}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        inputMode="email"
        maxLength={254}
      />
      <FeedbackBanner feedback={feedback} />
      <Button title="שליחת הפנייה" onPress={onSubmit} loading={submitting} fullWidth />
    </Card>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
});
