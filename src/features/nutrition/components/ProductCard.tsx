import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, GlassCard } from '@/components/ui';
import { colors, spacing, textGlow } from '@/constants/theme';

import type { FoodProduct, ServingUnitType } from '../types';
import { ProductImage } from './ProductImage';

const SERVING_LABELS: Record<ServingUnitType, string> = {
  POUCH: 'מנה בשקיות',
  CUP_AND_GRAMS: 'כוסות וגרמים',
  PUMP_OR_TABLET: 'לפי התווית',
};

interface ProductCardProps {
  product: FoodProduct;
  selected?: boolean;
  recommended?: boolean;
  onSelect?: () => void;
}

/** One catalog product: image, brand, price range, serving style, data caveats and a select action. */
export function ProductCard({ product, selected, recommended, onSelect }: ProductCardProps) {
  const { min, max } = product.priceRangeILS;
  return (
    <GlassCard>
      <View style={styles.row}>
        <ProductImage product={product} />
        <View style={styles.info}>
          <View style={styles.badges}>
            <Badge label={product.brand} tone="info" />
            {recommended ? <Badge label="מומלץ לכלב שלך" tone="success" icon="star" /> : null}
            {product.dietRole === 'COMPLEMENTARY' ? <Badge label="מזון משלים" tone="warning" /> : null}
          </View>
          <AppText variant="subheading">{product.nameHe}</AppText>
          <AppText variant="caption" color="textSecondary">{`${product.nameEn} · ${product.packageSize}`}</AppText>
        </View>
      </View>

      <AppText variant="caption">{product.highlightBenefitHe}</AppText>

      <View style={styles.row}>
        <AppText variant="heading" color="accentOrange" style={styles.price} accessibilityLabel={`מחיר משוער: ${min} עד ${max} שקלים`}>
          {`₪${min}–${max}`}
        </AppText>
        <Badge label={SERVING_LABELS[product.servingUnitType]} />
        {product.specSource === 'label-required' && product.category !== 'SUPPLEMENT' ? <Badge label="קלוריות מהאריזה" tone="warning" /> : null}
      </View>

      {onSelect ? (
        <Button
          title={selected ? 'נבחר' : 'בחירה'}
          variant={selected ? 'tonal' : 'primary'}
          icon={selected ? 'checkmark' : undefined}
          onPress={onSelect}
          disabled={selected}
          accessibilityLabel={selected ? `${product.nameHe} נבחר` : `בחירת ${product.nameHe}`}
        />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    gap: spacing.xxs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  price: {
    ...textGlow(colors.accentOrange),
  },
});
