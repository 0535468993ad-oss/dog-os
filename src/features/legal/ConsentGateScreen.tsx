import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Checkbox, Screen } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { signOut } from '@/features/auth/api';
import { spacing } from '@/theme';
import { toUserMessage } from '@/utils/errors';

import { BusinessFooter, LegalLink } from './components';
import { useRecordConsents } from './consents';
import { AI_DISCLAIMER_TEXT, type ConsentBearingType } from './documents';

/**
 * Shown to signed-in users who haven't accepted the current versions of the Terms, Privacy Policy
 * and AI disclaimer (accounts created before consent tracking, or after a document update).
 */
export function ConsentGateScreen({ missing }: { missing: ConsentBearingType[] }) {
  const user = useUser();
  const record = useRecordConsents(user.id);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [aiAccepted, setAiAccepted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsTerms = missing.includes('terms_of_service') || missing.includes('privacy_policy');
  const needsAi = missing.includes('ai_disclaimer');

  const submit = async () => {
    if ((needsTerms && !termsAccepted) || (needsAi && !aiAccepted)) {
      setShowErrors(true);
      return;
    }
    setError(null);
    try {
      await record.mutateAsync({ types: missing, granted: true, source: 'reconsent' });
    } catch (e) {
      setError(toUserMessage(e));
    }
  };

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        עדכנו את המסמכים שלנו
      </AppText>
      <AppText color="textSecondary">כדי להמשיך להשתמש ב-Dog OS, יש לאשר את הגרסה העדכנית.</AppText>

      <View style={{ gap: spacing.md }}>
        {needsTerms ? (
          <Checkbox
            checked={termsAccepted}
            onChange={setTermsAccepted}
            label="קראתי ואני מסכים/ה לתקנון ולמדיניות הפרטיות"
            error={showErrors && !termsAccepted ? 'יש לאשר כדי להמשיך' : null}
          >
            <AppText>קראתי ואני מסכים/ה לתקנון ולמדיניות הפרטיות</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <LegalLink doc="terms" />
              <LegalLink doc="privacy" />
            </View>
          </Checkbox>
        ) : null}
        {needsAi ? (
          <Checkbox
            checked={aiAccepted}
            onChange={setAiAccepted}
            label={AI_DISCLAIMER_TEXT}
            error={showErrors && !aiAccepted ? 'יש לאשר כדי להמשיך' : null}
          />
        ) : null}
      </View>

      {error ? (
        <AppText color="dangerText" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}

      <Button title="אישור והמשך" onPress={submit} loading={record.isPending} fullWidth />
      <Button title="יציאה מהחשבון" variant="ghost" onPress={() => void signOut()} />
      <BusinessFooter />
    </Screen>
  );
}
