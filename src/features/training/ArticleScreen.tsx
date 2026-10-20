import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BulletList, Card, ErrorState, IconButton, LoadingState, Screen, SectionHeader, StaleDataNotice } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useBookmarks, useKnowledgeBase, useToggleBookmark, useTrainingCatalog } from './hooks';
import { KNOWLEDGE_CATEGORY_LABELS, METHOD_LABELS } from './labels';

export function ArticleScreen({ articleId }: { articleId: string }) {
  const articles = useKnowledgeBase();
  const bookmarks = useBookmarks();
  const toggleBookmark = useToggleBookmark();
  const catalog = useTrainingCatalog();

  if (articles.isLoading) return <LoadingState />;
  const view = cacheState(articles.error, articles.data !== undefined);
  if (view === 'failed') return <ErrorState message={toUserMessage(articles.error)} onRetry={() => void articles.refetch()} />;

  const article = articles.data?.find((a) => a.id === articleId);
  if (!article) return <ErrorState message="המאמר לא נמצא." />;

  const saved = bookmarks.data?.includes(article.id) ?? false;
  const relatedModules = (catalog.data ?? []).filter((m) => article.related_module_ids.includes(m.id));

  return (
    <Screen edges={['bottom']}>
      <StaleDataNotice visible={view === 'stale'} onRetry={() => void articles.refetch()} />
      <Stack.Screen
        options={{
          title: article.title,
          headerRight: () => (
            <IconButton
              icon={saved ? 'bookmark' : 'bookmark-outline'}
              color="primary"
              selected={saved}
              accessibilityLabel={saved ? 'הסרה מהשמורים' : 'שמירת המאמר'}
              onPress={() => toggleBookmark.mutate({ articleId: article.id, bookmarked: !saved })}
            />
          ),
        }}
      />
      <AppText variant="title" accessibilityRole="header">
        {article.title}
      </AppText>
      <View style={styles.badges}>
        <Badge label={KNOWLEDGE_CATEGORY_LABELS[article.category]} tone="primary" />
        {article.methods.map((method) => (
          <Badge key={method} label={METHOD_LABELS[method]} />
        ))}
      </View>
      <AppText variant="bodyStrong">{article.summary}</AppText>

      {article.historical_context ? (
        <>
          <SectionHeader title="רקע היסטורי" />
          <AppText>{article.historical_context}</AppText>
        </>
      ) : null}

      {article.principles ? (
        <>
          <SectionHeader title="עקרונות" />
          <AppText>{article.principles}</AppText>
        </>
      ) : null}

      {article.steps.length ? (
        <>
          <SectionHeader title="ביצוע מעשי – צעד אחר צעד" />
          {article.steps.map((step, index) => (
            <Card key={step.title}>
              <AppText variant="subheading">{`${index + 1}. ${step.title}`}</AppText>
              <AppText color="textSecondary">{step.body}</AppText>
            </Card>
          ))}
        </>
      ) : null}

      {article.pros.length || article.cons.length ? (
        <View style={styles.prosCons}>
          {article.pros.length ? (
            <Card tone="success" style={styles.flex}>
              <AppText variant="subheading" color="success">
                יתרונות
              </AppText>
              <BulletList items={article.pros} />
            </Card>
          ) : null}
          {article.cons.length ? (
            <Card tone="warning" style={styles.flex}>
              <AppText variant="subheading" color="warning">
                חסרונות ואתגרים
              </AppText>
              <BulletList items={article.cons} />
            </Card>
          ) : null}
        </View>
      ) : null}

      {article.practical_tips.length ? (
        <>
          <SectionHeader title="טיפים מהשטח" />
          <Card>
            <BulletList items={article.practical_tips} />
          </Card>
        </>
      ) : null}

      {relatedModules.length ? (
        <>
          <SectionHeader title="תרגלו באקדמיה" />
          {relatedModules.map((module) => (
            <Card
              key={module.id}
              onPress={() => router.push({ pathname: '/training/module/[moduleId]', params: { moduleId: module.id } })}
              accessibilityLabel={`מודול: ${module.title}`}
            >
              <AppText variant="subheading">{module.title}</AppText>
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
  prosCons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  flex: {
    flexGrow: 1,
    flexBasis: 260,
  },
});
