import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen, SectionHeader } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { LegalLink } from '@/features/legal/components';
import type { SupportRequestType } from '@/lib/database.types';
import { spacing } from '@/theme';

import { SupportRequestForm } from './components/SupportRequestForm';
import { SupportRequestList } from './components/SupportRequestList';
import { useSupportRequestForm } from './hooks/useSupportRequestForm';
import { useSupportRequests } from './hooks/useSupportRequests';

/** Privacy-rights, accessibility and general requests: the form and the user's request history. */
export function RequestsScreen({ initialType }: { initialType?: SupportRequestType }) {
  const user = useUser();
  const requests = useSupportRequests();
  const form = useSupportRequestForm(initialType);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'פניות פרטיות ונגישות' }} />
      <AppText color="textSecondary">
        כאן ניתן לממש את הזכויות שלכם לפי חוק הגנת הפרטיות, לדווח על בעיית נגישות או לפנות אלינו בכל נושא. הפנייה נשמרת בחשבון שלכם וניתן לעקוב אחרי הסטטוס שלה.
      </AppText>
      <View style={styles.links}>
        <LegalLink doc="privacy" />
        <LegalLink doc="accessibility" />
      </View>

      <SupportRequestForm
        values={form.values}
        errors={form.errors}
        feedback={form.feedback}
        submitting={form.submitting}
        accountEmail={user.email}
        onChange={form.setField}
        onSubmit={() => void form.submit()}
      />

      <SectionHeader title="הפניות שלי" />
      <SupportRequestList requests={requests.data} isLoading={requests.isLoading} error={requests.error} onRetry={() => void requests.refetch()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
