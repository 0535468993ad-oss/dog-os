import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Checkbox } from '@/components/ui';
import { business } from '@/config/business';
import { colors, MIN_TOUCH_AREA, radius, shadow, spacing, typography } from '@/theme';

import { setCookieConsent, useCookieConsent } from './cookieConsent';
import { LEGAL_DOCUMENTS, type LegalDocId } from './documents';

export function LegalLink({ doc, label }: { doc: LegalDocId; label?: string }) {
  return (
    <Link href={{ pathname: '/legal/[doc]', params: { doc } }} accessibilityRole="link" style={styles.link}>
      {label ?? LEGAL_DOCUMENTS[doc].title}
    </Link>
  );
}

/** Registered business details – required on every public surface. */
export function BusinessFooter() {
  return (
    <View style={styles.footer} role="contentinfo">
      <AppText variant="caption" color="textSecondary">
        {`${business.legalName} · ${business.registrationNumber}`}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {`${business.address} · ${business.email}`}
      </AppText>
      <View style={styles.footerLinks}>
        <LegalLink doc="terms" />
        <LegalLink doc="privacy" />
        <LegalLink doc="cookies" />
        <LegalLink doc="refunds" />
        <LegalLink doc="accessibility" />
        <LegalLink doc="licenses" label="רישיונות" />
      </View>
    </View>
  );
}

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

interface PriceDisclosureProps {
  planName: string;
  /** Total aggregate price in ILS, VAT included. */
  totalPrice: number;
  installments: number;
  /** e.g. "חודשי" / "שנתי"; omit for a one-time purchase. */
  recurringPeriod?: string;
  nextChargeDate?: string;
}

/**
 * Mandatory pre-purchase disclosure (Consumer Protection Law): installments, amount per installment,
 * total price, recurring terms and cancellation rights. Render above every checkout button.
 */
export function PriceDisclosure({ planName, totalPrice, installments, recurringPeriod, nextChargeDate }: PriceDisclosureProps) {
  const perInstallment = Math.round((totalPrice / installments) * 100) / 100;
  const fmt = (n: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(n);

  return (
    <Card tone="info" accessibilityLabel="פרטי תשלום">
      <AppText variant="subheading">{`פרטי התשלום – ${planName}`}</AppText>
      <AppText>{`מחיר כולל (כולל מע״מ): ${fmt(totalPrice)}`}</AppText>
      <AppText>{`מספר תשלומים: ${installments}`}</AppText>
      <AppText>{`סכום כל תשלום: ${fmt(perInstallment)}`}</AppText>
      {recurringPeriod ? (
        <AppText>{`חיוב מתחדש: ${recurringPeriod}, עד לביטול${nextChargeDate ? `. החיוב הבא: ${nextChargeDate}` : ''}`}</AppText>
      ) : (
        <AppText>חיוב חד-פעמי, ללא חידוש אוטומטי.</AppText>
      )}
      <AppText variant="caption">
        ניתן לבטל בתוך 14 יום מהרכישה, ומינוי מתחדש – בכל עת (הביטול נכנס לתוקף תוך 3 ימי עסקים).
      </AppText>
      <LegalLink doc="refunds" label="למדיניות הביטולים וההחזרים המלאה" />
    </Card>
  );
}

const styles = StyleSheet.create({
  link: {
    ...typography.label,
    color: colors.primary,
    textDecorationLine: 'underline',
    // Pads the 20pt line to a 44pt touch target.
    paddingVertical: (MIN_TOUCH_AREA - (typography.label.lineHeight ?? 20)) / 2,
  },
  footer: {
    gap: spacing.xxs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
  },
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
