import { router } from 'expo-router';

import { Card, SectionHeader } from '@/components/ui';

import { SettingsRow } from './SettingsRow';

/** Shortcuts to the behavior journal and the vet/trainer report. */
export function ToolsSection() {
  return (
    <>
      <SectionHeader title="כלים" />
      <Card>
        <SettingsRow icon="book-outline" label="יומן התנהגות" onPress={() => router.push('/journal')} />
        <SettingsRow icon="document-text-outline" label="דוח לווטרינר / מאלף" onPress={() => router.push('/report')} />
      </Card>
    </>
  );
}
