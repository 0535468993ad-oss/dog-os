import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { enterAt, riseIn } from '@/components/motion';
import { AppText, Button, FeedbackBanner, TextField, type TextFieldHandle } from '@/components/ui';
import { BusinessFooter } from '@/features/legal/components';
import { colors, radius, spacing } from '@/constants/theme';

import { MIN_PASSWORD_LENGTH } from './api';
import { AuthHero } from './signIn/AuthHero';
import { heroHeight, MODE_COPY, switchTarget } from './signIn/signInLogic';
import { SignUpConsents } from './signIn/SignUpConsents';
import { SocialSignIn } from './signIn/SocialSignIn';
import { useSignInForm } from './signIn/useSignInForm';

/**
 * Sign-in, sign-up and password-reset: the hero photo with an obsidian card rising over it. Behaviour lives
 * in useSignInForm (email) and useSocialSignIn (Google / Apple).
 */
export function SignInScreen() {
  const form = useSignInForm();
  const passwordRef = useRef<TextFieldHandle>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const copy = MODE_COPY[form.mode];
  const isSignUp = form.mode === 'signUp';
  const isReset = form.mode === 'reset';

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHero height={heroHeight(height)} />

          <Animated.View entering={riseIn()} style={[styles.card, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.grabber} accessible={false} />
            <View style={styles.column}>
              <Animated.View entering={enterAt(0)} style={styles.header}>
                <AppText variant="title" accessibilityRole="header">
                  {copy.title}
                </AppText>
                <AppText color="textSecondary">{copy.caption}</AppText>
              </Animated.View>

              <Animated.View entering={enterAt(1)}>
                <TextField
                  label="אימייל"
                  icon="mail-outline"
                  tone="brand"
                  value={form.fields.email}
                  onChangeText={form.setEmail}
                  error={form.errors.email}
                  placeholder="הזינו את האימייל שלכם"
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
              </Animated.View>
              {isReset ? null : (
                <Animated.View entering={enterAt(2)}>
                  <TextField
                    ref={passwordRef}
                    label="סיסמה"
                    icon="lock-closed-outline"
                    tone="brand"
                    revealable
                    value={form.fields.password}
                    onChangeText={form.setPassword}
                    error={form.errors.password}
                    hint={isSignUp ? `לפחות ${MIN_PASSWORD_LENGTH} תווים` : undefined}
                    placeholder="הזינו את הסיסמה שלכם"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    textContentType={isSignUp ? 'newPassword' : 'password'}
                    returnKeyType="go"
                    onSubmitEditing={form.submit}
                    editable={!form.submitting}
                  />
                </Animated.View>
              )}

              {form.mode === 'signIn' ? (
                <View style={styles.options}>
                  <Button title="שכחתם סיסמה?" variant="ghost" compact onPress={() => form.switchMode('reset')} disabled={form.submitting} />
                </View>
              ) : null}

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

              <Animated.View entering={enterAt(3)} style={styles.actions}>
                <Button title={copy.submit} onPress={form.submit} loading={form.submitting} fullWidth />
                {form.canResend ? <Button title="שליחת מייל האישור שוב" variant="ghost" onPress={form.resend} disabled={form.submitting} /> : null}
              </Animated.View>

              {isReset ? null : <SocialSignIn disabled={form.submitting} />}

              <View style={styles.switchRow}>
                <AppText color="textSecondary">{copy.switchPrompt}</AppText>
                <Button title={copy.switchAction} variant="ghost" onPress={() => form.switchMode(switchTarget(form.mode))} compact disabled={form.submitting} />
              </View>

              <BusinessFooter />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  // Overlaps the photo by its own corner radius, so the hero's fade runs behind the rounded edge.
  card: {
    flexGrow: 1,
    marginTop: -radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    opacity: 0.3,
    marginBottom: spacing.md,
  },
  column: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -spacing.sm,
  },
  actions: {
    gap: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
