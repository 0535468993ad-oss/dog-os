import type { BreedProfile } from '../types';

// Toy breeds. Estimated Israeli ranges, October 2026.

export const TOY_BREEDS: readonly BreedProfile[] = [
  {
    id: 'chihuahua',
    nameHe: 'צ׳יוואווה',
    nameEn: 'Chihuahua',
    category: 'TOY',
    acquisition: 'IKC_BREEDER',
    size: 'SMALL',
    weightRangeKg: { min: 1.5, max: 3 },
    lifeExpectancyYears: { min: 14, max: 18 },
    metrics: { energyLevel: 3, mentalStimulationNeed: 2, sheddingLevel: 2, droolingLevel: 1, kidCompatibility: 1, strangerFriendliness: 2, dogSociability: 2, barkingTendency: 5, groomingEffort: 1, noviceFriendly: 3, preyDrive: 2 },
    tolerances: { maxAloneHoursPerDay: 6, minExerciseMinutesPerDay: 30, apartmentSuitable: true, hypoallergenic: false, heatSensitive: false },
    israeliEconomics: { estimatedMonthlyFoodILS: 80, estimatedMonthlyInsuranceAndVetILS: 180, estimatedMonthlyGroomingILS: 20, ikcPuppyPriceRangeILS: { min: 5000, max: 9000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['פריקת פיקת הברך', 'מחלת המסתם המיטרלי (MVD) בגיל מבוגר', 'מרפס פתוח בגולגולת (Molera) והידרוצפלוס', 'מחלות שיניים קשות – שיניים צפופות בלסת קטנה', 'היפוגליקמיה בגורים'],
      mandatoryParentClearancesHe: ['בדיקת פיקות ברך רשמית להורים', 'בדיקת לב (האזנה אצל קרדיולוג) להורים', 'בדיקת עיניים ECVO', 'להתרחק ממוכרים של "מיני" ו"טיקאפ" – משקל מתחת לסטנדרט הוא סיכון בריאותי'],
    },
    realityCheckWarningHe: 'כלב של 2 ק״ג קולט את העולם כמאיים. כשמרימים אותו בכל פעם במקום ללמד אותו להתמודד, הוא לומד לנבוח ולנשוך מפחד. עם פעוטות – סכנת פציעה לכלב בכל נפילה או לחיצה.',
    ikcClubId: 'toy',
  },
  {
    id: 'pomeranian',
    nameHe: 'פומרניאן',
    nameEn: 'Pomeranian',
    category: 'TOY',
    acquisition: 'IKC_BREEDER',
    size: 'SMALL',
    weightRangeKg: { min: 1.8, max: 3.5 },
    lifeExpectancyYears: { min: 12, max: 16 },
    metrics: { energyLevel: 3, mentalStimulationNeed: 3, sheddingLevel: 4, droolingLevel: 1, kidCompatibility: 2, strangerFriendliness: 3, dogSociability: 3, barkingTendency: 5, groomingEffort: 4, noviceFriendly: 3, preyDrive: 2 },
    tolerances: { maxAloneHoursPerDay: 6, minExerciseMinutesPerDay: 30, apartmentSuitable: true, hypoallergenic: false, heatSensitive: true },
    israeliEconomics: { estimatedMonthlyFoodILS: 90, estimatedMonthlyInsuranceAndVetILS: 200, estimatedMonthlyGroomingILS: 150, ikcPuppyPriceRangeILS: { min: 8000, max: 15000 } },
    medicalAndGenetics: {
      commonVulnerabilitiesHe: ['קריסת קנה הנשימה (Tracheal Collapse) – לטייל עם רתמה, לא עם קולר', 'פריקת פיקת הברך', 'התקרחות X (Alopecia X)', 'מחלות שיניים'],
      mandatoryParentClearancesHe: ['בדיקת פיקות ברך להורים', 'בדיקת לב ועיניים להורים', 'לראות את האם במקום – פרווה מלאה ומזג רגוע'],
    },
    realityCheckWarningHe: 'הפומרניאן הוא שפיץ בגוף זעיר: ערני, קולני ומגיב לכל רעש בבניין. בלי עבודה על סף נביחה מוקדם – תלונות שכנים. הפרווה הכפולה צריכה סירוק כמה פעמים בשבוע, ולעולם לא לגלח אותה עד העור.',
    ikcClubId: 'spitz',
  },
];
