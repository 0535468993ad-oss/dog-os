import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import { usePersonaEngine } from '../hooks/usePersonaEngine';
import { ThumbprintContractModal } from './ThumbprintContractModal';

/** A chip naming the active persona; opens the switcher and the honour contract. */
export function PersonaSwitcherChip({ dogId, dogName }: { dogId: string; dogName: string }) {
  const engine = usePersonaEngine();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        style={styles.chip}
        accessibilityRole="button"
        accessibilityLabel={`הקול של האפליקציה: ${engine.persona.nameHe}. החלפה וחוזה הכבוד`}
      >
        <Ionicons name={engine.persona.icon} size={16} color={colors.primaryBright} accessible={false} />
        <AppText variant="caption" style={styles.label}>
          {engine.persona.nameHe}
        </AppText>
      </PressableScale>
      <ThumbprintContractModal visible={open} dogId={dogId} dogName={dogName} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_AREA,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textPrimary,
  },
});
