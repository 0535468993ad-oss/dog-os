import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';

import { HERO_IMAGE, HERO_IMAGE_ALT } from './heroImage';

/**
 * The sign-in hero: the golden-hour photo (or a warm placeholder until it is added), runs under the status
 * bar and fades into the obsidian card at its bottom edge so the two read as one surface.
 */
export function AuthHero({ height }: { height: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { height }]}>
      {HERO_IMAGE === null ? (
        <>
          <Svg style={StyleSheet.absoluteFill} accessible={false}>
            <Defs>
              <LinearGradient id="heroGlow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primaryMuted} />
                <Stop offset="1" stopColor={colors.background} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroGlow)" />
          </Svg>
          <View style={[styles.brand, { paddingTop: insets.top }]}>
            <View style={styles.mark} accessible={false}>
              <Ionicons name="paw" size={34} color={colors.onPrimary} accessible={false} />
            </View>
            <AppText variant="display" color="primaryBright" center>
              Dog OS
            </AppText>
          </View>
        </>
      ) : (
        <Image source={HERO_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={HERO_IMAGE_ALT} alt={HERO_IMAGE_ALT} />
      )}
      {/* The fade starts well above the card's rounded edge, so the overlap never shows a seam. */}
      <Svg style={styles.fade} accessible={false}>
        <Defs>
          <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.background} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroFade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  fade: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    height: '45%',
  },
});
