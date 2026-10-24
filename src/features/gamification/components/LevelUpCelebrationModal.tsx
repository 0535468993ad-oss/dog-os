import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, GlassCard } from '@/components/ui';
import { colors, radius, spacing, textGlow } from '@/constants/theme';
import { reportError } from '@/utils/errors';

import type { RankTier } from '../types';
import { CelebrationParticles } from './CelebrationParticles';

interface LevelUpCelebrationModalProps {
  rank: RankTier | null;
  dogName: string;
  onClose: () => void;
  onOpenVault: () => void;
}

/** Full-screen level-up reveal: the new rank, the reward it unlocked, and a one-tap share. */
export function LevelUpCelebrationModal({ rank, dogName, onClose, onOpenVault }: LevelUpCelebrationModalProps) {
  const share = () => {
    if (!rank) return;
    Share.share({ message: `${dogName} עלה לדרגה ${rank.level} – "${rank.titleHe}" ב־Dog OS! 🐾 תרגול אמיתי, כל יום.` }).catch((error: unknown) =>
      reportError(error, 'gamification/share-level'),
    );
  };

  return (
    <Modal visible={rank !== null} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop} accessibilityViewIsModal>
        {rank ? (
          <View style={styles.content}>
            <View style={styles.badge}>
              <CelebrationParticles />
              <Ionicons name="trophy" size={56} color={colors.accentOrange} accessible={false} />
            </View>
            <AppText variant="caption" color="accentCyan" center>{`עליתם לדרגה ${rank.level}`}</AppText>
            <AppText variant="display" center accessibilityRole="header" style={textGlow(colors.accentCyan)}>
              {rank.titleHe}
            </AppText>
            <AppText color="textSecondary" center>{`${dogName} · ${rank.titleEn}`}</AppText>
            <GlassCard>
              <AppText variant="label" color="accentMint">
                {rank.unlockedReward.availability === 'AVAILABLE' ? 'הפרס שנפתח' : 'בקרוב בדרגה הזו'}
              </AppText>
              <AppText variant="subheading">{rank.unlockedReward.titleHe}</AppText>
              <AppText variant="caption" color="textSecondary">
                {rank.unlockedReward.descriptionHe}
              </AppText>
              {rank.bonusReward ? <AppText variant="caption" color="textSecondary">{`ובנוסף: ${rank.bonusReward.titleHe}`}</AppText> : null}
            </GlassCard>
            <Button title="שיתוף ההישג" icon="share-social-outline" onPress={share} fullWidth />
            <Button
              title="לארון הפרסים"
              variant="secondary"
              icon="trophy-outline"
              onPress={() => {
                onClose();
                onOpenVault();
              }}
              fullWidth
            />
            <Button title="המשך אימון" variant="ghost" onPress={onClose} fullWidth />
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  badge: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.accentOrange,
    backgroundColor: colors.warningMuted,
  },
});
