import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { colors, fonts, MIN_TOUCH_AREA, typography } from '@/constants/theme';

import { LEGAL_DOCUMENTS, type LegalDocId } from '../documents';

/**
 * `inline` links sit inside sentences, where the underline is the non-color cue WCAG 1.4.1 needs.
 * `meta` links stand alone in a footer row and drop the underline; semibold weight against the regular
 * footer details is their non-color cue.
 */
export type LegalLinkTone = 'inline' | 'meta';

/** Link to a legal document, padded to a 44pt touch target. */
export function LegalLink({ doc, label, tone = 'inline' }: { doc: LegalDocId; label?: string; tone?: LegalLinkTone }) {
  return (
    <Link href={{ pathname: '/legal/[doc]', params: { doc } }} accessibilityRole="link" style={styles[tone]}>
      {label ?? LEGAL_DOCUMENTS[doc].title}
    </Link>
  );
}

const styles = StyleSheet.create({
  inline: {
    ...typography.label,
    color: colors.primary,
    textDecorationLine: 'underline',
    // Pads the 20pt line to a 44pt touch target.
    paddingVertical: (MIN_TOUCH_AREA - (typography.label.lineHeight ?? 20)) / 2,
  },
  meta: {
    ...typography.caption,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textDecorationLine: 'none',
    paddingVertical: (MIN_TOUCH_AREA - (typography.caption.lineHeight ?? 18)) / 2,
  },
});
