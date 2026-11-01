import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

import type { VetArticle } from '../api';

type IconName = ComponentProps<typeof Ionicons>['name'];

// A glyph per known emergency, so each card is recognisable at a glance; unknown ids fall back to the alert.
const EMERGENCY_ICONS: Readonly<Record<string, IconName>> = {
  'gdv-bloat': 'medical-outline',
  heatstroke: 'thermometer-outline',
  poisoning: 'flask-outline',
  'processionary-caterpillar': 'bug-outline',
  'snake-bite': 'warning-outline',
  'trauma-bleeding': 'bandage-outline',
  seizures: 'pulse-outline',
  'breathing-difficulty': 'cloud-outline',
};

/** The icon for an emergency article (the generic alert for ids without one). */
export function emergencyIcon(id: string): IconName {
  return (Object.prototype.hasOwnProperty.call(EMERGENCY_ICONS, id) ? EMERGENCY_ICONS[id] : undefined) ?? 'alert-circle-outline';
}

/** Horizontal quick-access row of emergency first-aid articles; titles are never cut off. */
export function EmergencyStrip({ articles }: { articles: VetArticle[] }) {
  return (
    <View style={styles.list}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="alert" size={18} color={colors.onAccent} accessible={false} />
        </View>
        <View style={styles.flex}>
          <AppText variant="section" accessibilityRole="header">
            גישה מהירה למצבי חירום
          </AppText>
          <AppText variant="caption" color="textSecondary">
            הוראות עזרה ראשונה – פותחים ופועלים בדרך לווטרינר
          </AppText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {articles.map((article) => (
          <Card
            key={article.id}
            tone="danger"
            style={styles.card}
            onPress={() => router.push({ pathname: '/health/article/[articleId]', params: { articleId: article.id } })}
            accessibilityLabel={`חירום: ${article.title}`}
            accessibilityHint="פותח את הוראות העזרה הראשונה"
          >
            <View style={styles.cardIcon}>
              <Ionicons name={emergencyIcon(article.id)} size={20} color={colors.dangerText} accessible={false} />
            </View>
            <AppText variant="label" style={styles.flex}>
              {article.title}
            </AppText>
            <View style={styles.open}>
              <AppText variant="caption" color="dangerText">
                מה עושים
              </AppText>
              <Ionicons name="chevron-back" size={14} color={colors.dangerText} accessible={false} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm + 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Solid red squircle: the one place the section header itself carries the emergency color.
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  strip: {
    gap: spacing.sm,
  },
  card: {
    width: 168,
    minHeight: 132,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  open: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
