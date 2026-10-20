import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';

import { useHeroScrollStyle } from '@/components/motion';
import { AppText } from '@/components/ui';
import { DogSwitcher } from '@/features/dogs/components';
import type { DogRow } from '@/lib/database.types';
import { colors, radius, shadow, spacing } from '@/theme';

import { taskSummary } from '../logic/dailyTasks';

interface DogHeroCardProps {
  dogs: DogRow[];
  dog: DogRow;
  /** The dashboard's scroll offset; drives the card's scale/opacity. */
  scrollY: SharedValue<number>;
  /** Open tasks for today, shown as the hero's amber highlight. */
  taskCount: number;
}

/** Deep-navy hero for the active dog: switcher, an amber "today" highlight, and scroll-driven depth. */
export function DogHeroCard({ dogs, dog, scrollY, taskCount }: DogHeroCardProps) {
  const scrollStyle = useHeroScrollStyle(scrollY);
  return (
    <Animated.View style={[styles.card, scrollStyle]}>
      {/* Decorative amber glow in the corner; hidden from screen readers. */}
      <View style={styles.glow} accessible={false} importantForAccessibility="no-hide-descendants" />
      <DogSwitcher dogs={dogs} activeDog={dog} onDark />
      <View style={styles.today}>
        <Ionicons name={taskCount ? 'list' : 'checkmark-done'} size={16} color={colors.primaryBright} accessible={false} />
        <AppText variant="label" style={styles.todayText}>
          {taskSummary(taskCount)}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.heroNavy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadow.raised,
  },
  glow: {
    position: 'absolute',
    top: -60,
    end: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryBright,
    opacity: 0.18,
  },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  // Amber on navy is 5.6:1: AA for normal-size text.
  todayText: {
    color: colors.primaryBright,
  },
});
