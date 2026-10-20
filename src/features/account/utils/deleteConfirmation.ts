/** The word the user types to confirm permanent account deletion. */
export const DELETE_PHRASE = 'מחיקה';

/** Whether the typed text confirms deletion (surrounding whitespace ignored). */
export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim() === DELETE_PHRASE;
}
