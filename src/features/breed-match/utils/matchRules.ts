import type { BreedProfile, LifestyleProfile, MonthlyCost, RuleFinding } from '../types';
import { budgetShortfall, formatILS } from './costs';

// One rule per lifestyle dimension. Each returns its findings: points off a 100-point score, soft
// cautions, and deal-breakers – combinations that predictably end in a returned or suffering dog.

const NONE: RuleFinding = { penalty: 0 };

/** Herding/working lines bred for hours of work: top energy and top need for mental work. */
export function isHighDriveWorking(breed: BreedProfile): boolean {
  return breed.metrics.energyLevel === 5 && breed.metrics.mentalStimulationNeed === 5;
}

const isApartment = (profile: LifestyleProfile) => profile.dwelling === 'APT_ELEVATOR' || profile.dwelling === 'APT_NO_ELEVATOR';

/** Daily vigorous exercise against the breed's minimum. */
export function exerciseRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const min = breed.tolerances.minExerciseMinutesPerDay;
  if (isHighDriveWorking(breed) && profile.vigorousMinutesPerDay < 90) {
    return [{ penalty: 40, dealBreakerHe: `${breed.nameHe} צריך לפחות ${min} דקות של פעילות אמיתית ביום. עם פחות מ־90 דקות, הדחף שלא מוצה הופך לתסכול, להרס ולהתנהגויות כפייתיות.` }];
  }
  const shortfall = min - profile.vigorousMinutesPerDay;
  if (shortfall <= 0) return [NONE];
  return [{ penalty: Math.round(Math.min(30, (shortfall / min) * 40)), cautionHe: `חסרות כ־${shortfall} דקות פעילות ביום לעומת הצורך של הגזע (${min} דקות).` }];
}

/** Hours alone against the breed's tolerance for solitude. */
export function aloneRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const excess = profile.aloneHoursPerDay - breed.tolerances.maxAloneHoursPerDay;
  if (excess >= 3) {
    return [{ penalty: 30, dealBreakerHe: `${profile.aloneHoursPerDay} שעות לבד הן הרבה מעבר למה ש${breed.nameHe} מסוגל לשאת (עד ${breed.tolerances.maxAloneHoursPerDay}). זה מתכון לחרדת נטישה.` }];
  }
  if (excess <= 0) return [NONE];
  return [{ penalty: 8 * excess, cautionHe: 'הכלב יישאר לבד יותר מהמומלץ לגזע – כדאי לתכנן מטפל/ת כלבים או גן כלבים באמצע היום.' }];
}

/** Home type, stairs and neighbours. */
export function dwellingRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const findings: RuleFinding[] = [];
  if (isApartment(profile) && !breed.tolerances.apartmentSuitable) {
    findings.push({ penalty: 15, cautionHe: 'הגזע מתקשה בדירה: חסרים לו מרחב ותעסוקה בבית.' });
  }
  if (profile.dwelling === 'APT_NO_ELEVATOR' && (breed.size === 'LARGE' || breed.size === 'GIANT')) {
    findings.push({ penalty: 8, cautionHe: 'כלב גדול בדירה בלי מעלית: מדרגות מעמיסות על מפרקים של גור, ובגיל מבוגר או אחרי ניתוח תצטרכו לסחוב אותו.' });
  }
  if (profile.surroundings === 'URBAN_DENSE' && breed.metrics.barkingTendency >= 4) {
    findings.push({ penalty: 5, cautionHe: 'נטייה גבוהה לנביחה בעיר צפופה – כדאי לעבוד על סף הנביחה כבר מהגורות.' });
  }
  return findings;
}

/** Handler experience against how forgiving the breed is. */
export function experienceRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  if (profile.experience !== 'FIRST_TIME') return [NONE];
  if (isHighDriveWorking(breed) && isApartment(profile)) {
    return [{ penalty: 35, dealBreakerHe: `${breed.nameHe} ככלב ראשון ובדירה: שילוב בסיכון גבוה. גזע עבודה עם דחף גבוה צריך מוביל מנוסה ומרחב.` }];
  }
  if (breed.metrics.noviceFriendly === 1) {
    return [{ penalty: 35, dealBreakerHe: `${breed.nameHe} אינו מתאים ככלב ראשון: הוא דורש ניסיון בקריאת כלבים ובאילוף מתקדם.` }];
  }
  if (breed.metrics.noviceFriendly === 2) {
    return [{ penalty: 20, cautionHe: 'גזע תובעני לבעלים בפעם הראשונה – רק עם מאלף מלווה מהשבוע הראשון.' }];
  }
  return [NONE];
}

