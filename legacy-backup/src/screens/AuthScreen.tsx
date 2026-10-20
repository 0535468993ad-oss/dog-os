import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/constants';
import { signInWithPassword, signUpWithPassword, type Credentials } from '@/services';

type AuthMode = 'signIn' | 'signUp';

type Feedback = { kind: 'error' | 'info'; text: string } | null;

// Matches Supabase's default minimum; raise both together if the project setting changes.
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY: Record<AuthMode, { title: string; submit: string; switchPrompt: string; switchAction: string }> = {
  signIn: {
    title: 'Welcome back',
    submit: 'Sign in',
    switchPrompt: "Don't have an account?",
    switchAction: 'Sign up',
  },
  signUp: {
    title: 'Create your account',
    submit: 'Sign up',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
  },
};

function validate({ email, password }: Credentials): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const copy = COPY[mode];

  const switchMode = () => {
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
    setPassword('');
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const credentials: Credentials = { email, password };
    const validationError = validate(credentials);
    if (validationError) {
      setFeedback({ kind: 'error', text: validationError });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      if (mode === 'signIn') {
        const result = await signInWithPassword(credentials);
        // On success onAuthStateChange swaps this screen out, so only failures need handling.
        if (!result.ok) setFeedback({ kind: 'error', text: result.message });
      } else {
        const result = await signUpWithPassword(credentials);
        if (!result.ok) {
          setFeedback({ kind: 'error', text: result.message });
        } else if (result.value.needsEmailConfirmation) {
          setPassword('');
          setMode('signIn');
          setFeedback({
            kind: 'info',
            text: 'Check your email to confirm your account, then sign in.',
          });
        }
      }
    } catch {
      setFeedback({ kind: 'error', text: 'Network error. Check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>dog-os</Text>
          <Text style={styles.title}>{copy.title}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              inputMode="email"
              returnKeyType="next"
              editable={!submitting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!submitting}
            />

            {feedback ? (
              <Text
                style={[styles.feedback, feedback.kind === 'error' ? styles.error : styles.info]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {feedback.text}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (pressed || submitting) && styles.buttonPressed,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting, busy: submitting }}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>{copy.submit}</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>{copy.switchPrompt}</Text>
            <Pressable onPress={switchMode} disabled={submitting} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.switchAction}>{copy.switchAction}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: {
    ...typography.heading,
    color: colors.primary,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    marginBottom: spacing.sm,
  },
  feedback: {
    ...typography.caption,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  error: {
    color: colors.danger,
    backgroundColor: '#FBE4E4',
  },
  info: {
    color: colors.textPrimary,
    backgroundColor: colors.primaryMuted,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  switchPrompt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchAction: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});
