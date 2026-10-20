import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import type { KnowledgeArticle } from '../api';
import { KNOWLEDGE_CATEGORY_LABELS } from '../labels';

/** One encyclopedia article: summary, category and reading time; "saved" is in the label, not only the icon. */
export function ArticleCard({ article, saved }: { article: KnowledgeArticle; saved: boolean }) {
  return (
    <Card
      onPress={() => router.push({ pathname: '/training/article/[articleId]', params: { articleId: article.id } })}
      accessibilityLabel={`${article.title}${saved ? ', שמור' : ''}`}
    >
      <View style={styles.row}>
        <AppText variant="subheading" style={styles.flex}>
          {article.title}
        </AppText>
        {saved ? <Ionicons name="bookmark" size={18} color={colors.primary} accessible={false} /> : null}
      </View>
      <AppText variant="caption" color="textSecondary" numberOfLines={2}>
        {article.summary}
      </AppText>
      <View style={styles.badges}>
        <Badge label={KNOWLEDGE_CATEGORY_LABELS[article.category]} tone="primary" />
        <Badge label={`${article.reading_minutes} דק׳ קריאה`} icon="book-outline" />
      </View>
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
