import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_AREA, typography } from '@/constants/theme';

import { LEGAL_DOCUMENTS, type LegalDocId } from '../documents';

/** Underlined link to a legal document, padded to a 44pt touch target. */
export function LegalLink({ doc, label }: { doc: LegalDocId; label?: string }) {
  return (
    <Link href={{ pathname: '/legal/[doc]', params: { doc } }} accessibilityRole="link" style={styles.link}>
      {label ?? LEGAL_DOCUMENTS[doc].title}
    </Link>
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
});
