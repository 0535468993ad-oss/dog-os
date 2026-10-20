import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText, Card, Divider, SectionHeader } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/theme';

import type { DailyTask } from '../logic/dailyTasks';

/** "Today's tasks": each row navigates to where the task is done; urgent ones say so in text. */
export function DailyTasksCard({ tasks }: { tasks: DailyTask[] }) {
  return (
    <View style={styles.section}>
      <SectionHeader title="המשימות של היום" />
      <Card>
        {tasks.length ? (
          tasks.map((task, i) => (
            <View key={task.id} style={styles.rowWrap}>
              {i > 0 ? <Divider /> : null}
              <TaskRow task={task} />
            </View>
          ))
        ) : (
          <View style={styles.done}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} accessible={false} />
            <AppText color="textSecondary">הכל מעודכן להיום.</AppText>
          </View>
        )}
      </Card>
    </View>
  );
}

/** One task row with UI-thread press feedback. */
function TaskRow({ task }: { task: DailyTask }) {
  return (
    <PressableScale
      onPress={() => router.push(task.href)}
      accessibilityRole="button"
      accessibilityLabel={`${task.urgent ? 'דחוף: ' : ''}${task.title}${task.detail ? `, ${task.detail}` : ''}`}
      style={styles.task}
    >
      {/* Urgency is carried by the "דחוף" label (screen readers) and the alert icon, not only by the tint. */}
      <View style={[styles.iconBadge, task.urgent && styles.iconBadgeUrgent]}>
        <Ionicons name={task.urgent ? 'alert-circle' : task.icon} size={20} color={task.urgent ? colors.dangerText : colors.primary} accessible={false} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={task.urgent ? 'dangerText' : 'textPrimary'}>
          {task.title}
        </AppText>
        {task.detail ? (
          <AppText variant="caption" color="textSecondary">
            {task.detail}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    minHeight: MIN_TOUCH_AREA + 8,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  rowWrap: {
    gap: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeUrgent: {
    backgroundColor: colors.dangerMuted,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
