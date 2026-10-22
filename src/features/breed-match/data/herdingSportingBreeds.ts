import type { BreedProfile } from '../types';

// High-drive herding and pointing breeds. Estimated Israeli ranges, October 2026.

export const HERDING_SPORTING_BREEDS: readonly BreedProfile[] = [
  {
    id: 'border-collie',
    nameHe: 'בורדר קולי',
    nameEn: 'Border Collie',
    category: 'HERDING',
    acquisition: 'IKC_BREEDER',
    size: 'MEDIUM',
    weightRangeKg: { min: 14, max: 22 },
    lifeExpectancyYears: { min: 12, max: 15 },
    metrics: { energyLevel: 5, mentalStimulationNeed: 5, sheddingLevel: 4, droolingLevel: 1, kidCompatibility: 3, strangerFriendliness: 3, dogSociability: 3, barkingTendency: 3, groomingEffort: 3, noviceFriendly: 2, preyDrive: 4 },
    tolerances: { maxAloneHoursPerDay: 4, minExerciseMinutesPerDay: 120, apartmentSuitable: false, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 250, estimatedMonthlyInsuranceAndVetILS: 210, estimatedMonthlyGroomingILS: 50, ikcPuppyPriceRangeILS: { min: 5000, max: 9000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['אנומליית עין של הקולי (CEA)', 'אפילפסיה אידיופתית', 'דיספלזיה של הירך (HD)', 'תסמונת הנויטרופילים הכלואים (TNS) וליפופוסצינוזיס (CL) – תורשתיות וקטלניות'],
      mandatoryParentClearancesHe: ['פאנל DNA להורים: CEA, TNS, CL, IGS ו־MDR1', 'בדיקת עיניים ECVO בתוקף (עד שנה)', 'צילומי אגן רשמיים'],
    },
    realityCheckWarningHe: 'הבורדר קולי נבנה כדי לעבוד שעות בריכוז. בלי עבודה – הוא ימציא לעצמו: ירעה ילדים, ירדוף מכוניות ואופניים, יתקבע על צללים ואורות. ריצה לבד לא מספיקה – הוא צריך משימות לראש.',
    ikcClubId: 'shepherd',
  },
  {
    id: 'australian-shepherd',
    nameHe: 'רועה אוסטרלי',
    nameEn: 'Australian Shepherd',
    category: 'HERDING',
    acquisition: 'IKC_BREEDER',
    size: 'MEDIUM',
    weightRangeKg: { min: 16, max: 32 },
    lifeExpectancyYears: { min: 12, max: 15 },
    metrics: { energyLevel: 5, mentalStimulationNeed: 5, sheddingLevel: 4, droolingLevel: 1, kidCompatibility: 4, strangerFriendliness: 3, dogSociability: 3, barkingTendency: 3, groomingEffort: 4, noviceFriendly: 2, preyDrive: 4 },
    tolerances: { maxAloneHoursPerDay: 4, minExerciseMinutesPerDay: 105, apartmentSuitable: false, hypoallergenic: false, heatSensitive: true },
    israeliEconomics: { estimatedMonthlyFoodILS: 280, estimatedMonthlyInsuranceAndVetILS: 220, estimatedMonthlyGroomingILS: 120, ikcPuppyPriceRangeILS: { min: 7000, max: 12000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['מוטציית MDR1 – רגישות קטלנית לאיברמקטין ולתרופות נוספות', 'דיספלזיה של הירך והמרפק', 'קטרקט תורשתי (HSF4)', 'חירשות ועיוורון בגורים של זיווג מרל × מרל'],
      mandatoryParentClearancesHe: ['בדיקת DNA ל־MDR1, ל־HSF4 ול־PRA-prcd', 'צילומי אגן ומרפקים רשמיים', 'אישור בכתב שלא בוצע זיווג מרל עם מרל', 'בדיקת עיניים ECVO'],
    },
    realityCheckWarningHe: 'אוסי משועמם הוא כלב רועה בלי עדר: הוא נוגס בעקבים, נובח על כל תנועה ולא נרגע. והפרווה הכפולה – בקיץ הישראלי הוא צריך מיזוג, מים ופעילות רק בבוקר המוקדם או בלילה.',
    ikcClubId: 'shepherd',
  },
  {
    id: 'vizsla',
    nameHe: 'ויזסלה הונגרי',
    nameEn: 'Hungarian Vizsla',
    category: 'SPORTING',
    acquisition: 'IKC_BREEDER',
    size: 'MEDIUM',
    weightRangeKg: { min: 20, max: 30 },
    lifeExpectancyYears: { min: 12, max: 15 },
    metrics: { energyLevel: 5, mentalStimulationNeed: 4, sheddingLevel: 2, droolingLevel: 2, kidCompatibility: 4, strangerFriendliness: 4, dogSociability: 4, barkingTendency: 3, groomingEffort: 1, noviceFriendly: 3, preyDrive: 4 },
    tolerances: { maxAloneHoursPerDay: 3, minExerciseMinutesPerDay: 105, apartmentSuitable: false, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 300, estimatedMonthlyInsuranceAndVetILS: 220, estimatedMonthlyGroomingILS: 20, ikcPuppyPriceRangeILS: { min: 6000, max: 10000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['אפילפסיה אידיופתית', 'תת־פעילות של בלוטת התריס', 'דלקת בלוטות החלב בעור (Sebaceous Adenitis)', 'דיספלזיה של הירך'],
      mandatoryParentClearancesHe: ['צילומי אגן רשמיים', 'פאנל תריס (כולל נוגדנים) להורים', 'בדיקת עיניים ECVO', 'היסטוריית אפילפסיה בשלושה דורות – לשאול ולקבל בכתב'],
    },
    realityCheckWarningHe: 'הוויזסלה מכונה "כלב סקוטש": הוא נבנה לעבוד צמוד לצייד ומתקשה מאוד בבדידות. השאירו אותו שמונה שעות לבד – וקבלו חרדת נטישה, יללות ודלת מכורסמת.',
  },
];
