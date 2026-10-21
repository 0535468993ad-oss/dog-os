import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { EmergencyAlert } from '../types';
import { EMERGENCY_CONTACTS_HE } from '../utils/safetyGuardrails';

interface EmergencyAlertPanelProps {
  alerts: readonly EmergencyAlert[];
  /** The message wasn't about an emergency after all – send it to the advisor. */
  onSendAnyway: () => void;
  /** Close the card and put the message back in the composer. */
  onClose: () => void;
}

/** Fixed first-aid steps for an emergency the guardrail caught, shown instantly instead of an AI answer. */
export function EmergencyAlertPanel({ alerts, onSendAnyway, onClose }: EmergencyAlertPanelProps) {
  return (
    <View style={styles.panel}>
      {/* Only the headline is the live alert, so screen readers announce it once instead of the whole card. */}
      <View style={styles.header} accessible accessibilityRole="alert">
        <Ionicons name="warning" size={24} color={colors.dangerText} accessible={false} />
        <AppText variant="heading" color="dangerText" style={styles.flex}>
          אם זה כבר קרה – זה מצב חירום
        </AppText>
      </View>
      <AppText color="textSecondary">לא מחכים לתשובה מהיועץ. אלה הצעדים הראשונים:</AppText>

      {alerts.map((alert) => (
        <View key={`${alert.kind}-${alert.titleHe}`} style={styles.section}>
          <AppText variant="subheading">{alert.titleHe}</AppText>
          <AppText variant="caption" color="textSecondary">
            {alert.whyHe}
          </AppText>
          <BulletList items={alert.actionsHe} />
          <AppText variant="label" color="dangerText">
            {alert.avoidHe.join(' ')}
          </AppText>
        </View>
      ))}

      <View style={styles.section}>
        <AppText variant="subheading">למי להתקשר</AppText>
        <BulletList items={EMERGENCY_CONTACTS_HE} />
      </View>

      <Button title="זו לא בעיה דחופה – לשלוח ליועץ" variant="secondary" onPress={onSendAnyway} fullWidth />
      <Button title="סגירה" variant="ghost" onPress={onClose} accessibilityHint="ההודעה תחזור לתיבת הכתיבה" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  section: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
});
