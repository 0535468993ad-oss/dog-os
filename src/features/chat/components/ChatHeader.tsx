import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, IconButton } from '@/components/ui';
import { DogSwitcher } from '@/features/dogs/components';
import type { DogRow } from '@/lib/database.types';
import { spacing } from '@/constants/theme';

interface ChatHeaderProps {
  dogs: DogRow[];
  activeDog: DogRow | null;
  hasMessages: boolean;
  onRequestClear: () => void;
}

/** Dog switcher (or title), a link to what the advisor knows, and "clear chat" when there is history. */
export function ChatHeader({ dogs, activeDog, hasMessages, onRequestClear }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>{activeDog ? <DogSwitcher dogs={dogs} activeDog={activeDog} /> : <AppText variant="title">יועץ חכם</AppText>}</View>
      <IconButton icon="information-circle-outline" accessibilityLabel="מה היועץ יודע על הכלב" onPress={() => router.push('/advisor-context')} color="textSecondary" />
      {hasMessages ? <IconButton icon="trash-outline" accessibilityLabel="מחיקת השיחה" onPress={onRequestClear} color="textSecondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
