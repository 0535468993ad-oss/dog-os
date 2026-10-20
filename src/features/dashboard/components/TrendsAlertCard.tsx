import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterAt, PressableScale } from '@/components/motion';
import { AppText, Card } from '@/components/ui';
import { colors, fonts, MIN_TOUCH_AREA, radius, spacing } from '@/theme';

import type { TrendAlert, TrendKind, TrendTone } from '../logic/trendAlerts';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<TrendKind, IconName> = {
  ticks: 'bug-outline',
  heat: 'sunny-outline',
  caterpillars: 'leaf-outline',
  cold: 'snow-outline',
  vaccination: 'medkit-outline',
};

// Badge fills are the vivid accents with navy text (4.7:1 / 5.0:1); icons sit on the tint in the deep shade.
const TONES: Record<TrendTone, { fill: string; tint: string; icon: string }> = {
  alert: { fill: colors.alert, tint: colors.alertMuted, icon: colors.alertText },
  health: { fill: colors.health, tint: colors.healthMuted, icon: colors.healthText },
};

/** "Health & trends" card: vet reminders and seasonal hazards, each entering with a spring. */
export function TrendsAlertCard({ alerts }: { alerts: readonly TrendAlert[] }) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="pulse" size={18} color={colors.healthText} accessible={false} />
        </View>
        <AppText variant="heading" accessibilityRole="header" style={styles.flex}>
          בריאות ומגמות
        </AppText>
      </View>
      {alerts.map((alert, index) => (
        <Animated.View key={alert.id} entering={enterAt(index)}>
          <TrendAlertRow alert={alert} />
        </Animated.View>
      ))}
    </Card>
  );
}

/** One alert, read as a single element: "badge: title. body". Vet reminders are buttons to the Health tab. */
function TrendAlertRow({ alert }: { alert: TrendAlert }) {
  const tone = TONES[alert.tone];
  const label = `${alert.badge}: ${alert.title}. ${alert.body}`;
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: tone.tint }]}>
        <Ionicons name={ICONS[alert.kind]} size={20} color={tone.icon} accessible={false} />
      </View>
      <View style={[styles.flex, styles.text]}>
        <View style={[styles.badge, { backgroundColor: tone.fill }]}>
          <AppText variant="caption" style={styles.badgeText}>
            {alert.badge}
          </AppText>
        </View>
        <AppText variant="subheading">{alert.title}</AppText>
        <AppText variant="caption" color="textSecondary">
          {alert.body}
        </AppText>
      </View>
      {alert.opensHealth ? <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} /> : null}
    </>
  );

  if (alert.opensHealth) {
    return (
      <PressableScale onPress={() => router.push('/health')} accessibilityRole="button" accessibilityLabel={label} accessibilityHint="פתיחת מסך הבריאות" style={styles.row}>
        {content}
      </PressableScale>
    );
  }
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.healthMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: MIN_TOUCH_AREA,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    gap: spacing.xxs,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
  },
});
