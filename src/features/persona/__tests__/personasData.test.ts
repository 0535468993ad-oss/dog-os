// Persona identity: the names and glyphs the switcher shows.
import { PERSONA_ORDER, PERSONAS } from '../data/personasData';

describe('persona identity', () => {
  it('names the strict persona as a discipline mentor with a shield', () => {
    expect(PERSONAS.DRILL_SERGEANT.nameHe).toBe('מנטור משמעת קפדן');
    expect(PERSONAS.DRILL_SERGEANT.icon).toBe('shield-outline');
  });

  it('gives every persona its own glyph instead of a generic chat bubble', () => {
    const icons = PERSONA_ORDER.map((id) => PERSONAS[id].icon);
    expect(new Set(icons).size).toBe(PERSONA_ORDER.length);
    expect(icons).not.toContain('chatbubbles-outline');
  });

  it('keeps persona names in Hebrew', () => {
    expect(PERSONA_ORDER.filter((id) => /[A-Za-z]/.test(PERSONAS[id].nameHe))).toEqual([]);
  });
});
