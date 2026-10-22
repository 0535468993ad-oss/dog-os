import type { BreedProfile } from '../types';

// The two dogs Israeli shelters are full of. Not breeds: typical profiles, so every dog still needs a
// personal assessment (see the adult adoption protocol). The price range is the adoption basket.

const ADOPTION_BASKET_ILS = { min: 700, max: 1000 } as const;

export const RESCUE_ARCHETYPES: readonly BreedProfile[] = [
  {
    id: 'canaan-mix',
    nameHe: 'מעורב כנעני – כלב המקלט הבינוני',
    nameEn: 'Canaan-type Shelter Mix',
    category: 'RESCUE_ARCHETYPE',
    acquisition: 'RESCUE',
    size: 'MEDIUM',
    weightRangeKg: { min: 15, max: 25 },
    lifeExpectancyYears: { min: 12, max: 15 },
    metrics: { energyLevel: 3, mentalStimulationNeed: 3, sheddingLevel: 3, droolingLevel: 1, kidCompatibility: 3, strangerFriendliness: 2, dogSociability: 3, barkingTendency: 4, groomingEffort: 1, noviceFriendly: 3, preyDrive: 3 },
    tolerances: { maxAloneHoursPerDay: 6, minExerciseMinutesPerDay: 60, apartmentSuitable: true, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 220, estimatedMonthlyInsuranceAndVetILS: 190, estimatedMonthlyGroomingILS: 20, ikcPuppyPriceRangeILS: ADOPTION_BASKET_ILS },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['גנטיקה מגוונת – בדרך כלל כלב חסון', 'מחלות מקומיות: ליישמניה, ארליכיה (קדחת קרציות) וספירוצרקה', 'היסטוריה לא ידועה – לעיתים טראומה או חשיפה חברתית חסרה'],
      mandatoryParentClearancesHe: ['בדיקת דם לליישמניה ולארליכיה לפני האימוץ', 'אישור חיסונים, שבב ועיקור/סירוס בסל האימוץ', 'דיווח מבית האומנה: התנהגות עם אנשים, כלבים, חתולים וזמן לבד'],
    },
    realityCheckWarningHe: 'לכלב הכנעני ולמעורביו יש מורשת של שמירה וערנות: חשדנות טבעית כלפי זרים ונביחה על כל שינוי. בלי חשיפה הדרגתית ובלי כבוד לקצב שלהם – החשדנות הופכת לתגובתיות.',
  },
  {
    id: 'saluki-mix',
    nameHe: 'מעורב סלוקי / גרייהאונד',
    nameEn: 'Saluki / Greyhound Sighthound Mix',
    category: 'RESCUE_ARCHETYPE',
    acquisition: 'RESCUE',
    size: 'LARGE',
    weightRangeKg: { min: 18, max: 30 },
    lifeExpectancyYears: { min: 11, max: 14 },
    metrics: { energyLevel: 3, mentalStimulationNeed: 2, sheddingLevel: 2, droolingLevel: 1, kidCompatibility: 3, strangerFriendliness: 3, dogSociability: 4, barkingTendency: 1, groomingEffort: 1, noviceFriendly: 3, preyDrive: 5 },
    tolerances: { maxAloneHoursPerDay: 6, minExerciseMinutesPerDay: 45, apartmentSuitable: true, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 260, estimatedMonthlyInsuranceAndVetILS: 200, estimatedMonthlyGroomingILS: 20, ikcPuppyPriceRangeILS: ADOPTION_BASKET_ILS },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['רגישות להרדמה – שומן גוף נמוך; לבקש מהווטרינר פרוטוקול מותאם לכלבי ציד־ראייה', 'עור דק – קרעים מגדרות ומשחק עם כלבים', 'רגישות לקור בחורף', 'מחלות מקומיות: ליישמניה וארליכיה'],
      mandatoryParentClearancesHe: ['בדיקת דם לליישמניה ולארליכיה', 'מבחן חתולים מבוקר בבית האומנה – אם יש חתול בבית', 'דיווח על פציעות ישנות (רבים נזנחו אחרי ציד)'],
    },
    realityCheckWarningHe: 'כלב ציד־ראייה רודף אחרי תנועה לפני שהוא חושב. היענות לקריאה לא תחזיק מול חתול רץ – הוא משתחרר רק בשטח סגור. בבית הוא דווקא שקט ו"ספה מקצועית".',
  },
];
