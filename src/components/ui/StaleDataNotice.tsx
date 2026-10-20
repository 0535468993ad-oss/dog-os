import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { useIsOnline } from '@/lib/onlineStatus';

import { AppText } from './AppText';
import { Button } from './Button';

interface StaleDataNoticeProps {
  /** Show the notice: cached data is on screen but the latest refresh failed (see cacheState). */
  visible: boolean;
  onRetry: () => void;
}

/** Small banner above cached content whose refresh failed – offline or not – with a retry. */
export function StaleDataNotice({ visible, onRetry }: StaleDataNoticeProps) {
  const online = useIsOnline();
  if (!visible) return null;
  const text = online ? 'לא הצלחנו לרענן את המידע. מוצג המידע האחרון שנשמר.' : 'אין חיבור לאינטרנט. מוצג המידע האחרון שנשמר.';

  return (
    <View style={styles.notice} accessible accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={text}>
      <Ionicons name={online ? 'refresh-circle-outline' : 'cloud-offline-outline'} size={18} color={colors.warning} accessible={false} />
      <AppText variant="caption" color="warning" style={styles.text}>
        {text}
      </AppText>
      <Button title="נסו שוב" variant="ghost" compact onPress={onRetry} accessibilityLabel="ניסיון חוזר לרענן את המידע" />
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    paddingStart: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  text: {
    flex: 1,
  },
});
