// The persona engine's contracts: who talks to the owner, the variables copy can use, and every surface
// a persona writes. Emergency flows never use a persona – they always speak clinically.

export type PersonaId = 'ARS' | 'TEL_AVIV_HIPSTER' | 'DRILL_SERGEANT' | 'ANXIOUS_MOM' | 'CLINICAL_PRO';

export interface PersonaContextVars {
  dogName: string;
  streakDays: number;
  xpEarned: number;
  comboCount: number;
  rankTitle: string;
}

export interface PersonaCopySurface {
  homeGreetingMorning: string;
  homeGreetingEvening: string;
  vitalityHigh: string;
  vitalityLowWarning: string;
  sessionStartCta: string;
  /** Four escalating lines: ×1, ×2, ×3 and FEVER ×5. */
  repHitPraise: readonly [string, string, string, string];
  repStruggleCoach: string;
  sessionCompleteBtn: string;
  antiCheatSpeedWarning: string;
  streakRescueUrgentBanner: string;
  leagueOvertakenAlert: string;
  /** Tap 1, tap 2 and tap 3 of a loot box. */
  lootBoxTapPrompt: readonly [string, string, string];
}

/** Surfaces that hold a single line (formatCopy's keys). */
export type PersonaCopyKey = { [K in keyof PersonaCopySurface]: PersonaCopySurface[K] extends string ? K : never }[keyof PersonaCopySurface];

export interface PersonaDefinition {
  id: PersonaId;
  nameHe: string;
  taglineHe: string;
  copy: PersonaCopySurface;
}

/** What the device keeps: the chosen persona, and when each dog's honour contract was signed. */
export interface PersonaSettings {
  personaId: PersonaId;
  contracts: Record<string, string>;
}
