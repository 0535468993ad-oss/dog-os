import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { usePersonaEngine } from '../hooks/usePersonaEngine';
import { greetingKey } from '../utils/personaCopy';
import { PersonaSwitcherChip } from './PersonaSwitcherChip';

interface PersonaGreetingCardProps {
  dogId: string;
  dogName: string;
  streakDays: number;
  /** Local hour, for the morning or evening greeting. */
  hour: number;
}

/** The home greeting in the active persona's voice, with the switcher chip. */
export function PersonaGreetingCard({ dogId, dogName, streakDays, hour }: PersonaGreetingCardProps) {
  const engine = usePersonaEngine();
  return (
    <Card>
      <View style={styles.root}>
        <AppText>{engine.formatCopy(greetingKey(hour), { dogName, streakDays })}</AppText>
        <PersonaSwitcherChip dogId={dogId} dogName={dogName} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
});
