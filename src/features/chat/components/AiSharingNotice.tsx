import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import type { AiSharing } from '@/features/legal/types';
import { spacing } from '@/theme';

import { composerWrapStyle } from './ChatComposer';

/** Replaces the composer while AI data sharing is off (or not yet known): nothing is sent to the AI. */
export function AiSharingNotice({ state }: { state: Exclude<AiSharing, 'allowed'> }) {
  const optedOut = state === 'opted_out';
  return (
    <View style={composerWrapStyle}>
      <View style={styles.notice} accessible accessibilityRole="summary">
        <AppText variant="label">{optedOut ? 'שיתוף מידע עם היועץ החכם כבוי' : 'בודקים את הגדרות הפרטיות…'}</AppText>
        {optedOut ? (
          <AppText variant="caption" color="textSecondary">
            ביקשתם שהמידע שלכם לא יישלח לספק הבינה המלאכותית, ולכן היועץ לא זמין. אפשר לשנות זאת בכל עת.
          </AppText>
        ) : null}
      </View>
      {optedOut ? <Button title="ניהול הסכמות" variant="secondary" compact onPress={() => router.push('/consents')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: spacing.xxs,
    paddingBottom: spacing.xs,
  },
});
