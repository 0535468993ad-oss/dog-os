import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { business } from '@/config/business';
import { colors, spacing } from '@/theme';

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
