import type { MasterCommand, MasterCommandId } from '../types';
import { CONTROL_COMMANDS } from './controlCommands';
import { FOUNDATION_COMMANDS } from './foundationCommands';
import { IMPULSE_COMMANDS } from './impulseCommands';

/** The nine master commands, in teaching order. */
export const MASTER_COMMANDS: readonly MasterCommand[] = [...FOUNDATION_COMMANDS, ...CONTROL_COMMANDS, ...IMPULSE_COMMANDS].sort((a, b) => a.order - b.order);

/** The master command with this id, if any. */
export function findCommand(id: MasterCommandId): MasterCommand | undefined {
  return MASTER_COMMANDS.find((command) => command.id === id);
}
