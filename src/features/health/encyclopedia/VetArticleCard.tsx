import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import type { VetArticle } from '../api';
import { URGENCY, VET_CATEGORY_LABELS } from '../labels';

/** Encyclopedia entry summary: badges (urgency in text + icon, category), title and full summary. */
// Memoized: the encyclopedia re-renders its whole filtered list on every search keystroke.
export const VetArticleCard = memo(function VetArticleCard({ article }: { article: VetArticle }) {
  const urgency = article.urgency ? URGENCY[article.urgency] : null;
  return (
    <Card
      onPress={() => router.push({ pathname: '/health/article/[articleId]', params: { articleId: article.id } })}
      accessibilityLabel={`${article.title}${urgency ? `, ${urgency.label}` : ''}`}
    >
      {/* Badges on their own wrapping row, so they never squeeze the title. */}
      <View style={styles.badges}>
        {urgency ? <Badge label={urgency.label} tone={urgency.tone} icon={urgency.icon} /> : null}
        <Badge label={VET_CATEGORY_LABELS[article.category]} tone="info" />
      </View>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="subheading">{article.title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {article.summary}
          </AppText>
        </View>
        <Ionicons name="chevron-back" size={18} color={colors.textSecondary} accessible={false} />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
