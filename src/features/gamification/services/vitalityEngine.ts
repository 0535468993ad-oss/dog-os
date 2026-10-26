import { addDays } from '@/utils/date';

import { QUEST_COMMAND_IDS } from '../data/quests';
import type { GameState, Vitality, VitalityMeter } from '../types';
import { activeDays } from '../utils/progression';

// The dog's "digital twin": four game meters computed from the training log. They describe how much and
// how recently the team has trained – not the dog's health, and the card says so.

const DRIVE_COMMANDS: readonly string[] = ['recall', 'drop-it', 'touch', 'heel'];
const CALM_COMMANDS: readonly string[] = ['stay', 'place', 'leave-it', 'down', 'sit'];
/** Mental sharpness loses this many points per 24 hours without a session. */
export const SHARPNESS_DECAY_PER_DAY = 15;
const DAY_MS = 86_400_000;

const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)));

/** Sessions of these commands on or after a day. */
const sessionsSince = (state: GameState, commandIds: readonly string[], fromDay: string) =>
  state.sessions.filter((session) => commandIds.includes(session.commandId) && session.day >= fromDay).length;

/** The command practised least recently (never-practised first, in teaching order). */
function stalestCommand(state: GameState): string {
  const lastAt = (id: string) => Math.max(0, ...state.sessions.filter((session) => session.commandId === id).map((session) => session.at));
  return [...QUEST_COMMAND_IDS].sort((a, b) => lastAt(a) - lastAt(b))[0] ?? 'sit';
}

/** The four meters, their average, the weakest one and the command that would lift it. */
export function computeVitality(state: GameState, now: number, today: string): Vitality {
  const lastSessionAt = Math.max(0, ...state.sessions.map((session) => session.at));
  const meters: Record<VitalityMeter, number> = {
    sharpness: lastSessionAt === 0 ? 0 : clamp(100 - (SHARPNESS_DECAY_PER_DAY * Math.max(0, now - lastSessionAt)) / DAY_MS),
    drive: clamp((sessionsSince(state, DRIVE_COMMANDS, addDays(today, -2)) / 3) * 100),
    calm: clamp((sessionsSince(state, CALM_COMMANDS, addDays(today, -6)) / 4) * 100),
    bond: clamp((activeDays(state).filter((day) => day >= addDays(today, -6) && day <= today).length / 5) * 100),
  };
  const order: VitalityMeter[] = ['sharpness', 'drive', 'calm', 'bond'];
  const weakest = order.reduce((low, meter) => (meters[meter] < meters[low] ? meter : low), 'sharpness');
  const suggested: Record<VitalityMeter, string> = { sharpness: stalestCommand(state), drive: 'recall', calm: 'place', bond: 'touch' };
  return {
    meters,
    overall: clamp(order.reduce((sum, meter) => sum + meters[meter], 0) / order.length),
    weakest,
    suggestedCommandId: suggested[weakest],
  };
}
