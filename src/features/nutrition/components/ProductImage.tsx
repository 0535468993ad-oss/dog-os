import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius } from '@/constants/theme';

import type { FoodCategory, FoodProduct } from '../types';

const CATEGORY_ICON: Record<FoodCategory, ComponentProps<typeof Ionicons>['name']> = {
  POUCH: 'restaurant-outline',
  DRY_KIBBLE: 'nutrition-outline',
  SUPPLEMENT: 'medkit-outline',
};

/** First letters of the brand's first two words, e.g. "RC" for Royal Canin. */
function initials(brand: string): string {
  return brand
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}

/** The product photo when a licensed one exists; otherwise (or if it fails to load) a branded tile. */
export function ProductImage({ product, size = 64 }: { product: FoodProduct; size?: number }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size };

  if (product.imageUrl && !failed) {
    return (
      <Image
        source={{ uri: product.imageUrl }}
        style={[styles.box, box]}
        contentFit="contain"
        onError={() => setFailed(true)}
        accessibilityLabel={product.nameHe}
        alt={product.nameHe}
      />
    );
  }
  return (
    <View style={[styles.box, styles.tile, box]} accessible={false}>
      <Ionicons name={CATEGORY_ICON[product.category]} size={size * 0.34} color={colors.accentCyan} accessible={false} />
      <AppText variant="label" color="textSecondary">
        {initials(product.brand)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
  },
  tile: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
