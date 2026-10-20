import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ChipGroup, Disclaimer, ErrorState, LoadingState, TextField } from '@/components/ui';
import type { DogRow, FoodPortionRow } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { ageInMonths } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { deleteFood, saveFood, type FoodInput } from '../api';
import { useHealth, useHealthMutation } from '../hooks';
import { buildFoodInput, parseDecimal, parseMeals, type FoodFormErrors } from '../logic/foodForm';
import { ACTIVITY_LABELS, calculatePortion, LIFE_STAGE_LABELS, type ActivityLevel } from '../nutrition';
import { FormActions } from './FormActions';
import { SubmitError } from './SubmitError';
import { WithDog } from './WithDog';

const ACTIVITY_OPTIONS = (Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((value) => ({ value, label: ACTIVITY_LABELS[value] }));

/** Route screen: the meal calculator / feeding plan, new or editing the plan with `id`. */
export function FoodFormScreen({ id }: { id?: string }) {
  return <WithDog title={id ? 'עריכת תוכנית האכלה' : 'מחשבון מנות'}>{(dog) => <FoodLoader dog={dog} id={id} />}</WithDog>;
}

/** Finds the plan being edited; keyed fields initialize once, so refetches never overwrite typing. */
function FoodLoader({ dog, id }: { dog: DogRow; id?: string }) {
  const health = useHealth(dog.id);
  const existing = id ? health.data?.food.find((f) => f.id === id) : undefined;
  if (id && health.isLoading) return <LoadingState />;
  if (id && !existing) return <ErrorState message="התוכנית לא נמצאה." />;
  return <FoodFields key={existing?.id ?? 'new'} dog={dog} existing={existing} />;
}

/** Feeding-plan form with a live portion calculation from the dog's weight, age, size and activity. */
function FoodFields({ dog, existing }: { dog: DogRow; existing?: FoodPortionRow }) {
  const id = existing?.id;
  const save = useHealthMutation(dog.id, (input: FoodInput) => saveFood(dog.id, input, id));
  const remove = useHealthMutation(dog.id, () => deleteFood(id!));

  const [foodName, setFoodName] = useState(existing?.food_name ?? '');
  const [kcal, setKcal] = useState(existing?.kcal_per_100g != null ? String(existing.kcal_per_100g) : '');
  const [meals, setMeals] = useState(existing ? String(existing.meals_per_day) : '2');
  const [weight, setWeight] = useState(dog.weight_kg != null ? String(dog.weight_kg) : '');
  const [activity, setActivity] = useState<ActivityLevel>('normal');
  const [gramsOverride, setGramsOverride] = useState(existing ? String(existing.grams_per_meal) : '');
  const [errors, setErrors] = useState<FoodFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const weightKg = parseDecimal(weight);
  const kcalPer100g = parseDecimal(kcal);
  const mealsPerDay = parseMeals(meals);
  const canCalculate = weightKg > 0 && weightKg < 150 && kcalPer100g > 0 && mealsPerDay >= 1 && mealsPerDay <= 6;
  const plan = canCalculate ? calculatePortion({ weightKg, ageMonths: ageInMonths(dog.birth_date), size: dog.size, activity, kcalPer100g, mealsPerDay }) : null;

  // Validates through buildFoodInput, saves, and returns to the previous screen.
  const submit = async () => {
    const { input, errors: next } = buildFoodInput({ foodName, kcal, meals, gramsOverride }, plan?.gramsPerMeal ?? null);
    setErrors(next);
    if (!input) return;
    try {
      await save.mutateAsync(input);
      router.back();
    } catch (e) {
      setSubmitError(toUserMessage(e));
    }
  };

  return (
    <>
      <Disclaimer>החישוב מבוסס על נוסחת אנרגיה מקובלת ומהווה נקודת התחלה בלבד. התאימו לפי מבנה הגוף ובהתייעצות עם הווטרינר.</Disclaimer>
      <Card>
        <TextField label="שם המזון" value={foodName} onChangeText={setFoodName} error={errors.foodName} maxLength={80} placeholder="שם המותג והסוג" />
        <TextField
          label="קלוריות ל-100 גרם"
          value={kcal}
          onChangeText={setKcal}
          inputMode="decimal"
          keyboardType="decimal-pad"
          hint="מופיע על השקית (kcal/100g). אם כתוב kcal/kg – חלקו ב-10."
          placeholder="370"
        />
        <TextField label="משקל הכלב (ק״ג)" value={weight} onChangeText={setWeight} inputMode="decimal" keyboardType="decimal-pad" />
        <TextField label="ארוחות ביום" value={meals} onChangeText={setMeals} inputMode="numeric" keyboardType="number-pad" error={errors.meals} maxLength={1} />
        <View style={styles.group}>
          <AppText variant="label" color="textSecondary">
            רמת פעילות
          </AppText>
          <ChipGroup options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} accessibilityLabel="רמת פעילות" />
        </View>
      </Card>

      {plan ? (
        <Card tone="primary" accessibilityLabel={`תוצאת החישוב: ${plan.gramsPerMeal} גרם לארוחה, ${plan.gramsPerDay} גרם ביום`}>
          <AppText variant="label">{`שלב חיים: ${LIFE_STAGE_LABELS[plan.stage]}`}</AppText>
          <AppText variant="heading">{`${plan.gramsPerMeal} גרם לארוחה`}</AppText>
          <AppText>{`${plan.gramsPerDay} גרם ביום · כ-${plan.dailyKcal} קק״ל`}</AppText>
        </Card>
      ) : null}

      <TextField
        label="גרם לארוחה (לעדכון ידני)"
        value={gramsOverride}
        onChangeText={setGramsOverride}
        inputMode="decimal"
        keyboardType="decimal-pad"
        optional
        hint={plan ? `ריק = ${plan.gramsPerMeal} גרם לפי המחשבון` : 'אם הווטרינר קבע מנה – הזינו אותה כאן'}
        error={errors.grams}
      />
      <SubmitError message={submitError} />
      <FormActions
        onSave={submit}
        saving={save.isPending}
        onDelete={
          existing
            ? async () => {
                await remove.mutateAsync(undefined);
                router.back();
              }
            : undefined
        }
        deleting={remove.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
});
