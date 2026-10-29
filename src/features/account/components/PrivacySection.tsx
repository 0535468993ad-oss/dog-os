import type Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { AppText, Card, SectionHeader } from '@/components/ui';
import type { LegalDocId } from '@/features/legal/documents';

import { SettingsList } from './SettingsList';
import { SettingsRow } from './SettingsRow';

const LEGAL_ROWS: { doc: LegalDocId; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { doc: 'privacy', label: 'מדיניות פרטיות', icon: 'shield-checkmark-outline' },
  { doc: 'terms', label: 'תקנון ותנאי שימוש', icon: 'reader-outline' },
  { doc: 'accessibility', label: 'הצהרת נגישות', icon: 'accessibility-outline' },
  { doc: 'refunds', label: 'מדיניות ביטולים והחזרים', icon: 'cash-outline' },
  { doc: 'cookies', label: 'מדיניות עוגיות', icon: 'ellipse-outline' },
  { doc: 'licenses', label: 'רישיונות קוד פתוח, גופנים ואייקונים', icon: 'code-slash-outline' },
];

interface PrivacySectionProps {
  email: string | undefined;
  exporting: boolean;
  onExport: () => void;
  /** Web only: reopens the cookie banner. */
  onCookieSettings: () => void;
}

/** "Privacy and data": account email, password, data export, consents, requests and legal documents. */
export function PrivacySection({ email, exporting, onExport, onCookieSettings }: PrivacySectionProps) {
  return (
    <>
      <SectionHeader title="פרטיות ומידע" />
      <Card>
        <AppText variant="caption" color="textSecondary">{`מחובר/ת כ-${email ?? ''}`}</AppText>
        <SettingsList>
          <SettingsRow icon="key-outline" tone="primary" label="שינוי סיסמה" onPress={() => router.push('/account/password')} />
          <SettingsRow icon="download-outline" tone="info" label={exporting ? 'מייצא…' : 'ייצוא המידע שלי (JSON)'} onPress={onExport} disabled={exporting} />
          <SettingsRow icon="checkbox-outline" tone="health" label="ניהול הסכמות" onPress={() => router.push('/consents')} />
          <SettingsRow icon="mail-outline" tone="ai" label="פניות פרטיות, נגישות ויצירת קשר" onPress={() => router.push('/requests')} />
          {Platform.OS === 'web' ? <SettingsRow icon="options-outline" tone="neutral" label="הגדרות עוגיות" onPress={onCookieSettings} /> : null}
          {LEGAL_ROWS.map(({ doc, label, icon }) => (
            <SettingsRow key={doc} icon={icon} tone="neutral" label={label} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc } })} />
          ))}
        </SettingsList>
      </Card>
    </>
  );
}
