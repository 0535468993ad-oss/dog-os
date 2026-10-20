import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card } from '@/components/ui';
import type { SupportRequestRow } from '@/lib/database.types';
import { spacing } from '@/theme';
import { formatDate } from '@/utils/date';

import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, STATUS_TONE } from '../utils/labels';

/** One past request: subject, status badge, type and date, and the start of the message. */
export function SupportRequestCard({ request }: { request: SupportRequestRow }) {
  return (
    <Card>
      <View style={styles.row}>
        <AppText variant="subheading" style={styles.flex}>
          {request.subject}
        </AppText>
        <Badge label={REQUEST_STATUS_LABELS[request.status]} tone={STATUS_TONE[request.status]} />
      </View>
      <AppText variant="caption" color="textSecondary">
        {`${REQUEST_TYPE_LABELS[request.request_type]} · ${formatDate(request.created_at.slice(0, 10))}`}
      </AppText>
      <AppText numberOfLines={3}>{request.message}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
