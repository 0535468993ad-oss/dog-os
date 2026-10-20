import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { AppText, Button, Disclaimer, EmptyState, LoadingState, Screen, SectionHeader, SegmentedControl } from '@/components/ui';

import { CatalogExplorerModal } from './components/CatalogExplorerModal';
import { JointHealthAdvisorCard } from './components/JointHealthAdvisorCard';
import { PracticalServingCard } from './components/PracticalServingCard';
import { ProductCard } from './components/ProductCard';
import { TrainingDriveCard } from './components/TrainingDriveCard';
import { useNutritionPlan } from './hooks/useNutritionPlan';
import type { ActivityLevel } from './types';
import { ACTIVITY_LABELS } from './utils/energy';

const ACTIVITY_SEGMENTS = (Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((value) => ({ value, label: ACTIVITY_LABELS[value] }));

/** Nutrition: the active dog's daily portion of a chosen food, the training reserve and breed advice. */
export function NutritionScreen() {
  const nutrition = useNutritionPlan();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const { activeDog, profile, product, plan, advice } = nutrition;

  if (nutrition.isLoading) return <LoadingState />;
  if (!activeDog || !profile) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={{ title: 'תזונה' }} />
        <EmptyState
          icon="scale-outline"
          title={activeDog ? `חסר המשקל של ${activeDog.name}` : 'עוד אין כלב בפרופיל'}
          body="המנות מחושבות לפי המשקל, אז מתחילים ממנו."
          action={<Button title={activeDog ? 'עדכון המשקל' : 'הוספת כלב'} onPress={() => router.push(activeDog ? { pathname: '/dogs/edit', params: { id: activeDog.id } } : '/dogs/edit')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'תזונה' }} />
      <AppText color="textSecondary">{`${profile.name} · ${profile.weightKg} ק״ג. בוחרים מזון, ומקבלים מנה יומית מעשית – עם מקום לפרסים באימונים.`}</AppText>
      <SegmentedControl segments={ACTIVITY_SEGMENTS} value={nutrition.activity} onChange={nutrition.setActivity} accessibilityLabel="רמת הפעילות" />

      <SectionHeader title="המזון שנבחר" action={<Button title="החלפת מזון" variant="ghost" compact icon="swap-horizontal" onPress={() => setCatalogOpen(true)} />} />
      {product ? <ProductCard product={product} recommended={advice?.recommendedProductIds.includes(product.id)} /> : null}

      {product && plan ? (
        <PracticalServingCard
          dogName={profile.name}
          product={product}
          serving={plan.serving}
          budget={plan.budget}
          labelKcalText={nutrition.labelKcalText}
          onLabelKcalChange={nutrition.setLabelKcalText}
        />
      ) : null}
      {plan ? <TrainingDriveCard budget={plan.budget} /> : null}
      {advice ? <JointHealthAdvisorCard dogName={profile.name} advice={advice} onPickProduct={nutrition.chooseProduct} /> : null}

      <Disclaimer>
        המחירים הם טווח משוער ויכולים להשתנות בין חנויות. הערכים התזונתיים נלקחו מהיצרן או מחנויות, אבל מה שכתוב על השק שבידכם קובע. המחשבון מתאים לכלב בוגר ובריא; בכל שינוי משקל או מחלה – מתאמים עם הווטרינר.
      </Disclaimer>

      <CatalogExplorerModal
        open={catalogOpen}
        selectedId={product?.id}
        recommendedIds={advice?.recommendedProductIds ?? []}
        onPick={nutrition.chooseProduct}
        onClose={() => setCatalogOpen(false)}
      />
    </Screen>
  );
}
