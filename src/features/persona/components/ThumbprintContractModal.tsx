import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedProps, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { PressableScale } from '@/components/motion';
import { AppText, BulletList, ChipGroup, IconButton } from '@/components/ui';
import { SPRINGS } from '@/constants/motion';
import { colors, spacing } from '@/constants/theme';
import { hapticCelebrate, hapticHeartbeat } from '@/features/gamification/hooks/haptics';

import { CONTRACT_TERMS_HE, CONTRACT_TITLE_HE, PERSONA_ORDER, PERSONAS } from '../data/personasData';
import { usePersonaEngine } from '../hooks/usePersonaEngine';
import { interpolate } from '../utils/personaCopy';

const HOLD_MS = 3000;
const RING = 120;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * ((RING - STROKE) / 2);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** How far through the three-second hold a press that started at `start` is, 0–1. */
const holdShare = (start: number) => Math.min(1, (Date.now() - start) / HOLD_MS);
/** The current time, for the start of a hold. */
const nowMs = () => Date.now();
const PERSONA_OPTIONS = PERSONA_ORDER.map((id) => ({ value: id, label: PERSONAS[id].nameHe }));

interface ThumbprintContractModalProps {
  visible: boolean;
  dogId: string;
  dogName: string;
  onClose: () => void;
}

/**
 * The persona switcher and the honour contract. The contract is signed by holding the thumb button for
 * three seconds while a ring fills and the phone beats faster – a commitment gesture, not a biometric:
 * no fingerprint is read or stored. Screen-reader users sign with the button's activate action.
 */
export function ThumbprintContractModal({ visible, dogId, dogName, onClose }: ThumbprintContractModalProps) {
  const engine = usePersonaEngine();
  const progress = useSharedValue(0);
  const beat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const signedAt = engine.contractSignedAt(dogId);

  const stopBeat = () => {
    if (beat.current) clearTimeout(beat.current);
    beat.current = null;
  };
  useEffect(() => stopBeat, []);

  /** The heartbeat: beats speed up from 700 to 250 ms and grow from light to heavy over the hold. */
  const nextBeat = () => {
    const share = holdShare(startedAt.current);
    hapticHeartbeat(share < 0.34 ? 0 : share < 0.67 ? 1 : 2);
    beat.current = setTimeout(nextBeat, 700 - 450 * share);
  };

  const sign = () => {
    stopBeat();
    engine.signContract(dogId);
    hapticCelebrate();
  };

  const onPressIn = () => {
    if (signedAt) return;
    startedAt.current = nowMs();
    nextBeat();
    progress.set(
      withTiming(1, { duration: HOLD_MS, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) scheduleOnRN(sign);
      }),
    );
  };
  const onPressOut = () => {
    if (signedAt) return;
    stopBeat();
    cancelAnimation(progress);
    // Letting go early springs the ring back from wherever it had reached.
    progress.set(withSpring(0, SPRINGS.release));
  };

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.get()) }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header" style={styles.flex}>
            הקול של האפליקציה
          </AppText>
          <IconButton icon="close" accessibilityLabel="סגירה" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText color="textSecondary">בחרו מי ידבר אתכם באימונים. בכל מצב חירום האפליקציה עוברת אוטומטית לטון קליני ורציני.</AppText>
          <ChipGroup options={PERSONA_OPTIONS} value={engine.activePersona} onChange={engine.setPersona} accessibilityLabel="בחירת פרסונה" />
          <AppText variant="caption" color="textSecondary">
            {engine.persona.taglineHe}
          </AppText>

          <AppText variant="subheading">{interpolate(CONTRACT_TITLE_HE, { dogName })}</AppText>
          <BulletList items={CONTRACT_TERMS_HE.map((term) => interpolate(term, { dogName }))} />
          <View style={styles.thumbArea}>
            <PressableScale
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              accessibilityRole="button"
              accessibilityLabel={signedAt ? 'החוזה נחתם' : 'חתימה על החוזה – לחיצה ארוכה של שלוש שניות'}
              accessibilityState={{ disabled: !!signedAt }}
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'activate' && !signedAt) sign();
              }}
              style={styles.thumb}
            >
              <Svg width={RING} height={RING} style={StyleSheet.absoluteFill} accessible={false}>
                <Circle cx={RING / 2} cy={RING / 2} r={(RING - STROKE) / 2} stroke={colors.borderStrong} strokeWidth={STROKE} fill="none" />
                <AnimatedCircle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={(RING - STROKE) / 2}
                  stroke={signedAt ? colors.accentGold : colors.accentBronze}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={signedAt ? 0 : CIRCUMFERENCE}
                  animatedProps={signedAt ? undefined : ringProps}
                  strokeLinecap="round"
                />
              </Svg>
              <Ionicons name={signedAt ? 'checkmark-done' : 'finger-print'} size={48} color={signedAt ? colors.accentGold : colors.textPrimary} accessible={false} />
            </PressableScale>
            <AppText variant="caption" color="textSecondary" center accessibilityLiveRegion="polite">
              {signedAt ? `נחתם ב־${new Date(signedAt).toLocaleDateString('he-IL')}` : 'החזיקו את האגודל שלוש שניות. זו התחייבות – לא נקראת טביעת אצבע.'}
            </AppText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  thumbArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  thumb: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
