import { Stack } from 'expo-router';

import { AppText, Disclaimer, Screen, SectionHeader } from '@/components/ui';

import { DogWeightField } from './components/DogWeightField';
import { FoodSafetyLookup } from './components/FoodSafetyLookup';
import { PantrySelector } from './components/PantrySelector';
import { PantryWarnings } from './components/PantryWarnings';
import { PlanNotice } from './components/PlanNotice';
import { RecipeCard } from './components/RecipeCard';
import { useEmergencyKitchen } from './hooks/useEmergencyKitchen';

/** Emergency kitchen: check whether a food is safe, then build a bland meal from what's at home. */
export function EmergencyKitchenScreen() {
  const kitchen = useEmergencyKitchen();
  const { plan, weight } = kitchen;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'מטבח חירום' }} />
      <AppText color="textSecondary">
        הבטן של הכלב רגישה, או שנגמר האוכל? כאן בודקים מה מותר לתת, ומכינים ארוחה עדינה ממה שיש במטבח.
      </AppText>

      <FoodSafetyLookup query={kitchen.query} onChangeQuery={kitchen.setQuery} result={kitchen.lookup} />

      <SectionHeader title="מה יש לכם בבית?" />
      <PantrySelector value={kitchen.pantryIds} onChange={kitchen.setPantryIds} />
      <PantryWarnings report={kitchen.pantry} />

      <SectionHeader title="ארוחה עדינה לבטן רגישה" />
      <DogWeightField
        dogName={weight.dogName}
        value={weight.weightText}
        onChange={weight.setWeightText}
        error={plan?.status === 'invalid_weight' ? 'המשקל צריך להיות בין 1 ל־90 ק״ג.' : null}
      />
      {plan?.status === 'ready' ? <RecipeCard plan={plan} /> : <PlanNotice plan={plan} />}

      <Disclaimer>
        המטבח מיועד ליום־יומיים של בטן רגישה, לא לטיפול במחלה. אם הכלב אכל משהו רעיל, או שהוא חלש, מקיא שוב ושוב או שיש דם – פונים לווטרינר מיד.
      </Disclaimer>
    </Screen>
  );
}
