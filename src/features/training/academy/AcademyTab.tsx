import { StyleSheet, View } from 'react-native';

import { AppText, Card, ErrorState, LoadingState, SectionHeader, StaleDataNotice } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { useActiveDog } from '@/features/dogs/hooks';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useTrainingSummary } from '../hooks';
import { ModuleCard } from './ModuleCard';
import { ProgressSummaryCard } from './ProgressSummaryCard';

/** Training academy tab: the active dog's progress summary and the module catalog. */
export function AcademyTab() {
  const { activeDog, isLoading: dogLoading } = useActiveDog();
  const summary = useTrainingSummary(activeDog?.id ?? null);

  if (dogLoading || summary.isLoading) return <LoadingState />;
  const view = cacheState(summary.error, summary.hasData);
  if (view === 'failed') return <ErrorState message={toUserMessage(summary.error)} onRetry={() => void summary.refetch()} />;

  return (
    <View style={styles.list}>
      <StaleDataNotice visible={view === 'stale'} onRetry={() => void summary.refetch()} />
      {activeDog ? (
        <ProgressSummaryCard
          dogName={activeDog.name}
          streak={summary.streak}
          completedModules={summary.completedModules}
          totalModules={summary.modules.length}
          nextModule={summary.nextModule}
          inProgress={!!summary.activeModule}
        />
      ) : (
        <Card tone="info">
          <AppText>הוסיפו כלב בלשונית הפרופיל כדי לעקוב אחר ההתקדמות.</AppText>
        </Card>
      )}

      <SectionHeader title="מודולים" />
      {summary.modules.map((module) => (
        <ModuleCard key={module.id} module={module} progress={summary.perModule.get(module.id)} showProgress={!!activeDog} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
