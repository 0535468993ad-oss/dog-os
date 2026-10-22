import { Linking } from 'react-native';

import { Button } from '@/components/ui';
import { reportError } from '@/utils/errors';

/** Opens an organisation's website in the browser; a failure is reported, never thrown at the user. */
export function ExternalLinkButton({ url, label }: { url: string; label: string }) {
  return (
    <Button
      title={label}
      variant="ghost"
      compact
      icon="open-outline"
      accessibilityHint="נפתח בדפדפן"
      onPress={() => {
        Linking.openURL(url).catch((error: unknown) => reportError(error, 'breed-match/openURL'));
      }}
    />
  );
}
