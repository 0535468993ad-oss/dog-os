import type {
  AgeStage,
  AssessmentKey,
  CorrectionSensitivity,
  HandlerExperience,
  LivingEnv,
  OutdoorFocus,
  ReactivityType,
  StartleRecovery,
  TrainingGoal,
} from '../types';

// The diagnostic questionnaire: four steps, eleven questions. Option labels double as the validation
// tables for stored answers (own-property checks), so every enum value appears here exactly once.

export const AGE_STAGE_LABELS_HE: Readonly<Record<AgeStage, string>> = {
  PUPPY_2_6M: 'גור (2–6 חודשים)',
  ADOLESCENT_6_18M: 'מתבגר (6–18 חודשים)',
  ADULT_1_7Y: 'בוגר (שנה וחצי עד 7)',
  SENIOR_7Y_PLUS: 'מבוגר (7 ומעלה)',
};

/** The youngest age (months) each stage covers – used only when the birth date is unknown. */
export const AGE_STAGE_MIN_MONTHS: Readonly<Record<AgeStage, number>> = {
  PUPPY_2_6M: 2,
  ADOLESCENT_6_18M: 6,
  ADULT_1_7Y: 18,
  SENIOR_7Y_PLUS: 84,
};

export const LIVING_ENV_LABELS_HE: Readonly<Record<LivingEnv, string>> = {
  BUSY_CITY_APT: 'דירה בעיר סואנת',
  QUIET_APT: 'דירה בשכונה שקטה',
  HOUSE_WITH_YARD: 'בית עם חצר',
  RURAL_OPEN: 'כפר או שטח פתוח',
};

export const HANDLER_LABELS_HE: Readonly<Record<HandlerExperience, string>> = {
  FIRST_TIME: 'זה הכלב הראשון שלי',
  INTERMEDIATE: 'גידלתי ואילפתי כלבים בעבר',
  EXPERIENCED_WORKING_DOGS: 'ניסיון רב, גם עם כלבי עבודה',
};

export const STARTLE_LABELS_HE: Readonly<Record<StartleRecovery, string>> = {
  FEARFUL_SLOW_RECOVERY: 'נבהל, ולוקח לו זמן להירגע',
  STARTLES_RECOVERS_FAST: 'נבהל, וחוזר לעצמו מהר',
  CONFIDENT_INVESTIGATES: 'ניגש לבדוק מה זה',
};

export const CORRECTION_LABELS_HE: Readonly<Record<CorrectionSensitivity, string>> = {
  SHUTS_DOWN_APPEASES: 'נסגר, משתטח או מתרחק',
  LISTENS_AND_ADJUSTS: 'מקשיב ומתקן',
  IGNORES_PUSHES_THROUGH: 'מתעלם וממשיך',
};

export const OUTDOOR_FOCUS_LABELS_HE: Readonly<Record<OutdoorFocus, string>> = {
  HIGH_CHECK_IN: 'בודק אותי כל הזמן',
  DISTRACTED_BY_SCENTS: 'נמשך לריחות, אבל חוזר אליי',
  DISCONNECTED_TUNNEL_VISION: 'מנותק לגמרי ו"לא שומע"',
};

export const REACTIVITY_LABELS_HE: Readonly<Record<ReactivityType, string>> = {
  CALM_SOCIAL: 'רגוע וחברותי',
  FRUSTRATED_EXCITED_PULLER: 'מתלהב ומושך לכיוונם',
  REACTIVE_LUNGING_BARKING: 'נובח, מזנק ומתפרץ',
  SHY_AVOIDANT: 'ביישן ונמנע',
};

export const GOAL_LABELS_HE: Readonly<Record<TrainingGoal, string>> = {
  STOP_LEASH_PULLING: 'הליכה בלי משיכות',
  RELIABLE_OFF_LEASH_RECALL: 'קריאה אמינה גם בלי רצועה',
  IMPULSE_CONTROL_LEAVE_IT: 'שליטה עצמית ו"עזוב"',
  CALM_PLACE_AT_CAFE: 'רוגע ליד שולחן בבית קפה',
  CONFIDENCE_BUILDING: 'ביטחון עצמי',
  WORKING_OBEDIENCE: 'משמעת ברמת עבודה',
};

