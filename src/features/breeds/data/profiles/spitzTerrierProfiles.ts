import type { BreedProfile } from '../../types';
import { FCI_GROUP_NAMES_HE } from '../fciGroups';

// The primitive sled dog and the working terrier: the Siberian Husky (FCI 5) and the Jack Russell
// Terrier (FCI 3) – both bred to work independently, with high prey drive and a love of escaping.

export const SPITZ_TERRIER_PROFILES: readonly BreedProfile[] = [
  {
    id: 'husky',
    names: { he: 'האסקי סיבירי', en: 'Siberian Husky', original: 'Siberian Husky' },
    tags: ['שפיץ', 'כלב מזחלת', 'אנרגיה גבוהה'],
    aliases: ['husky', 'siberian husky', 'siberian', 'האסקי', 'הסקי', 'האסקי סיבירי', 'סיבירי'],
    fci: { group: 5, section: 1, standardNumber: 270, groupNameHe: FCI_GROUP_NAMES_HE[5] },
    phenotype: { sizeCategory: 'MEDIUM', maleWeightKg: { min: 20.5, max: 28 }, femaleWeightKg: { min: 15.5, max: 23 }, maleHeightCm: { min: 53.5, max: 60 }, femaleHeightCm: { min: 50.5, max: 56 }, coatType: 'DOUBLE_COAT', sheddingLevel: 5, droolTendency: 1 },
    genesis: {
      centuryOfOrigin: 'שורשים בני אלפי שנים; הגיע לאלסקה ב־1908–1909',
      countryOfOrigin: 'סיביר (רוסיה); הגזע המודרני עוצב בארצות הברית',
      ancestorBreeds: ['כלבי המזחלת של בני הצ׳וקצ׳י'],
      founderOrHistoricalKeyFigures: 'בני העם הצ׳וקצ׳י בצפון־מזרח סיביר; לאונרד ספאלה, שהוביל את הקטע הארוך ביותר במרוץ הסרום לנום ב־1925 עם הכלב טוגו.',
      originalUtilityAndFunction: 'משיכת מזחלות במשקל קל למרחקים ארוכים, במזג אוויר קיצוני ובצריכת מזון נמוכה.',
      historicalContextNarrativeHe: 'הצ׳וקצ׳י גידלו כלבים שעובדים בצוות, עמידים וחסכוניים. ב־1925 העבירו צוותי מזחלות סרום נגד דיפתריה לעיר נום שבאלסקה, והמבצע הפך את ההאסקי למפורסם בעולם.',
    },
    drives: { preyDrive: 5, defenseDrive: 1, packDriveSocial: 5, playDrive: 4, handlerFocusBiddability: 2, environmentalSensitivity: 2, energyStaminaHoursDaily: 2.5, mentalStimulationRequirementHe: 'ריצה או משיכה ברתמה בשעות הקרירות, הרחה וחפירה מותרת בארגז חול – בישראל רק בבוקר מוקדם ובערב.' },
    behavior: {
      separationAnxietyRisk: 'HIGH',
      leashReactivityPredisposition: 'MODERATE',
      resourceGuardingTendency: 'LOW',
      vocalizationProfile: { tendency: 5, commonTriggersHe: ['בדידות – יללות', 'סירנות', 'התרגשות לפני יציאה'] },
      understimulationFalloutHe: 'בריחה וקפיצה מעל גדרות, חפירה, הרס, ויללות ממושכות שמפריעות לשכנים.',
      recommendedHandlingStyleHe: 'למנוסים: סבלנות, תגמול שווה מאוד וגדר בטוחה. עצמאי מטבעו – הקריאה לא אמינה, ולכן בשטח פתוח הוא נשאר ברצועה.',
    },
    clinical: {
      geneticVulnerabilities: [
        { conditionNameHe: 'קטרקט תורשתי צעיר', conditionNameEn: 'Juvenile Hereditary Cataract', pathologySummaryHe: 'עכירות של העדשה שמתחילה לעיתים כבר בגיל שנה ועלולה להתקדם לעיוורון.', severity: 'PROGRESSIVE', recommendedScreeningProtocol: 'בדיקת עיניים שנתית אצל רופא עיניים וטרינרי להורים ולכלב.' },
        { conditionNameHe: 'ניוון רשתית מתקדם תלוי כרומוזום X', conditionNameEn: 'X-linked Progressive Retinal Atrophy', pathologySummaryHe: 'ניוון הדרגתי של תאי הרשתית בזכרים: עיוורון לילה ואחריו עיוורון מלא.', severity: 'PROGRESSIVE', recommendedScreeningProtocol: 'בדיקת DNA לגן RPGR להורים לפני רבייה.' },
        { conditionNameHe: 'דרמטוזיס תלוי אבץ', conditionNameEn: 'Zinc-Responsive Dermatosis', pathologySummaryHe: 'קשקשת וקרום סביב העיניים, הפה והאוזניים בגלל ספיגה לקויה של אבץ.', severity: 'CHRONIC', recommendedScreeningProtocol: 'בדיקת עור וביופסיה אצל וטרינר כשמופיעים נגעים; לא מוסיפים תוספים בלי הנחיה.' },
      ],
      bloatGdvRisk: { hasHighPredisposition: false, chestConformationNotesHe: 'מבנה בינוני וקל – אין נטייה מוגברת מוכרת.' },
      anesthesiaMdr1Risk: { isMdr1Prone: false, precautionsHe: 'אין נטייה מוכרת ל־MDR1. בקיץ הישראלי – סכנת מכת חום במאמץ: מים, צל ופעילות רק בשעות הקרירות.' },
      averageLongevityYears: { min: 12, max: 14 },
    },
    suitability: { living: 'NEEDS_YARD', experience: 'EXPERIENCED_ONLY' },
    popularity: { akcRank2024: 26, akcBreedNameEn: 'Siberian Husky' },
  },
  {
    id: 'jack-russell',
    names: { he: 'ג׳ק ראסל טרייר', en: 'Jack Russell Terrier', original: 'Jack Russell Terrier' },
    tags: ['טרייר', 'ציד', 'אנרגיה גבוהה', 'קטן'],
    aliases: ['jack russell', 'jrt', 'jack russell terrier', 'russell terrier', 'ג׳ק ראסל', 'גק ראסל', 'ג׳ק', 'ראסל'],
    fci: { group: 3, section: 2, standardNumber: 345, groupNameHe: FCI_GROUP_NAMES_HE[3] },
    phenotype: { sizeCategory: 'SMALL', maleWeightKg: { min: 5, max: 6 }, femaleWeightKg: { min: 5, max: 6 }, maleHeightCm: { min: 25, max: 30 }, femaleHeightCm: { min: 25, max: 30 }, coatType: 'SHORT_SINGLE', sheddingLevel: 3, droolTendency: 1 },
    genesis: {
      centuryOfOrigin: 'המאה ה־19 (מ־1819)',
      countryOfOrigin: 'אנגליה; הסטנדרט המודרני התגבש באוסטרליה',
      ancestorBreeds: ['פוקס טרייר לבן לעבודה'],
      founderOrHistoricalKeyFigures: 'הכומר ג׳ון "ג׳ק" ראסל, שקנה ב־1819 כסטודנט באוקספורד את הכלבה הלבנה "טראמפ" וטיפח ממנה קו של טריירים לציד שועלים.',
      originalUtilityAndFunction: 'ריצה עם להקת כלבי הציד והוצאת שועלים ממחילות בלי לפגוע בהם.',
      historicalContextNarrativeHe: 'ראסל טיפח טרייר קטן, אמיץ ובעל סיבולת שיכול לרוץ עם הסוסים ולהיכנס למחילה. במשך עשרות שנים הגזע נבחר רק לפי יכולת ציד, וזה מסביר את הדחף העצום, העקשנות והאנרגיה שלו.',
    },
    drives: { preyDrive: 5, defenseDrive: 3, packDriveSocial: 3, playDrive: 5, handlerFocusBiddability: 3, environmentalSensitivity: 3, energyStaminaHoursDaily: 2, mentalStimulationRequirementHe: 'משחקי חיפוש, חפירה בארגז חול, משיכה עם כללים ותרגול "לא לגעת" ו"עזוב" כל יום.' },
    behavior: {
      separationAnxietyRisk: 'MODERATE',
      leashReactivityPredisposition: 'HIGH',
      resourceGuardingTendency: 'MODERATE',
      vocalizationProfile: { tendency: 4, commonTriggersHe: ['חתולים, ציפורים ומכרסמים', 'רעשים בחוץ', 'שעמום'] },
      understimulationFalloutHe: 'חפירה, נביחות בלתי פוסקות, רדיפה אחרי חיות קטנות ובריחה מהחצר.',
      recommendedHandlingStyleHe: 'למנוסים: אימונים קצרים ומגוונים עם תגמול, שליטה בדחף הציד, ולא משאירים לבד עם חיות מחמד קטנות.',
    },
    clinical: {
      geneticVulnerabilities: [
        { conditionNameHe: 'פריקה ראשונית של העדשה', conditionNameEn: 'Primary Lens Luxation', pathologySummaryHe: 'העדשה יוצאת ממקומה, לרוב בגיל 3–8, וגורמת לכאב חד ולגלאוקומה – מצב חירום עיני.', severity: 'LIFE_THREATENING', recommendedScreeningProtocol: 'בדיקת DNA לגן ADAMTS17 להורים; פנייה מיידית לווטרינר בעין אדומה, דומעת או עכורה.' },
        { conditionNameHe: 'פריקת פיקת הברך', conditionNameEn: 'Patellar Luxation', pathologySummaryHe: 'פיקת הברך זזה ממקומה: קפיצות על שלוש רגליים, ועם הזמן דלקת מפרקים.', severity: 'CHRONIC', recommendedScreeningProtocol: 'בדיקה אורתופדית אצל וטרינר להורים ולגורים.' },
        { conditionNameHe: 'אטקסיה ספינוצרבלרית', conditionNameEn: 'Spinocerebellar Ataxia', pathologySummaryHe: 'מחלה נוירולוגית תורשתית: הליכה לא מתואמת שמתחילה בגיל צעיר ומחמירה.', severity: 'PROGRESSIVE', recommendedScreeningProtocol: 'בדיקות DNA לגנים KCNJ10 ו־CAPN1 להורים לפני רבייה.' },
      ],
      bloatGdvRisk: { hasHighPredisposition: false, chestConformationNotesHe: 'כלב קטן – אין נטייה לתסובב קיבה.' },
      anesthesiaMdr1Risk: { isMdr1Prone: false, precautionsHe: 'אין נטייה מוכרת ל־MDR1.' },
      averageLongevityYears: { min: 13, max: 16 },
    },
    suitability: { living: 'NEEDS_YARD', experience: 'EXPERIENCED_ONLY' },
    popularity: { akcRank2024: 66, akcBreedNameEn: 'Russell Terrier' },
  },
];
