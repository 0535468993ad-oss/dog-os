import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, Badge, Button, Card, SectionHeader } from '@/components/ui';
import type { VaccinationRow } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { formatDate } from '@/utils/date';

import { vaccinationStatus } from '../logic/vaccinationStatus';

/** The dog's vaccinations with their due status; each opens its edit form. */
export function VaccinationList({ vaccinations }: { vaccinations: VaccinationRow[] }) {
  return (
    <>
      <SectionHeader
        title="חיסונים"
        action={<Button title="הוספה" icon="add" variant="ghost" compact onPress={() => router.push('/health/vaccination')} accessibilityLabel="הוספת חיסון" />}
      />
      {vaccinations.length === 0 ? (
        <Card>
          <AppText color="textSecondary">לא תועדו חיסונים. הוסיפו את החיסונים מהפנקס כדי לקבל תזכורות.</AppText>
        </Card>
      ) : (
        vaccinations.map((v, index) => <VaccinationItem key={v.id} vaccination={v} index={index} />)
      )}
    </>
  );
}

/** One vaccination card: name, status badge (text + icon, never color alone) and last date. */
function VaccinationItem({ vaccination: v, index }: { vaccination: VaccinationRow; index: number }) {
  const status = vaccinationStatus(v);
  return (
    <Animated.View entering={enterAt(index)}>
      <Card onPress={() => router.push({ pathname: '/health/vaccination', params: { id: v.id } })} accessibilityLabel={`${v.name}, ${status.label}. עריכה`}>
        <View style={styles.row}>
          <AppText variant="subheading" style={styles.flex}>
            {v.name}
          </AppText>
          <Badge label={status.label} tone={status.tone} icon={status.tone === 'danger' ? 'alert-circle' : undefined} />
        </View>
        {v.last_given ? <AppText variant="caption" color="textSecondary">{`ניתן לאחרונה: ${formatDate(v.last_given)}`}</AppText> : null}
      </Card>
    </Animated.View>
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
});
