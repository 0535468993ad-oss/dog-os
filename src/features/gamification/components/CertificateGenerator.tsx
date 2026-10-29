import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, showToast } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { exportReportPdf } from '@/features/report/exportFiles';
import { reportError } from '@/utils/errors';

import { buildCertificateHtml, certificateTitle, hebrewDate, type CertificateData } from '../utils/certificate';

/** Level 5 / 10 reward: a diploma preview with the dog's name, breed and date, saved or shared as a PDF. */
export function CertificateGenerator(data: CertificateData) {
  const [busy, setBusy] = useState(false);
  const title = certificateTitle(data.kind);

  const exportPdf = async () => {
    setBusy(true);
    try {
      await exportReportPdf(buildCertificateHtml(data), `${title} – ${data.dogName}`);
    } catch (error) {
      reportError(error, 'gamification/certificate');
      showToast('לא הצלחנו להכין את התעודה. נסו שוב.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.frame} accessible accessibilityLabel={`${title}: ${data.dogName}${data.breed ? `, ${data.breed}` : ''}, ${hebrewDate(data.completedOn)}`}>
        <AppText variant="title" color="accentBronze" center>
          {title}
        </AppText>
        <AppText variant="display" center>
          {data.dogName}
        </AppText>
        {data.breed ? (
          <AppText color="textSecondary" center>
            {data.breed}
          </AppText>
        ) : null}
        <AppText variant="caption" color="accentGold" center>{`דרגה: ${data.rankTitleHe} · ${hebrewDate(data.completedOn)}`}</AppText>
      </View>
      <Button title="שמירה ושיתוף כ־PDF" icon="download-outline" onPress={() => void exportPdf()} loading={busy} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  frame: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.accentBronze,
    backgroundColor: colors.surface,
  },
});
