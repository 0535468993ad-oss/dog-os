import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText, Button, Checkbox } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';

import { setCookieConsent, useCookieConsent } from '../hooks/cookieConsent';
import { LegalLink } from './LegalLink';

/** Opt-in cookie banner (web only). Nothing non-essential runs until "analytics" is accepted. */
export function CookieBanner() {
  const consent = useCookieConsent();
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  if (Platform.OS !== 'web' || consent) return null;

  return (
    <View style={styles.bannerWrap} pointerEvents="box-none">
      <View style={styles.banner} accessibilityRole="alert" aria-label="הסכמה לעוגיות">
        <AppText variant="subheading">פרטיות ועוגיות</AppText>
        <AppText variant="caption">
          אנו משתמשים רק באחסון חיוני להפעלת האתר (שמירת ההתחברות). כלי אנליטיקה, אם יתווספו, יופעלו רק באישורך.
        </AppText>
        <LegalLink doc="cookies" label="למדיניות העוגיות" />
        {customize ? (
          <View style={styles.bannerOptions}>
            <Checkbox checked disabled onChange={() => undefined} label="חיוניים – תמיד פעילים" />
            <Checkbox checked={analytics} onChange={setAnalytics} label="אנליטיקה – עוזר לנו לשפר את השירות" />
          </View>
        ) : null}
        <View style={styles.bannerActions}>
          {customize ? (
            <Button title="שמירת הבחירה" onPress={() => setCookieConsent(analytics)} compact />
          ) : (
            <>
              <Button title="אישור הכל" onPress={() => setCookieConsent(true)} compact />
              <Button title="חיוניים בלבד" variant="secondary" onPress={() => setCookieConsent(false)} compact />
              <Button title="התאמה אישית" variant="ghost" onPress={() => setCustomize(true)} compact />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    padding: spacing.md,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  bannerOptions: {
    gap: spacing.xs,
  },
  bannerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
