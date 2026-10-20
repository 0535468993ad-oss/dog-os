import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, SectionHeader } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ACTIONS: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'chatbubbles-outline', label: 'יועץ חכם', href: '/chat' },
  { icon: 'pulse-outline', label: 'בודק סימפטומים', href: '/health' },
  { icon: 'restaurant-outline', label: 'מטבח חירום', href: '/kitchen' },
  { icon: 'nutrition-outline', label: 'תזונה', href: '/nutrition' },
  { icon: 'book-outline', label: 'יומן', href: '/journal' },
  { icon: 'document-text-outline', label: 'דוח לווטרינר', href: '/report' },
];

/** Grid of shortcuts to the most used screens. */
export function QuickActions() {
  return (
    <View style={styles.section}>
      <SectionHeader title="גישה מהירה" />
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </View>
    </View>
  );
}

/** One shortcut tile with UI-thread press feedback. */
function QuickAction({ icon, label, href }: { icon: IconName; label: string; href: Href }) {
  return (
    <PressableScale onPress={() => router.push(href)} accessibilityRole="button" accessibilityLabel={label} style={styles.tile}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={24} color={colors.primary} accessible={false} />
      </View>
      <AppText variant="label" center>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
