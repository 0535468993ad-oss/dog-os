import type { BoasGrade, CoatType, ConditionSeverity, DriveAndTemperamentRadar, ExperienceLevel, LivingSuitability, RiskLevel, SizeCategory } from '../types';

// Hebrew labels for every enum the breed screens show.

export type DriveKey = keyof Pick<DriveAndTemperamentRadar, 'preyDrive' | 'defenseDrive' | 'packDriveSocial' | 'playDrive' | 'handlerFocusBiddability' | 'environmentalSensitivity'>;

export const DRIVE_LABELS_HE: Readonly<Record<DriveKey, string>> = {
  preyDrive: 'דחף טרף',
  defenseDrive: 'דחף הגנה',
  packDriveSocial: 'חברותיות',
  playDrive: 'דחף משחק',
  handlerFocusBiddability: 'מיקוד במדריך',
  environmentalSensitivity: 'רגישות סביבתית',
};

export const DRIVE_KEYS = Object.keys(DRIVE_LABELS_HE) as DriveKey[];

export const SIZE_LABELS_HE: Readonly<Record<SizeCategory, string>> = { TOY: 'צעצוע', SMALL: 'קטן', MEDIUM: 'בינוני', LARGE: 'גדול', GIANT: 'ענק' };

export const COAT_LABELS_HE: Readonly<Record<CoatType, string>> = {
  SHORT_SINGLE: 'פרווה קצרה',
  DOUBLE_COAT: 'פרווה כפולה',
  WIRE: 'פרווה קשה',
  CURLY_NON_SHEDDING: 'פרווה מתולתלת שכמעט לא נושרת',
  LONG_SILKY: 'פרווה ארוכה ומשיית',
};

export const RISK_LABELS_HE: Readonly<Record<RiskLevel | 'CRITICAL', string>> = { LOW: 'נמוך', MODERATE: 'בינוני', HIGH: 'גבוה', CRITICAL: 'קריטי' };

export const SEVERITY_LABELS_HE: Readonly<Record<ConditionSeverity, string>> = { CHRONIC: 'כרונית', PROGRESSIVE: 'מתקדמת', LIFE_THREATENING: 'מסכנת חיים' };

export const BOAS_LABELS_HE: Readonly<Record<BoasGrade, string>> = { NONE: 'אין', MILD: 'קלה', MODERATE: 'בינונית', SEVERE: 'חמורה' };

export const LIVING_LABELS_HE: Readonly<Record<LivingSuitability, string>> = { APARTMENT_FRIENDLY: 'מתאים לדירה', NEEDS_YARD: 'צריך חצר ופעילות רבה' };

export const EXPERIENCE_LABELS_HE: Readonly<Record<ExperienceLevel, string>> = { NOVICE_FRIENDLY: 'מתאים למתחילים', EXPERIENCED_ONLY: 'לבעלים מנוסים' };
