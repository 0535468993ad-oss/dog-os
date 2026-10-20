import { StyleSheet, View } from 'react-native';

import { AppText, Checkbox } from '@/components/ui';
import { LegalLink } from '@/features/legal/components';
import { AI_DISCLAIMER_TEXT } from '@/features/legal/documents';
import { spacing } from '@/constants/theme';

const TERMS_TEXT = 'אני בן/בת 18 ומעלה ומסכים/ה לתקנון ולמדיניות הפרטיות';

interface SignUpConsentsProps {
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  aiAccepted: boolean;
  onAiChange: (accepted: boolean) => void;
  errors: { terms?: string; ai?: string };
}

/** The two required sign-up consents (age + terms/privacy, and the AI disclaimer) with links to the documents. */
export function SignUpConsents({ termsAccepted, onTermsChange, aiAccepted, onAiChange, errors }: SignUpConsentsProps) {
  return (
    <View style={styles.consents}>
      <Checkbox checked={termsAccepted} onChange={onTermsChange} label={TERMS_TEXT} error={errors.terms}>
        <AppText>{TERMS_TEXT}</AppText>
        <View style={styles.links}>
          <LegalLink doc="terms" />
          <LegalLink doc="privacy" />
        </View>
      </Checkbox>
      <Checkbox checked={aiAccepted} onChange={onAiChange} label={AI_DISCLAIMER_TEXT} error={errors.ai} />
    </View>
  );
}

const styles = StyleSheet.create({
  consents: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
