import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Card, Checkbox, ErrorState, LoadingState, ProgressBar, Screen, SectionHeader } from '@/components/ui';
import { useActiveDog } from '@/features/dogs/hooks';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useKnowledgeBase, useToggleStep, useTrainingSummary } from './hooks';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from './labels';

export function ModuleScreen({ moduleId }: { moduleId: string }) {
  const { activeDog } = useActiveDog();
  const summary = useTrainingSummary(activeDog?.id ?? null);
  const articles = useKnowledgeBase();
  const toggle = useToggleStep(activeDog?.id ?? '');

  if (summary.isLoading) return <LoadingState />;
  if (summary.error) return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />;

  const module = summary.modules.find((m) => m.id === moduleId);
  if (!module) return <ErrorState message="המודול לא נמצא." />;

  const progress = summary.perModule.get(module.id);
  const related = (articles.data ?? []).filter((article) => article.related_module_ids.includes(module.id));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: module.title }} />
      <AppText variant="title" accessibilityRole="header">
        {module.title}
      </AppText>
      <View style={styles.badges}>
        <Badge label={CATEGORY_LABELS[module.category]} tone="primary" />
        <Badge label={DIFFICULTY_LABELS[module.difficulty]} />
        <Badge label={`${module.estimated_minutes} דק׳ לאימון`} icon="time-outline" />
      </View>
      <AppText>{module.summary}</AppText>

      {activeDog && progress ? (
        <Card tone="primary">
          <AppText variant="label">{`ההתקדמות של ${activeDog.name}: ${progress.completed} מתוך ${progress.total} שלבים`}</AppText>
          <ProgressBar value={progress.ratio} label={`התקדמות ב${module.title}`} />
        </Card>
      ) : null}

      <SectionHeader title="שלבים" />
      {module.steps.map((step) => {
        const completed = summary.completedSteps.has(step.id);
        return (
          <Card key={step.id}>
            <Checkbox
              checked={completed}
              disabled={!activeDog}
              onChange={(next) => toggle.mutate({ stepId: step.id, completed: next })}
              label={`שלב ${step.position}: ${step.title}${completed ? ', הושלם' : ''}`}
            >
              <AppText variant="subheading">{`${step.position}. ${step.title}`}</AppText>
              <AppText color="textSecondary">{step.instructions}</AppText>
            </Checkbox>
          </Card>
        );
      })}

      {module.tips.length ? (
        <>
          <SectionHeader title="טיפים" />
          <Card>
            <BulletList items={module.tips} />
          </Card>
        </>
      ) : null}

      {related.length ? (
        <>
          <SectionHeader title="להעמקה באנציקלופדיה" />
          {related.map((article) => (
            <Card
              key={article.id}
              onPress={() => router.push({ pathname: '/training/article/[articleId]', params: { articleId: article.id } })}
              accessibilityLabel={`מאמר: ${article.title}`}
            >
              <AppText variant="subheading">{article.title}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {article.summary}
              </AppText>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
