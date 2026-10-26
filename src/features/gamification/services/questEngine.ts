import { addDays, parseIsoDate } from '@/utils/date';

import { QUEST_COMMAND_IDS, QUESTS } from '../data/quests';
import { RESCUE_COMMAND_ID, RESCUE_START_HOUR } from '../data/rules';
import type { GameState, QuestDefinition } from '../types';

// Time-of-day quests, the late-evening streak rescue and the weekly boss. Pure: the caller passes the
// local hour and the calendar day, so the rules are the same in tests and on every device.

/** The Sunday that starts the week of a day (the Israeli week), as YYYY-MM-DD. */
export function weekStartOf(day: string): string {
  return addDays(day, -parseIsoDate(day).getDay());
}

/** XP already earned on a day. */
export const xpOn = (state: GameState, day: string): number => state.xpByDay[day] ?? 0;

/** The quest running at this hour, or null. The rescue quest only shows on a day with no XP yet. */
export function questFor(hour: number, xpToday: number): QuestDefinition | null {
  const quest = QUESTS.find((entry) => hour >= entry.fromHour && hour < entry.toHour) ?? null;
  if (quest?.id === 'STREAK_RESCUE' && xpToday > 0) return null;
  return quest;
}

/** Whether a session of this command earns the +20% quest bonus right now (the rescue quest pays none). */
export function questBonusApplies(commandId: string, hour: number, xpToday: number): boolean {
  const quest = questFor(hour, xpToday);
  return quest !== null && quest.id !== 'STREAK_RESCUE' && quest.commandIds.includes(commandId);
}

/** Whether the 60-second rescue drill may be confirmed: evening, the touch drill, nothing earned today. */
export function rescueAvailable(state: GameState, commandId: string, today: string, hour: number): boolean {
  return commandId === RESCUE_COMMAND_ID && hour >= RESCUE_START_HOUR && hour < 24 && xpOn(state, today) === 0;
}

/** A small deterministic hash, so every device picks the same boss (and the same rivals) for a week. */
export function hashText(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) >>> 0;
  return value;
}

/** This week's boss command: its first confirmed session of the week pays double. */
export function weeklyBossCommand(weekId: string): string {
  return QUEST_COMMAND_IDS[hashText(weekId) % QUEST_COMMAND_IDS.length] ?? 'sit';
}

/** Whether a session of this command still earns the boss bonus this week. */
export function bossBonusApplies(state: GameState, commandId: string, today: string): boolean {
  const week = weekStartOf(today);
  return state.bossClearedWeek !== week && weeklyBossCommand(week) === commandId;
}
