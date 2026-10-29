import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, SectionHeader } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, shadow, spacing } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ACTIONS: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'chatbubbles-outline', label: 'יועץ חכם', href: '/chat' },
  { icon: 'pulse-outline', label: 'בודק סימפטומים', href: '/health' },
  { icon: 'leaf-outline', label: 'בטיחות מזון ותזונה', href: '/kitchen' },
  { icon: 'nutrition-outline', label: 'תזונה', href: '/nutrition' },
  { icon: 'paw-outline', label: 'בחירת כלב', href: '/breed-match' },
  { icon: 'library-outline', label: 'מודיעין גזעים', href: '/breeds' },
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

/** One compact shortcut tile (icon beside label) with UI-thread press feedback. */
function QuickAction({ icon, label, href }: { icon: IconName; label: string; href: Href }) {
  return (
    <PressableScale onPress={() => router.push(href)} accessibilityRole="button" accessibilityLabel={label} style={styles.tile}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={18} color={colors.primary} accessible={false} />
      </View>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm + 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_AREA + 8,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  label: {
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
