import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing, tints } from '@/constants/theme';

import { findBreedProfile } from '../utils/breedTraits';

/** "פרופיל ומודיעין גזע": a link from a dog's profile to its breed's full profile; nothing when the breed has none. */
export function BreedIntelBadge({ breedId }: { breedId: string | null }) {
  const profile = findBreedProfile(breedId);
  if (!profile) return null;
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/breeds/[breedId]', params: { breedId: profile.id } })}
      style={styles.badge}
      accessibilityRole="link"
      accessibilityLabel={`פרופיל ומודיעין גזע: ${profile.names.he}`}
    >
      <Ionicons name="ribbon-outline" size={16} color={colors.primaryBright} accessible={false} />
      <AppText variant="caption" color="primaryBright">
        פרופיל ומודיעין גזע
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_AREA,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: tints.primaryHighlightBorder,
    backgroundColor: colors.primaryMuted,
  },
});