export type QuestionKind = 'single' | 'scale' | 'multi';

export interface AssessmentQuestion {
  key: AssessmentKey;
  kind: QuestionKind;
  titleHe: string;
  /** single / multi: value → label. */
  options?: Readonly<Record<string, string>>;
  /** Scale questions: what 1 and 5 mean. */
  scaleEndsHe?: readonly [string, string];
}

export type AssessmentStepId = 'Q_CONTEXT' | 'Q_DRIVES' | 'Q_NERVE' | 'Q_FIELD';

export interface AssessmentStep {
  id: AssessmentStepId;
  titleHe: string;
  introHe: string;
  questions: readonly AssessmentQuestion[];
}

export const ASSESSMENT_STEPS: readonly AssessmentStep[] = [
  {
    id: 'Q_CONTEXT',
    titleHe: 'רקע, גיל וסביבה',
    introHe: 'נתחיל במה שמסביב: הגיל, הבית והניסיון שלכם.',
    questions: [
      { key: 'ageStage', kind: 'single', titleHe: 'באיזה שלב בחיים הכלב נמצא?', options: AGE_STAGE_LABELS_HE },
      { key: 'livingEnv', kind: 'single', titleHe: 'איפה אתם גרים?', options: LIVING_ENV_LABELS_HE },
      { key: 'handlerExperience', kind: 'single', titleHe: 'כמה ניסיון יש לכם באילוף?', options: HANDLER_LABELS_HE },
    ],
  },
  {
    id: 'Q_DRIVES',
    titleHe: 'מוטיבציה ודחפים',
    introHe: 'מה מניע את הכלב – כדי שנדע במה לתגמל.',
    questions: [
      { key: 'foodDrive', kind: 'scale', titleHe: 'עד כמה הוא מוכן לעבוד בשביל אוכל, גם כשיש הסחות?', scaleEndsHe: ['כמעט לא', 'יעשה הכול'] },
      { key: 'playPreyDrive', kind: 'scale', titleHe: 'עד כמה הוא ננעל על כדור, צעצוע או משחק משיכה?', scaleEndsHe: ['לא מעניין אותו', 'מכור'] },
      { key: 'energyLevel', kind: 'scale', titleHe: 'כמה אנרגיה יש לו ביום רגיל?', scaleEndsHe: ['רגוע', 'לא נגמר'] },
    ],
  },
  {
    id: 'Q_NERVE',
    titleHe: 'חוסן ורגישות',
    introHe: 'איך הכלב מתמודד עם הפתעות ועם גבולות.',
    questions: [
      { key: 'startleRecovery', kind: 'single', titleHe: 'מה קורה כשיש רעש פתאומי או הפתעה?', options: STARTLE_LABELS_HE },
      { key: 'correctionSensitivity', kind: 'single', titleHe: 'איך הוא מגיב כשאומרים לו "לא" בטון תקיף?', options: CORRECTION_LABELS_HE },
    ],
  },
  {
    id: 'Q_FIELD',
    titleHe: 'קשב בשטח ומטרות',
    introHe: 'איך זה נראה בחוץ, ומה הכי חשוב לכם.',
    questions: [
      { key: 'outdoorFocus', kind: 'single', titleHe: 'ברחוב, כמה הוא איתכם?', options: OUTDOOR_FOCUS_LABELS_HE },
      { key: 'reactivityType', kind: 'single', titleHe: 'איך הוא מגיב לכלבים, לחתולים או לאורחים?', options: REACTIVITY_LABELS_HE },
      { key: 'primaryGoals', kind: 'multi', titleHe: 'מה הכי חשוב לכם עכשיו? (אפשר לבחור כמה)', options: GOAL_LABELS_HE },
    ],
  },
];
