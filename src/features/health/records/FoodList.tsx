import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, Button, Card, SectionHeader } from '@/components/ui';
import type { FoodPortionRow } from '@/lib/database.types';

/** The dog's feeding plan, with a link to the portion calculator. */
export function FoodList({ food }: { food: FoodPortionRow[] }) {
  return (
    <>
      <SectionHeader
        title="תזונה"
        action={<Button title="מחשבון מנות" icon="calculator-outline" variant="ghost" compact onPress={() => router.push('/health/food')} />}
      />
      {food.length === 0 ? (
        <Card>
          <AppText color="textSecondary">לא הוגדרה תוכנית האכלה. השתמשו במחשבון כדי לחשב מנה מומלצת.</AppText>
        </Card>
      ) : (
        food.map((f, index) => (
          <Animated.View key={f.id} entering={enterAt(index)}>
            <Card
              onPress={() => router.push({ pathname: '/health/food', params: { id: f.id } })}
              accessibilityLabel={`${f.food_name}: ${f.meals_per_day} ארוחות של ${f.grams_per_meal} גרם. עריכה`}
            >
              <AppText variant="subheading">{f.food_name}</AppText>
              <AppText color="textSecondary">{`${f.meals_per_day} ארוחות ביום × ${f.grams_per_meal} גרם`}</AppText>
            </Card>
          </Animated.View>
        ))
      )}
    </>
  );
}
