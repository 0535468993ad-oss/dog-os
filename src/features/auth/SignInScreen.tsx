import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, FeedbackBanner, Screen, TextField, type TextFieldHandle } from '@/components/ui';
import { BusinessFooter } from '@/features/legal/components';
import { spacing } from '@/constants/theme';

import { MIN_PASSWORD_LENGTH } from './api';
import { BrandHero } from './signIn/BrandHero';
import { MODE_COPY, switchTarget } from './signIn/signInLogic';
import { SignUpConsents } from './signIn/SignUpConsents';
import { useSignInForm } from './signIn/useSignInForm';

/** Sign-in, sign-up and password-reset screen; behaviour lives in useSignInForm. */
export function SignInScreen() {
  const form = useSignInForm();
  const passwordRef = useRef<TextFieldHandle>(null);
  const copy = MODE_COPY[form.mode];
  const isSignUp = form.mode === 'signUp';
  const isReset = form.mode === 'reset';

  return (
    <Screen contentStyle={styles.content}>
      <BrandHero title={copy.title} />

      <Card>
        <TextField
          label="אימייל"
          value={form.fields.email}
          onChangeText={form.setEmail}
          error={form.errors.email}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          inputMode="email"
          returnKeyType={isReset ? 'go' : 'next'}
          onSubmitEditing={() => (isReset ? void form.submit() : passwordRef.current?.focus())}
          editable={!form.submitting}
        />
        {isReset ? null : (
          <TextField
            ref={passwordRef}
            label="סיסמה"
            value={form.fields.password}
            onChangeText={form.setPassword}
            error={form.errors.password}
            hint={isSignUp ? `לפחות ${MIN_PASSWORD_LENGTH} תווים` : undefined}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={form.submit}
            editable={!form.submitting}
          />
        )}

        {isSignUp ? (
          <SignUpConsents
            termsAccepted={form.fields.termsAccepted}
            onTermsChange={form.setTermsAccepted}
            aiAccepted={form.fields.aiAccepted}
            onAiChange={form.setAiAccepted}
            errors={form.errors}
          />
        ) : null}

        <FeedbackBanner feedback={form.feedback} />

        <Button title={copy.submit} onPress={form.submit} loading={form.submitting} fullWidth />
        {form.canResend ? <Button title="שליחת מייל האישור שוב" variant="ghost" onPress={form.resend} disabled={form.submitting} /> : null}
        {form.mode === 'signIn' ? <Button title="שכחתי סיסמה" variant="ghost" onPress={() => form.switchMode('reset')} disabled={form.submitting} /> : null}
      </Card>

      <View style={styles.switchRow}>
        <AppText color="textSecondary">{copy.switchPrompt}</AppText>
        <Button title={copy.switchAction} variant="ghost" onPress={() => form.switchMode(switchTarget(form.mode))} compact disabled={form.submitting} />
      </View>

      <BusinessFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 480,
    paddingTop: spacing.xl,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
