import type { MasterCommandId, TrainingCommand } from '../types';
import { ENGAGEMENT_COMMANDS } from './commands/engagementCommands';
import { FOUNDATION_COMMANDS } from './commands/foundationCommands';
import { SAFETY_COMMANDS } from './commands/safetyCommands';

/** The nine master commands, in teaching order (content split across data/commands/). */
export const TRAINING_COMMANDS: readonly TrainingCommand[] = [...FOUNDATION_COMMANDS, ...SAFETY_COMMANDS, ...ENGAGEMENT_COMMANDS].sort((a, b) => a.order - b.order);

/** The command with this id, if any. */
export function findCommand(id: MasterCommandId): TrainingCommand | undefined {
  return TRAINING_COMMANDS.find((command) => command.id === id);
}
