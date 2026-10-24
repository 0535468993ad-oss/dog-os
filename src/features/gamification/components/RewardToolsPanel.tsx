import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Badge, Button, GlassCard, IconButton } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { HighFrequencyWhistle } from '@/features/tools/components/HighFrequencyWhistle';
import { SoundDesensitizationLab } from '@/features/tools/components/SoundDesensitizationLab';

import type { CertificateData } from '../utils/certificate';
import type { RewardStatus, RewardView } from '../utils/view';
import { CertificateGenerator } from './CertificateGenerator';

const STATUS: Readonly<Record<RewardStatus, { label: string; tone: 'success' | 'primary' | 'neutral' | 'info' }>> = {
  CLAIMED: { label: 'פתוח', tone: 'success' },
  CLAIMABLE: { label: 'מוכן לקבלה', tone: 'primary' },
  LOCKED: { label: 'נעול', tone: 'neutral' },
  COMING_SOON: { label: 'בקרוב', tone: 'info' },
};

/** Where an app-area reward leads. */
const LINKS: Readonly<Record<string, Href>> = { 'feature-foundation': '/kitchen', 'feature-habits': '/journal' };

interface RewardToolsPanelProps {
  rewards: readonly RewardView[];
  certificate: Omit<CertificateData, 'kind'>;
  onClaim: (rewardId: string) => void;
}

/** Level rewards: claim them, then open the tools (whistle, sound lab, diplomas) straight from here. */
export function RewardToolsPanel({ rewards, certificate, onClaim }: RewardToolsPanelProps) {
  const [open, setOpen] = useState<RewardView | null>(null);

  const use = (reward: RewardView) => {
    const link = LINKS[reward.payloadKey];
    if (link) router.push(link);
    else if (reward.rewardType !== 'PROFILE_SKIN') setOpen(reward);
  };

  return (
    <View style={styles.list}>
      {rewards.map((reward) => (
        <GlassCard key={reward.id}>
          <View style={styles.row}>
            <AppText variant="subheading" style={styles.flex}>{`${reward.levelRequired}. ${reward.titleHe}`}</AppText>
            <Badge label={STATUS[reward.status].label} tone={STATUS[reward.status].tone} />
          </View>
          <AppText variant="caption" color="textSecondary">
            {reward.descriptionHe}
          </AppText>
          {reward.status === 'CLAIMABLE' ? <Button title="קבלת הפרס" icon="gift-outline" onPress={() => onClaim(reward.id)} /> : null}
          {reward.status === 'CLAIMED' && reward.rewardType === 'PROFILE_SKIN' ? (
            <AppText variant="caption" color="accentCyan">
              המסגרת מופעלת על כרטיס הדרגה.
            </AppText>
          ) : null}
          {reward.status === 'CLAIMED' && reward.rewardType !== 'PROFILE_SKIN' ? <Button title="פתיחה" variant="secondary" icon="open-outline" onPress={() => use(reward)} /> : null}
        </GlassCard>
      ))}

      <Modal visible={open !== null} animationType="slide" onRequestClose={() => setOpen(null)}>
        <SafeAreaView style={styles.modal} accessibilityViewIsModal>
          <View style={styles.header}>
            <AppText variant="title" accessibilityRole="header" style={styles.flex}>
              {open?.titleHe ?? ''}
            </AppText>
            <IconButton icon="close" accessibilityLabel="סגירה" onPress={() => setOpen(null)} />
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {open?.payloadKey === 'whistle' ? <HighFrequencyWhistle /> : null}
            {open?.payloadKey === 'sound-lab' ? <SoundDesensitizationLab /> : null}
            {open?.payloadKey === 'certificate-foundation' ? <CertificateGenerator kind="FOUNDATION" {...certificate} /> : null}
            {open?.payloadKey === 'certificate-grandmaster' ? <CertificateGenerator kind="GRANDMASTER" {...certificate} /> : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  modal: {
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
