import type { QuestDefinition } from '../types';

// Time-of-day quests and the weekly boss. Command ids are the training curriculum's, as plain strings so
// gamification stays below training in the layer order.

/** The nine master commands, in teaching order. */
export const QUEST_COMMAND_IDS: readonly string[] = ['sit', 'down', 'stay', 'recall', 'place', 'leave-it', 'drop-it', 'heel', 'touch'];

/** Quests by local hour, first match wins. STREAK_RESCUE also needs a day with no XP yet. */
export const QUESTS: readonly QuestDefinition[] = [
  { id: 'MORNING_PATROL', fromHour: 6, toHour: 12, titleHe: 'פטרול בוקר: משמעת ורגלי', commandIds: ['sit', 'heel'], bonusHe: '+20% XP' },
  { id: 'IMPULSE_CONTROL', fromHour: 12, toHour: 20, titleHe: 'שליטה בדחפים: למקום והישאר', commandIds: ['place', 'stay'], bonusHe: '+20% XP' },
  { id: 'STREAK_RESCUE', fromHour: 20, toHour: 24, titleHe: '🚨 משימת חילוץ רצף ב־60 שניות', commandIds: ['touch'], bonusHe: 'מציל את הרצף' },
];
