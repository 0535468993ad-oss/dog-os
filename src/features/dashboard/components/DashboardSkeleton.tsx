import { StyleSheet, View } from 'react-native';

import { Card, Skeleton, SkeletonBlock } from '@/components/ui';
import { spacing } from '@/constants/theme';

/** Placeholder in the dashboard's shape (header, insights, stats, tasks) while the dog loads. */
export function DashboardSkeleton() {
  return (
    <Skeleton label="טוענים את לוח הבקרה">
      <View style={styles.header}>
        <SkeletonBlock round height={58} />
        <View style={styles.headerText}>
          <SkeletonBlock width="55%" height={24} />
          <SkeletonBlock width="35%" height={12} />
        </View>
      </View>
      <Card style={styles.card}>
        <SkeletonBlock width="40%" height={18} />
        <SkeletonBlock height={12} />
        <SkeletonBlock width="85%" height={12} />
        <SkeletonBlock width="70%" height={12} />
      </Card>
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <Card key={i} style={styles.tile}>
            <SkeletonBlock height={40} width={40} />
            <SkeletonBlock width="60%" height={20} />
          </Card>
        ))}
      </View>
      <Card style={styles.card}>
        <SkeletonBlock width="50%" height={16} />
        <SkeletonBlock width="80%" height={12} />
        <SkeletonBlock width="65%" height={12} />
      </Card>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
  },
});
