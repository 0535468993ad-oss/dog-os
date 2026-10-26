import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/motion';
import { AppText } from '@/components/ui';
import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';

import { findBreedProfile } from '../utils/breedTraits';

/** "כרטיס מודיעין גזע": a link from a dog's profile to its breed's full profile; nothing when the breed has none. */
export function BreedIntelBadge({ breedId }: { breedId: string | null }) {
  const profile = findBreedProfile(breedId);
  if (!profile) return null;
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/breeds/[breedId]', params: { breedId: profile.id } })}
      style={styles.badge}
      accessibilityRole="link"
      accessibilityLabel={`כרטיס מודיעין גזע: ${profile.names.he}`}
    >
      <Ionicons name="id-card-outline" size={16} color={colors.accentCyan} accessible={false} />
      <AppText variant="caption" color="accentCyan">
        כרטיס מודיעין גזע
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
    borderColor: colors.accentCyan,
  },
});
