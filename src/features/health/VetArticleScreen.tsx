import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Card, Disclaimer, ErrorState, LoadingState, Screen, SectionHeader, StaleDataNotice } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { BREED_BY_ID } from '@/features/dogs/breeds';
import { colors, radius, spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { EmergencyActions } from './encyclopedia/EmergencyActions';
import { useVetKnowledge } from './hooks';
import { MEDICAL_DISCLAIMER, ORGAN_SYSTEM_LABELS, URGENCY, VET_CATEGORY_LABELS } from './labels';

/** A full encyclopedia article: urgency, signs, numbered steps, causes, when to call the vet, prevention. */
export function VetArticleScreen({ articleId }: { articleId: string }) {
  const knowledge = useVetKnowledge();

  if (knowledge.isLoading) return <LoadingState />;
  if (!knowledge.data) return <ErrorState message={toUserMessage(knowledge.error)} onRetry={() => void knowledge.refetch()} />;

  const article = knowledge.data.articles.find((a) => a.id === articleId);
  if (!article) return <ErrorState message="הערך לא נמצא." />;

  const urgency = article.urgency ? URGENCY[article.urgency] : null;
  const breeds = article.breeds.map((id) => BREED_BY_ID.get(id)?.label).filter((label): label is string => !!label);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: article.title }} />
      <StaleDataNotice visible={cacheState(knowledge.error, true) === 'stale' || !!knowledge.data.offline} onRetry={() => void knowledge.refetch()} />
      <AppText variant="title" accessibilityRole="header">
        {article.title}
      </AppText>
      <View style={styles.badges}>
        <Badge label={VET_CATEGORY_LABELS[article.category]} tone="info" />
        {article.organ_system ? <Badge label={ORGAN_SYSTEM_LABELS[article.organ_system]} /> : null}
      </View>

      {urgency ? (
        <Card tone={urgency.tone}>
          <View style={styles.row}>
            <Ionicons name={urgency.icon} size={24} color={article.urgency === 'emergency' ? colors.dangerText : colors.textPrimary} accessible={false} />
            <View style={styles.flex}>
              <AppText variant="subheading">{`רמת דחיפות: ${urgency.label}`}</AppText>
              <AppText>{urgency.action}</AppText>
            </View>
          </View>
        </Card>
      ) : null}

      {article.urgency === 'emergency' ? <EmergencyActions /> : null}

      <AppText variant="bodyStrong">{article.summary}</AppText>
      {article.overview ? <AppText>{article.overview}</AppText> : null}

      {article.signs.length ? (
        <>
          <SectionHeader title="סימנים" />
          <Card>
            <BulletList items={article.signs} />
          </Card>
        </>
      ) : null}

      {article.actions.length ? (
        <>
          <SectionHeader title={article.category === 'emergency' ? 'מה עושים עכשיו' : 'מה עושים'} />
          {article.actions.map((action, index) => (
            <Card key={action.title} accessibilityLabel={`שלב ${index + 1}: ${action.title}. ${action.body}`}>
              <View style={styles.row}>
                <View style={[styles.step, article.category === 'emergency' && styles.stepUrgent]}>
                  <AppText variant="label" style={styles.stepText}>
                    {String(index + 1)}
                  </AppText>
                </View>
                <View style={[styles.flex, styles.stepBody]}>
                  <AppText variant="subheading">{action.title}</AppText>
                  <AppText color="textSecondary">{action.body}</AppText>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {article.causes ? (
        <>
          <SectionHeader title="גורמים וגורמי סיכון" />
          <AppText>{article.causes}</AppText>
        </>
      ) : null}

      {article.when_to_call_vet ? (
        <>
          <SectionHeader title="מתי לפנות לווטרינר" />
          <Card tone="warning">
            <AppText>{article.when_to_call_vet}</AppText>
          </Card>
        </>
      ) : null}

      {article.prevention ? (
        <>
          <SectionHeader title="מניעה" />
          <AppText>{article.prevention}</AppText>
        </>
      ) : null}

      {breeds.length ? (
        <>
          <SectionHeader title="גזעים בסיכון מוגבר" />
          <AppText>{breeds.join(' · ')}</AppText>
        </>
      ) : null}

      <Disclaimer>{MEDICAL_DISCLAIMER}</Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  // Numbered first-aid steps: amber for general advice, red (dark digits) for emergencies.
  step: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepUrgent: {
    backgroundColor: colors.danger,
  },
  stepText: {
    color: colors.onAccent,
  },
  stepBody: {
    gap: spacing.xxs,
  },
});
