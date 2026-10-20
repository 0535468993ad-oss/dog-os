import { router } from 'expo-router';
import Animated, { useSharedValue } from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, Button, EmptyState, ErrorState, Screen } from '@/components/ui';
import { useActiveDog } from '@/features/dogs/hooks';
import type { DogRow } from '@/lib/database.types';
import { toUserMessage } from '@/utils/errors';

import { DailyTasksCard } from './components/DailyTasksCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DogHeroCard } from './components/DogHeroCard';
import { InsightsCard } from './components/InsightsCard';
import { QuickActions } from './components/QuickActions';
import { StatsRow } from './components/StatsRow';
import { TrendsAlertCard } from './components/TrendsAlertCard';
import { useDashboardData } from './hooks';
import { buildDailyTasks } from './logic/dailyTasks';
import { buildTrendAlerts } from './logic/trendAlerts';

/** Home tab: loading/error/first-dog states, then the dashboard for the active dog. */
export function DashboardScreen() {
  const { dogs, activeDog, isLoading, error, refetch } = useActiveDog();

  if (isLoading) {
    return (
      <Screen>
        <DashboardSkeleton />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen>
        <ErrorState message={toUserMessage(error)} onRetry={() => void refetch()} />
      </Screen>
    );
  }
  if (!activeDog) {
    return (
      <Screen>
        <AppText variant="title" accessibilityRole="header">
          ברוכים הבאים ל-Dog OS
        </AppText>
        <EmptyState
          icon="paw"
          title="נתחיל מהכלב שלכם"
          body="הוסיפו פרופיל כדי לקבל תוכנית אימונים, מעקב בריאות ויועץ חכם שמכיר אותו."
          action={<Button title="הוספת כלב" icon="add" onPress={() => router.push('/dogs/edit')} />}
        />
      </Screen>
    );
  }
  return <Dashboard dogs={dogs} dog={activeDog} />;
}

/** The dashboard sections for one dog under the navy hero, entering one after another. */
function Dashboard({ dogs, dog }: { dogs: DogRow[]; dog: DogRow }) {
  const data = useDashboardData(dog);
  const scrollY = useSharedValue(0);
  const weights = data.health.data?.weights ?? [];
  const lastWeight = weights[weights.length - 1];
  const tasks = buildDailyTasks({
    today: data.today,
    health: data.health.data,
    nextModule: data.training.nextModule,
    completedSteps: data.training.completedSteps,
    journal: data.journal.data,
  });
  const alerts = buildTrendAlerts(data.today, data.reminders);

  return (
    <Screen
      onRefresh={data.refresh}
      refreshing={data.refreshing}
      scrollY={scrollY}
      parallaxHeader={<DogHeroCard dogs={dogs} dog={dog} scrollY={scrollY} taskCount={tasks.length} />}
    >
      {alerts.length ? (
        <Animated.View entering={enterAt(0)}>
          <TrendsAlertCard alerts={alerts} />
        </Animated.View>
      ) : null}
      <Animated.View entering={enterAt(1)}>
        <InsightsCard insights={data.insights} sharing={data.sharing} />
      </Animated.View>
      <Animated.View entering={enterAt(2)}>
        <StatsRow
          streak={data.training.streak}
          completedModules={data.training.completedModules}
          totalModules={data.training.modules.length}
          lastWeightKg={lastWeight?.weight_kg ?? null}
        />
      </Animated.View>
      <Animated.View entering={enterAt(3)}>
        <DailyTasksCard tasks={tasks} />
      </Animated.View>
      <Animated.View entering={enterAt(4)}>
        <QuickActions />
      </Animated.View>
    </Screen>
  );
}
