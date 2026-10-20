import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { TrainingModule } from '../api';
import { streakTitle } from '../logic/moduleProgress';

interface ProgressSummaryCardProps {
  dogName: string;
  streak: number;
  completedModules: number;
  totalModules: number;
  nextModule: TrainingModule | null;
  /** Whether the next module is already in progress ("continue") or not started ("start"). */
  inProgress: boolean;
}

/** Streak and completion summary for the active dog, with a button into the next module. */
export function ProgressSummaryCard({ dogName, streak, completedModules, totalModules, nextModule, inProgress }: ProgressSummaryCardProps) {
  return (
    <Card tone="primary">
      <View style={styles.row}>
        <Ionicons name="flame" size={28} color={colors.primary} accessible={false} />
        <View style={styles.flex}>
          <AppText variant="heading">{streakTitle(streak)}</AppText>
          <AppText variant="caption">{`${dogName} השלים/ה ${completedModules} מתוך ${totalModules} מודולים`}</AppText>
        </View>
      </View>
      {nextModule ? (
        <Button
          title={inProgress ? `להמשיך: ${nextModule.title}` : `להתחיל: ${nextModule.title}`}
          onPress={() => router.push({ pathname: '/training/module/[moduleId]', params: { moduleId: nextModule.id } })}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
