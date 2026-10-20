import { AppText, Button, Screen } from '@/components/ui';
import { useUser } from '@/features/auth/AuthProvider';
import { useActiveDog, useSetActiveDog } from '@/features/dogs/hooks';
import { BusinessFooter } from '@/features/legal/components';
import { resetCookieConsent } from '@/features/legal/hooks/cookieConsent';

import { DeleteAccountPanel } from './components/DeleteAccountPanel';
import { DogsSection } from './components/DogsSection';
import { PrivacySection } from './components/PrivacySection';
import { ToolsSection } from './components/ToolsSection';
import { useAccountActions } from './hooks/useAccountActions';

/** Profile and settings: the user's dogs, tools, privacy controls, sign-out and account deletion. */
export function ProfileScreen() {
  const user = useUser();
  const { dogs, activeDog, isLoading, error, hasData, refetch } = useActiveDog();
  const setActive = useSetActiveDog();
  const account = useAccountActions(user.email);

  return (
    <Screen
      parallaxHeader={
        <AppText variant="title" accessibilityRole="header">
          פרופיל והגדרות
        </AppText>
      }
    >
      <DogsSection
        dogs={dogs}
        activeDogId={activeDog?.id}
        isLoading={isLoading}
        error={error}
        hasData={hasData}
        onRetry={() => void refetch()}
        onActivate={(dogId) => setActive.mutate(dogId)}
      />
      <ToolsSection />
      <PrivacySection email={user.email} exporting={account.exporting} onExport={account.exportData} onCookieSettings={resetCookieConsent} />

      {account.message ? (
        <AppText color={account.message.kind === 'error' ? 'dangerText' : 'success'} accessibilityRole="alert">
          {account.message.text}
        </AppText>
      ) : null}

      <Button title="יציאה מהחשבון" variant="secondary" icon="log-out-outline" onPress={account.signOut} />
      <DeleteAccountPanel deleting={account.deleting} onConfirm={account.deleteAccount} />
      <BusinessFooter />
    </Screen>
  );
}