/** Young children and small pets in the home. */
export function householdRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const { kidCompatibility, preyDrive } = breed.metrics;
  const findings: RuleFinding[] = [];
  if (profile.household.infantsOrToddlers && kidCompatibility === 1) {
    findings.push({ penalty: 30, dealBreakerHe: 'בבית עם פעוטות: הגזע רגיש מדי למגע ולרעש של ילדים צעירים, וסכנת הפציעה הדדית.' });
  } else if (profile.household.infantsOrToddlers && kidCompatibility === 2) {
    findings.push({ penalty: 20, cautionHe: 'עם פעוטות בבית נדרשת השגחה צמודה והפרדה מלאה כשאין מבוגר בחדר.' });
  } else if (profile.household.olderKids && kidCompatibility <= 2) {
    findings.push({ penalty: 10, cautionHe: 'עם ילדים בבית כדאי ללמד את הילדים לקרוא את שפת הגוף של הכלב.' });
  }
  if (profile.household.catsOrSmallPets && preyDrive === 5) {
    findings.push({ penalty: 30, dealBreakerHe: 'דחף טרף גבוה מאוד מול חתולים או חיות קטנות בבית – רצף הציד (מבט, התגנבות, רדיפה, תפיסה) עלול להסתיים בפגיעה.' });
  } else if (profile.household.catsOrSmallPets && preyDrive === 4) {
    findings.push({ penalty: 12, cautionHe: 'דחף טרף משמעותי: היכרות עם החתול רק בהדרגה, עם רצועה ומרחב מילוט לחתול.' });
  }
  return findings;
}

/** Allergies and tolerance for shedding. A strict need removes shedding breeds altogether. */
export function coatRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const { sheddingLevel } = breed.metrics;
  if (profile.allergy === 'STRICT_HYPOALLERGENIC' && !breed.tolerances.hypoallergenic) {
    return [{ penalty: 100, exclude: true, dealBreakerHe: 'הפרווה נושרת – לא מתאים למי שיש לו אלרגיה.' }];
  }
  if (profile.allergy === 'PREFER_LOW_SHEDDING' && sheddingLevel >= 4) return [{ penalty: 15, cautionHe: 'נשירה כבדה – שיער על הבגדים והספה כל השנה.' }];
  if (profile.allergy === 'PREFER_LOW_SHEDDING' && sheddingLevel === 3) return [{ penalty: 5 }];
  return [NONE];
}

/** The household's monthly envelope against the breed's upkeep. */
export function budgetRule(profile: LifestyleProfile, cost: MonthlyCost): RuleFinding[] {
  const shortfall = budgetShortfall(profile.monthlyBudgetILS, cost);
  if (shortfall >= 0.25) {
    return [{ penalty: 30, dealBreakerHe: `התחזוקה החודשית מוערכת בכ־${formatILS(cost.totalILS)}, הרבה מעל התקציב. כלב בלי ביטוח ובלי טיפול מונע – יגיע לווטרינר רק במצב חירום.` }];
  }
  if (shortfall === 0) return [NONE];
  return [{ penalty: Math.round(shortfall * 60), cautionHe: `התקציב צמוד: התחזוקה מוערכת בכ־${formatILS(cost.totalILS)} בחודש.` }];
}

/** What the household wants the dog for, against what the dog was bred for. */
export function goalRule(profile: LifestyleProfile, breed: BreedProfile): RuleFinding[] {
  const { energyLevel, kidCompatibility, mentalStimulationNeed } = breed.metrics;
  switch (profile.goal) {
    case 'COUCH_COMPANION':
      return energyLevel >= 4 ? [{ penalty: energyLevel === 5 ? 25 : 15, cautionHe: 'מחפשים כלב רגוע – הגזע הזה רחוק מזה.' }] : [NONE];
    case 'FAMILY_BUDDY':
      return kidCompatibility <= 2 ? [{ penalty: 15, cautionHe: 'הגזע אינו הבחירה הטבעית לכלב משפחה עם ילדים.' }] : [NONE];
    case 'ATHLETE':
      if (energyLevel <= 2 && breed.tolerances.heatSensitive) {
        return [{ penalty: 35, dealBreakerHe: 'ריצות עם כלב בעל פנים מקוצרות מסכנות את חייו – במיוחד בחום הישראלי.' }];
      }
      if (energyLevel <= 2) return [{ penalty: 20, cautionHe: 'הגזע לא בנוי לריצות ארוכות.' }];
      return breed.tolerances.heatSensitive ? [{ penalty: 5, cautionHe: 'ריצות רק בשעות הקרירות – הגזע רגיש לחום.' }] : [NONE];
    case 'WORKING_DRIVE':
      if (mentalStimulationNeed <= 2) return [{ penalty: 20, cautionHe: 'לגזע אין את הדחף לעבודה ולספורט מתקדם.' }];
      return mentalStimulationNeed === 3 ? [{ penalty: 10 }] : [NONE];
  }
}
