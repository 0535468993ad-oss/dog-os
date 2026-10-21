import { checkEmergency, EMERGENCY_CONTACTS_HE } from '../utils/safetyGuardrails';

const alerts = (message: string) => {
  const result = checkEmergency(message);
  return result.level === 'critical' ? result.alerts : [];
};

describe('checkEmergency', () => {
  it.each([
    ['הכלב אכל שוקולד', 'שוקולד'],
    ['הוא בלע כמה ענבים מהשולחן', 'ענבים'],
    ['אכל צימוקים', 'צימוקים'],
    ['אכל סלט עם בצל', 'בצל'],
    ['נתתי לו בטעות את השום', 'שום'],
    ['לעס מסטיק עם קסיליטול', 'קסיליטול (ממתיק)'],
    ['my dog ate chocolate', 'שוקולד'],
  ])('flags the toxin in "%s"', (message, title) => {
    expect(checkEmergency(message).level).toBe('critical');
    expect(alerts(message).map((alert) => alert.titleHe)).toContain(title);
  });

  it.each([
    ['הכשת נחש ברגל', 'SNAKEBITE'],
    ['נראה לי שצפע הכיש אותו', 'SNAKEBITE'],
    ['he was bitten by a snake', 'SNAKEBITE'],
    ['חושש שיש לו היפוך קיבה', 'BLOAT'],
    ['יש לו בטן נפוחה והוא מנסה להקיא', 'BLOAT'],
    ['could this be GDV?', 'BLOAT'],
  ])('flags "%s" as %s', (message, kind) => {
    expect(alerts(message).map((alert) => alert.kind)).toContain(kind);
  });

  it('puts bloat first and reports every emergency in the message', () => {
    expect(alerts('אכל שוקולד ועכשיו יש לו בטן נפוחה').map((alert) => alert.kind)).toEqual(['BLOAT', 'TOXIN']);
  });

  it.each([
    'בעצם הוא רגוע היום',
    'משום מה הוא לא אוכל',
    'מתי הוא יהיה מוכן לטיול?',
    'הוא שתה המון מים',
    'לנחש מה הוא רוצה זה קשה',
    'התחלנו הכשרה לכלב שירות',
    'הוא הוכשר כבר כגור',
    'אוכל ללא סוכר מתאים לו?',
    'השומן במזון גבוה מדי',
    'החניכיים שלו ורודות, the gums look fine',
    'איך מלמדים לשבת?',
    '',
  ])('leaves an everyday message clear: "%s"', (message) => {
    expect(checkEmergency(message)).toEqual({ level: 'clear' });
  });

  it('gives fixed actions and names Beit Dagan as a 24/7 option', () => {
    const [alert] = alerts('הכלב אכל ענבים');
    expect(alert?.actionsHe.length).toBeGreaterThan(0);
    expect(alert?.avoidHe.join(' ')).toContain('הקאה');
    expect(EMERGENCY_CONTACTS_HE.join(' ')).toMatch(/בית דגן/);
    expect(EMERGENCY_CONTACTS_HE.join(' ')).toMatch(/24\/7/);
  });
});
