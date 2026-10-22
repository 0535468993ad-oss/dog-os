import type { BreedProfile } from '../types';

// Retrievers – Israel's classic family dogs. Estimated Israeli ranges, October 2026.

export const FAMILY_RETRIEVER_BREEDS: readonly BreedProfile[] = [
  {
    id: 'golden-retriever',
    nameHe: 'גולדן רטריבר',
    nameEn: 'Golden Retriever',
    category: 'RETRIEVER',
    acquisition: 'IKC_BREEDER',
    size: 'LARGE',
    weightRangeKg: { min: 25, max: 34 },
    lifeExpectancyYears: { min: 10, max: 12 },
    metrics: { energyLevel: 4, mentalStimulationNeed: 3, sheddingLevel: 5, droolingLevel: 2, kidCompatibility: 5, strangerFriendliness: 5, dogSociability: 5, barkingTendency: 2, groomingEffort: 3, noviceFriendly: 5, preyDrive: 2 },
    tolerances: { maxAloneHoursPerDay: 5, minExerciseMinutesPerDay: 75, apartmentSuitable: true, hypoallergenic: false, heatSensitive: true },
    israeliEconomics: { estimatedMonthlyFoodILS: 380, estimatedMonthlyInsuranceAndVetILS: 300, estimatedMonthlyGroomingILS: 100, ikcPuppyPriceRangeILS: { min: 7000, max: 12000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['שיעור גבוה של סרטן (המנגיוסרקומה, לימפומה)', 'דיספלזיה של הירך והמרפק', 'דלקת ענבייה פיגמנטרית ובעיות עיניים', 'היצרות תת־אאורטלית (SAS)', 'דלקות אוזניים ועור'],
      mandatoryParentClearancesHe: ['צילומי אגן ומרפקים רשמיים לשני ההורים', 'בדיקת עיניים ECVO שנתית (כולל ענבייה פיגמנטרית)', 'בדיקת לב אצל קרדיולוג', 'DNA: PRA-prcd, GR-PRA1, GR-PRA2 ואיכתיוזיס (ICT-A)'],
    },
    realityCheckWarningHe: 'גולדן אינו "כלב רגוע מהקופסה": עד גיל שנתיים־שלוש הוא אנרגטי, לועס ומושך ברצועה. הנשירה כבדה כל השנה, ועודף משקל – הבעיה הנפוצה בגזע – מקצר חיים ומחריף דיספלזיה.',
    ikcClubId: 'retriever',
  },
  {
    id: 'labrador',
    nameHe: 'לברדור רטריבר',
    nameEn: 'Labrador Retriever',
    category: 'RETRIEVER',
    acquisition: 'IKC_BREEDER',
    size: 'LARGE',
    weightRangeKg: { min: 25, max: 36 },
    lifeExpectancyYears: { min: 10, max: 13 },
    metrics: { energyLevel: 4, mentalStimulationNeed: 3, sheddingLevel: 4, droolingLevel: 2, kidCompatibility: 5, strangerFriendliness: 5, dogSociability: 5, barkingTendency: 2, groomingEffort: 2, noviceFriendly: 5, preyDrive: 2 },
    tolerances: { maxAloneHoursPerDay: 5, minExerciseMinutesPerDay: 75, apartmentSuitable: true, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 380, estimatedMonthlyInsuranceAndVetILS: 280, estimatedMonthlyGroomingILS: 40, ikcPuppyPriceRangeILS: { min: 6000, max: 10000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['השמנה – חלק מהלברדורים נושאים מוטציה בגן POMC שמגבירה רעב', 'דיספלזיה של הירך והמרפק', 'קריסה מושרית מאימון (EIC)', 'ניוון רשתית מתקדם (PRA)'],
      mandatoryParentClearancesHe: ['צילומי אגן ומרפקים רשמיים לשני ההורים', 'DNA: EIC, PRA-prcd, CNM ו־HNPK', 'בדיקת עיניים ECVO בתוקף'],
    },
    realityCheckWarningHe: 'לברדור שלא מקבל עבודה לאף ולפה – יאכל גרביים, חצץ ומה שנשאר על השיש. בלי שליטה במשקל מגיל צעיר, המפרקים משלמים את המחיר עד גיל 7.',
    ikcClubId: 'retriever',
  },
];
