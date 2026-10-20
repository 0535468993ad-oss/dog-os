import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { VetArticle } from '../api';

/** Horizontal quick-access row of emergency first-aid articles. */
export function EmergencyStrip({ articles }: { articles: VetArticle[] }) {
  return (
    <View style={styles.list}>
      <AppText variant="subheading" color="dangerText" accessibilityRole="header">
        גישה מהירה למצבי חירום
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {articles.map((article) => (
          <Card
            key={article.id}
            tone="danger"
            style={styles.card}
            onPress={() => router.push({ pathname: '/health/article/[articleId]', params: { articleId: article.id } })}
            accessibilityLabel={`חירום: ${article.title}`}
          >
            <Ionicons name="alert-circle" size={22} color={colors.dangerText} accessible={false} />
            <AppText variant="label" color="dangerText" numberOfLines={2}>
              {article.title}
            </AppText>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  strip: {
    gap: spacing.sm,
  },
  card: {
    width: 150,
    minHeight: 96,
  },
});
