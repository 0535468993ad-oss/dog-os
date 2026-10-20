import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, Button, GlassCard } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { findProduct } from '../data/foodCatalog';
import type { BreedAdvice } from '../types';

interface JointHealthAdvisorCardProps {
  dogName: string;
  advice: BreedAdvice;
  onPickProduct: (productId: string) => void;
}

/** Breed risks and what to do about them, with the catalog products that fit. */
export function JointHealthAdvisorCard({ dogName, advice, onPickProduct }: JointHealthAdvisorCardProps) {
  const products = advice.recommendedProductIds.flatMap((id) => findProduct(id) ?? []);
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        {advice.titleHe}
      </AppText>
      {advice.alertsHe.map((alert) => (
        <View key={alert} style={styles.alert}>
          <Ionicons name="alert-circle" size={18} color={colors.accentOrange} accessible={false} />
          <AppText style={styles.flex}>{alert}</AppText>
        </View>
      ))}
      <AppText variant="subheading">{`מה עושים בשביל ${dogName}`}</AppText>
      <BulletList items={advice.adviceHe} />
      {products.length ? (
        <>
          <AppText variant="subheading">מהקטלוג, מתאים לו</AppText>
          <View style={styles.products}>
            {products.map((product) => (
              <Button key={product.id} title={product.nameHe} variant="secondary" compact onPress={() => onPickProduct(product.id)} accessibilityLabel={`בחירת ${product.nameHe}`} />
            ))}
          </View>
        </>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  products: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
