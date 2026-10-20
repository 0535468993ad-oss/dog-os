import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, Card, FeedbackBanner, Screen, TextField, type Feedback, type TextFieldHandle } from '@/components/ui';
import { NETWORK_ERROR } from '@/utils/errors';

import { MIN_PASSWORD_LENGTH, signOut, updatePassword } from './api';

/** Sets a new password – reached from Profile, or from the password recovery email link. */
export function PasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const confirmRef = useRef<TextFieldHandle>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים.`;
    if (confirm !== password) next.confirm = 'הסיסמאות אינן תואמות.';
    setErrors(next);
    if (Object.keys(next).length > 0 || saving) return;

    setSaving(true);
    setFeedback(null);
    try {
      const result = await updatePassword(password);
      if (result.ok) {
        setPassword('');
        setConfirm('');
        setFeedback({ kind: 'success', text: 'הסיסמה עודכנה.' });
      } else {
        setFeedback({ kind: 'error', text: result.message });
        setNeedsSignIn(result.code === 'reauthentication_needed' || result.code === 'session_not_found');
      }
    } catch {
      setFeedback({ kind: 'error', text: NETWORK_ERROR });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['bottom']} contentStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'הגדרת סיסמה' }} />
      <AppText color="textSecondary">בחרו סיסמה חדשה. מומלץ סיסמה ארוכה שאינה משמשת אתכם באתרים אחרים.</AppText>
      <Card>
        <TextField
          label="סיסמה חדשה"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint={`לפחות ${MIN_PASSWORD_LENGTH} תווים`}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="אימות סיסמה"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <FeedbackBanner feedback={feedback} />
        <Button title="שמירת הסיסמה" onPress={submit} loading={saving} fullWidth />
        {feedback?.kind === 'success' ? <Button title="חזרה לאפליקציה" variant="secondary" onPress={() => router.replace('/')} fullWidth /> : null}
        {needsSignIn ? <Button title="התחברות מחדש" variant="secondary" onPress={() => void signOut()} fullWidth /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 480,
  },
});
