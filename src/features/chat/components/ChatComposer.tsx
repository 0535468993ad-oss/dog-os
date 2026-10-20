import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/motion';

import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, shadow, spacing, typography } from '@/theme';

import { MAX_MESSAGE_LENGTH } from '../logic/chatMessages';

interface ChatComposerProps {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
  sending: boolean;
  error: string | null;
}

/** Message input with send button; shows the last send/clear error above it. */
export function ChatComposer({ draft, onChangeDraft, onSubmit, placeholder, sending, error }: ChatComposerProps) {
  const [focused, setFocused] = useState(false);
  const disabled = !draft.trim() || sending;
  return (
    <View style={styles.wrap}>
      {error ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="הודעה ליועץ"
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          textAlign="right"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, focused && styles.inputFocused]}
          onSubmitEditing={onSubmit}
          submitBehavior="submit"
        />
        <PressableScale
          onPress={onSubmit}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="שליחה"
          accessibilityState={{ disabled, busy: sending }}
          style={[styles.send, disabled && styles.sendDisabled]}
        >
          {/* "send" points right; in RTL the send direction is left */}
          <Ionicons name="send" size={20} color={colors.onPrimary} style={styles.sendIcon} accessible={false} />
        </PressableScale>
      </View>
    </View>
  );
}

/** Container style shared with the notice that replaces the composer. */
export const composerWrapStyle = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
}).wrap;

const styles = StyleSheet.create({
  wrap: composerWrapStyle,
  error: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH_AREA,
    maxHeight: 140,
    writingDirection: 'rtl',
  },
  // Focus: thicker dark-blue boundary on a white field (8.1:1), matching TextField.
  inputFocused: {
    borderWidth: 2,
    borderColor: colors.focus,
    backgroundColor: colors.surface,
  },
  send: {
    width: MIN_TOUCH_AREA,
    height: MIN_TOUCH_AREA,
    borderRadius: MIN_TOUCH_AREA / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    transform: [{ scaleX: -1 }],
  },
});
