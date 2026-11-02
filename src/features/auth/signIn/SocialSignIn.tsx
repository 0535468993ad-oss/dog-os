import Ionicons from '@expo/vector-icons/Ionicons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, FeedbackBanner } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import { GoogleMark } from './GoogleMark';
import { PROVIDER_NAME, socialLabel } from './socialLogic';
import { useSocialSignIn } from './useSocialSignIn';

/**
 * "Or continue with" and the Google / Apple row. On iOS Apple's own button is used, as App Store rules
 * require; it is white because Apple's guidelines reserve that style for dark backgrounds.
 */
export function SocialSignIn({ disabled }: { disabled: boolean }) {
  const social = useSocialSignIn();
  const inactive = disabled || social.busy !== null;

  return (
    <View style={styles.root}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color="textSecondary">
          או המשיכו עם
        </AppText>
        <View style={styles.line} />
      </View>

      <View style={styles.row}>
        {social.buttons.map((button) =>
          button.method === 'native' ? (
            <AppleAuthentication.AppleAuthenticationButton
              key={button.provider}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={radius.md}
              style={styles.appleNative}
              onPress={() => void social.start(button)}
            />
          ) : (
            <PressableScale
              key={button.provider}
              onPress={() => void social.start(button)}
              disabled={inactive}
              accessibilityRole="button"
              accessibilityLabel={socialLabel(button.provider)}
              accessibilityState={{ disabled: inactive, busy: social.busy === button.provider }}
              style={[styles.button, inactive && styles.inactive]}
            >
              {social.busy === button.provider ? (
                <ActivityIndicator color={colors.primaryBright} />
              ) : button.provider === 'google' ? (
                <GoogleMark />
              ) : (
                <Ionicons name="logo-apple" size={20} color={colors.textPrimary} accessible={false} />
              )}
              <AppText variant="label">{PROVIDER_NAME[button.provider]}</AppText>
            </PressableScale>
          ),
        )}
      </View>

      <FeedbackBanner feedback={social.feedback} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  inactive: {
    opacity: 0.6,
  },
  // Apple's button needs an explicit size and takes no background or radius from styles.
  appleNative: {
    flex: 1,
    height: MIN_TOUCH_AREA + 4,
  },
});
