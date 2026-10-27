import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { VetArticle } from '../api';
import { URGENCY, VET_CATEGORY_LABELS } from '../labels';

/** Encyclopedia entry summary: title, urgency badge (text + icon) and category; opens the full article. */
// Memoized: the encyclopedia re-renders its whole filtered list on every search keystroke.
export const VetArticleCard = memo(function VetArticleCard({ article }: { article: VetArticle }) {
  const urgency = article.urgency ? URGENCY[article.urgency] : null;
  return (
    <Card
      onPress={() => router.push({ pathname: '/health/article/[articleId]', params: { articleId: article.id } })}
      accessibilityLabel={`${article.title}${urgency ? `, ${urgency.label}` : ''}`}
    >
      <View style={styles.row}>
        <AppText variant="subheading" style={styles.flex}>
          {article.title}
        </AppText>
        {urgency ? <Badge label={urgency.label} tone={urgency.tone} icon={urgency.icon} /> : null}
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={2}>
        {article.summary}
      </AppText>
      <Badge label={VET_CATEGORY_LABELS[article.category]} tone="info" />
    </Card>
  );
});

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
