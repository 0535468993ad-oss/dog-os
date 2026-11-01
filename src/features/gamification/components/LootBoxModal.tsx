import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/motion';
import { AppText, Button } from '@/components/ui';
import { SPRINGS } from '@/constants/motion';
import { colors, glow, radius, spacing, tabularNums } from '@/constants/theme';

import { AVATAR_FRAMES, INTEL_CARDS, VIP_TITLES } from '../data/lootTable';
import { hapticLootTap } from '../hooks/haptics';
import type { LootReward } from '../types';

interface LootBoxModalProps {
  visible: boolean;
  /** The persona's prompts for tap 1, 2 and 3. */
  prompts: readonly [string, string, string];
  /** Opens a pending box (on the third tap); null when there is none. */
  onOpen: () => LootReward | null;
  onClose: () => void;
}

/** What a reward is, in words. */
function describe(reward: LootReward): { titleHe: string; bodyHe: string } {
  if (reward.tier === 'COMMON') {
    const xp = reward.xpAwarded > 0 ? `+${reward.xpAwarded} XP` : 'ה־XP נעצר בתקרה היומית';
    return { titleHe: 'פרס רגיל', bodyHe: `${xp} ו־${reward.bones} עצמות זהב` };
  }
  if (reward.tier === 'RARE') {
    const card = INTEL_CARDS.find((entry) => entry.id === reward.cardId);
    const frame = AVATAR_FRAMES.find((entry) => entry.id === reward.frameId);
    return { titleHe: `נדיר: ${card?.titleHe ?? 'כרטיס מודיעין'}`, bodyHe: `${card?.factHe ?? ''} (${card?.sourceHe ?? ''})\nופרס: ${frame?.nameHe ?? ''}` };
  }
  if (reward.kind === 'SHIELD') return { titleHe: 'אגדי! מגן הקפאת רצף', bodyHe: 'אם תפספסו יום, המגן ישמור על הרצף.' };
  return { titleHe: 'אגדי! תואר VIP', bodyHe: VIP_TITLES.find((entry) => entry.id === reward.titleId)?.nameHe ?? '' };
}

/** The three-tap chest: a shake, glowing cracks, then the burst and the reward card. */
export function LootBoxModal({ visible, prompts, onOpen, onClose }: LootBoxModalProps) {
  const reduceMotion = useReducedMotion();
  const [taps, setTaps] = useState(0);
  const [reward, setReward] = useState<LootReward | null>(null);
  const shake = useSharedValue(0);
  const crack = useSharedValue(0);
  const chestStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.get()}deg` }, { scale: 1 + crack.get() * 0.08 }] }));
  const crackStyle = useAnimatedStyle(() => ({ opacity: crack.get() }));

  const tap = () => {
    hapticLootTap(taps);
    if (taps === 0 && !reduceMotion) shake.set(withSequence(withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }), withTiming(-8, { duration: 60 }), withSpring(0, SPRINGS.release)));
    if (taps === 1) crack.set(reduceMotion ? 1 : withSpring(1, SPRINGS.ui));
    if (taps === 2) setReward(onOpen());
    setTaps(taps + 1);
  };
  const close = () => {
    setTaps(0);
    setReward(null);
    crack.set(0);
    onClose();
  };
  const shown = reward ? describe(reward) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <SafeAreaView style={styles.backdrop} accessibilityViewIsModal>
        <View style={styles.sheet}>
          {shown ? (
            <View style={styles.reveal} accessibilityRole="alert">
              <AppText variant="title" color="accentOrange" center>
                {shown.titleHe}
              </AppText>
              <AppText center style={tabularNums}>{shown.bodyHe}</AppText>
              <Button title="מעולה!" onPress={close} />
            </View>
          ) : taps >= 3 ? (
            <View style={styles.reveal}>
              <AppText center>אין כרגע ארגז לפתוח. אימון מאומת הבא יביא אחד.</AppText>
              <Button title="סגירה" onPress={close} />
            </View>
          ) : (
            <>
              <AppText variant="subheading" center accessibilityLiveRegion="polite">
                {prompts[Math.min(2, taps)]}
              </AppText>
              <PressableScale onPress={tap} accessibilityRole="button" accessibilityLabel={`פתיחת ארגז השלל, לחיצה ${taps + 1} מתוך 3`} style={styles.chestHit}>
                <Animated.View style={[styles.chest, chestStyle]}>
                  <Animated.View style={[styles.cracks, glow(colors.accentOrange), crackStyle]} />
                  <Ionicons name="cube" size={96} color={colors.accentOrange} accessible={false} />
                </Animated.View>
              </PressableScale>
              <Button title="אחר כך" variant="ghost" compact onPress={close} />
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  reveal: {
    gap: spacing.md,
  },
  chestHit: {
    alignSelf: 'center',
  },
  chest: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cracks: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.accentOrange,
  },
});
