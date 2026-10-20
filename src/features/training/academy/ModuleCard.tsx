import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, ProgressBar } from '@/components/ui';
import { spacing } from '@/theme';

import type { TrainingModule } from '../api';
import type { ModuleProgress } from '../hooks';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../labels';
import { isModuleComplete, moduleAccessibilityLabel } from '../logic/moduleProgress';

/** One training module: summary, category/difficulty/duration badges and, with a dog, its progress. */
export function ModuleCard({ module, progress, showProgress }: { module: TrainingModule; progress: ModuleProgress | undefined; showProgress: boolean }) {
  return (
    <Card onPress={() => router.push({ pathname: '/training/module/[moduleId]', params: { moduleId: module.id } })} accessibilityLabel={moduleAccessibilityLabel(module, progress)}>
      <View style={styles.row}>
        <AppText variant="subheading" style={styles.flex}>
          {module.title}
        </AppText>
        {isModuleComplete(progress) ? <Badge label="הושלם" tone="success" icon="checkmark-circle" /> : null}
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={2}>
        {module.summary}
      </AppText>
      <View style={styles.badges}>
        <Badge label={CATEGORY_LABELS[module.category]} tone="primary" />
        <Badge label={DIFFICULTY_LABELS[module.difficulty]} />
        <Badge label={`${module.estimated_minutes} דק׳`} icon="time-outline" />
      </View>
      {showProgress && progress ? <ProgressBar value={progress.ratio} label={`התקדמות ב${module.title}`} /> : null}
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
