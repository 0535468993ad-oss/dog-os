import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';

import { AppText } from './AppText';

/** A group heading: bold and bright so it outranks the optional action (e.g. "+ הוספה") beside it. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="section" color="textPrimary" accessibilityRole="header" style={styles.flex}>
        {title}
      </AppText>
      {action}
    </View>
  );
}

/** A labelled progress track; an empty one still shows a dim stub so it doesn't read as a dead line. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct}%` }}
    >
      {pct > 0 ? <View style={[styles.fill, { width: `${pct}%` }]} /> : <View style={styles.emptyStub} testID="progress-empty" />}
    </View>
  );
}

type BadgeTone = 'neutral' | 'primary' | 'danger' | 'warning' | 'success' | 'info';

const BADGE: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
  primary: { bg: colors.primaryMuted, fg: colors.primary },
  danger: { bg: colors.dangerMuted, fg: colors.dangerText },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  success: { bg: colors.successMuted, fg: colors.success },
  info: { bg: colors.infoMuted, fg: colors.info },
};

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: ComponentProps<typeof Ionicons>['name'] }) {
  const palette = BADGE[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons name={icon} size={13} color={palette.fg} accessible={false} /> : null}
      <AppText variant="caption" style={{ color: palette.fg, fontFamily: fonts.medium }}>
        {label}
      </AppText>
    </View>
  );
}

/** Persistent notice that AI/medical content is informational. */
export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <View style={styles.disclaimer} accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={18} color={colors.info} accessible={false} />
      <AppText variant="caption" color="info" style={styles.flex}>
        {children}
      </AppText>
    </View>
  );
}

/** A hairline separator; `inset` indents its start edge, e.g. past a row's leading icon. */
export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, inset > 0 && { marginStart: inset }]} testID="divider" accessible={false} />;
}

/** A bulleted list read as a list by screen readers. */
export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.bullets} accessibilityRole="list">
      {items.map((item) => (
        <View key={item} style={styles.bulletRow} accessibilityRole="text">
          <AppText color="primary" accessible={false}>
            •
          </AppText>
          <AppText style={styles.flex}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  // Not progress: a short amber-tinted cap at the start edge, so an empty track still reads as a track.
  emptyStub: {
    width: 8,
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.infoMuted,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bullets: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
