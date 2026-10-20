import { StyleSheet, Text } from 'react-native';

import { Card, QueryStatus, ScreenContainer } from '@/components';
import { colors, typography } from '@/constants';
import { useFocusQuery } from '@/hooks';
import type { RootTabScreenProps } from '@/navigation/types';
import { listDogs, listTrainingSessionsSince } from '@/services';
import type { Dog, TrainingSession } from '@/types';
import { startOfToday } from '@/utils';

interface DashboardData {
  dogs: Dog[];
  todaysSessions: TrainingSession[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const [dogs, todaysSessions] = await Promise.all([listDogs(), listTrainingSessionsSince(startOfToday())]);
  return { dogs, todaysSessions };
}

export function DashboardScreen({ navigation }: RootTabScreenProps<'Dashboard'>) {
  const dashboard = useFocusQuery(fetchDashboard);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Dog OS Dashboard</Text>
      <Text style={styles.subtitle}>{'Your dog’s day at a glance.'}</Text>

      {dashboard.status !== 'success' ? (
        <QueryStatus
          status={dashboard.status}
          message={dashboard.status === 'error' ? dashboard.message : undefined}
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        <>
          <Card title="My Dogs" onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.body}>
              {dashboard.data.dogs.length === 0
                ? 'No dogs added yet.'
                : dashboard.data.dogs.map((dog) => dog.name).join(', ')}
            </Text>
          </Card>

          <Card title="Today’s Training" onPress={() => navigation.navigate('Training')}>
            <Text style={styles.body}>{summarizeToday(dashboard.data)}</Text>
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

function summarizeToday({ dogs, todaysSessions }: DashboardData): string {
  if (todaysSessions.length === 0) return 'No sessions logged today.';
  const totalMinutes = todaysSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const sessionLabel = todaysSessions.length === 1 ? 'session' : 'sessions';
  const dogNames = new Map(dogs.map((dog) => [dog.id, dog.name]));
  const trainedDogs = [...new Set(todaysSessions.map((session) => dogNames.get(session.dogId)))].filter(
    (name): name is string => name !== undefined
  );
  return `${todaysSessions.length} ${sessionLabel}, ${totalMinutes} min · ${trainedDogs.join(', ')}`;
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
