import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AppText, Button, Card, Disclaimer, EmptyState, ErrorState, LoadingState, Screen, StaleDataNotice } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { useActiveDog } from '@/features/dogs/hooks';
import { useHealth } from '@/features/health/hooks';
import { useJournal } from '@/features/journal/hooks';
import { useTrainingSummary } from '@/features/training/hooks';
import { formatAge } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { buildReportHtml } from './buildReport';
import { exportReportPdf } from './exportFiles';

export function ReportScreen() {
  const { activeDog, isLoading } = useActiveDog();
  const health = useHealth(activeDog?.id ?? null);
  const training = useTrainingSummary(activeDog?.id ?? null);
  const journal = useJournal(activeDog?.id ?? null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = isLoading || health.isLoading || training.isLoading || journal.isLoading;

  const run = async () => {
    if (!activeDog || !health.data) return;
    setExporting(true);
    setError(null);
    try {
      const html = buildReportHtml({
        dog: activeDog,
        health: health.data,
        modules: training.modules,
        perModule: training.perModule,
        streak: training.streak,
        journal: journal.data ?? [],
      });
      await exportReportPdf(html, `סיכום – ${activeDog.name}`);
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'popup_blocked'
          ? 'הדפדפן חסם את חלון ההדפסה. אפשרו חלונות קופצים לאתר ונסו שוב.'
          : toUserMessage(e, 'לא הצלחנו להפיק את הדוח. נסו שוב.'),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'דוח לווטרינר / מאלף' }} />
      {loading ? (
        <LoadingState />
      ) : !activeDog ? (
        <EmptyState icon="paw-outline" title="אין כלב פעיל" />
      ) : cacheState(health.error, health.data !== undefined) === 'failed' ? (
        <ErrorState message={toUserMessage(health.error)} onRetry={() => void health.refetch()} />
      ) : (
        <>
          <StaleDataNotice visible={cacheState(health.error, health.data !== undefined) === 'stale'} onRetry={() => void health.refetch()} />
          <AppText variant="title" accessibilityRole="header">
            {`סיכום בריאות והתנהגות – ${activeDog.name}`}
          </AppText>
          <AppText color="textSecondary">מסמך מסודר לשיתוף עם וטרינר או מאלף: פרטי הכלב, חיסונים, מעקב משקל, תזונה, הערות רפואיות, התקדמות באימונים ו-30 רשומות היומן האחרונות.</AppText>

          <Card>
            <AppText variant="subheading">{activeDog.name}</AppText>
            <AppText>{`${activeDog.breed} · ${formatAge(activeDog.birth_date)}`}</AppText>
            <AppText variant="caption" color="textSecondary">
              {`${health.data?.vaccinations.length ?? 0} חיסונים · ${health.data?.weights.length ?? 0} שקילות · ${health.data?.notes.length ?? 0} הערות רפואיות · ${journal.data?.length ?? 0} רשומות יומן`}
            </AppText>
          </Card>

          <Disclaimer>הדוח כולל מידע אישי ורפואי על הכלב. שתפו אותו רק עם אנשי מקצוע שאתם סומכים עליהם.</Disclaimer>

          {error ? (
            <AppText color="dangerText" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            title={Platform.OS === 'web' ? 'הדפסה / שמירה כ-PDF' : 'ייצוא PDF ושיתוף'}
            icon={Platform.OS === 'web' ? 'print-outline' : 'share-outline'}
            onPress={run}
            loading={exporting}
            fullWidth
          />
        </>
      )}
    </Screen>
  );
}
