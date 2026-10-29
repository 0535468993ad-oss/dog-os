import { router } from 'expo-router';

import { Card, SectionHeader } from '@/components/ui';

import { SettingsList } from './SettingsList';
import { SettingsRow } from './SettingsRow';

/** Shortcuts to food safety and nutrition, the behavior journal and the vet/trainer report. */
export function ToolsSection() {
  return (
    <>
      <SectionHeader title="כלים" />
      <Card>
        <SettingsList>
          <SettingsRow icon="leaf-outline" tone="health" label="בטיחות מזון ותזונה" onPress={() => router.push('/kitchen')} />
          <SettingsRow icon="book-outline" tone="ai" label="יומן התנהגות" onPress={() => router.push('/journal')} />
          <SettingsRow icon="document-text-outline" tone="primary" label="דוח לווטרינר / מאלף" onPress={() => router.push('/report')} />
        </SettingsList>
      </Card>
    </>
  );
}
