import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { business } from '@/config/business';
import { colors, spacing } from '@/constants/theme';

import { LegalLink } from './LegalLink';

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
        <LegalLink doc="terms" tone="meta" />
        <LegalLink doc="privacy" tone="meta" />
        <LegalLink doc="cookies" tone="meta" />
        <LegalLink doc="refunds" tone="meta" />
        <LegalLink doc="accessibility" tone="meta" />
        <LegalLink doc="licenses" label="רישיונות" tone="meta" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
