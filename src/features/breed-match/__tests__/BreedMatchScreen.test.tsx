// The breed-match hub end to end: the six-step quiz to ranked results and the dossier, the Volhard
// gate, and the adoption tab.
import { render, screen, userEvent } from '@testing-library/react-native';

import { BreedMatchScreen } from '../BreedMatchScreen';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

type User = ReturnType<typeof userEvent.setup>;

/** Answers all six steps for a first-time owner in an apartment with 45 minutes a day. */
async function answerQuiz(user: User) {
  const pick = (name: string) => user.press(screen.getByRole('radio', { name }));
  const next = (name = 'הבא') => user.press(screen.getByRole('button', { name }));
  await pick('דירה עם מעלית');
  await pick('עיר צפופה');
  await next();
  await pick('כ־4 שעות');
  await pick('כ־45 דקות');
  await next();
  await pick('כלב ראשון');
  await next();
  await pick('שיער על הספה לא מפריע');
  await next();
  await pick('כ־1,000 ₪');
  await next();
  await pick('כלב משפחה');
  await next('הצגת ההתאמות');
}

describe('BreedMatchScreen', () => {
  it('ranks breeds for a novice apartment and red-flags the Malinois', async () => {
    const user = userEvent.setup();
    await render(<BreedMatchScreen />);
    await answerQuiz(user);

    expect(screen.getByRole('button', { name: /^רועה בלגי מלינואה: \d+% התאמה, אי־התאמה בסיכון גבוה$/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^לברדור רטריבר: \d+% התאמה, התאמה מצוינת$/ })).toBeOnTheScreen();
  });

  it('opens the dossier with clearances and the monthly cost', async () => {
    const user = userEvent.setup();
    await render(<BreedMatchScreen />);
    await answerQuiz(user);
    await user.press(screen.getByRole('button', { name: /^רועה גרמני: / }));

    expect(screen.getByText('בדיקות חובה להורים – לפני שמשלמים')).toBeOnTheScreen();
    expect(screen.getByLabelText('סך הכול בחודש: 740 ₪')).toBeOnTheScreen();
    expect(screen.getByLabelText('אנרגיה: 4 מתוך 5')).toBeOnTheScreen();
  });

  it('keeps the next button disabled until the step is answered', async () => {
    await render(<BreedMatchScreen />);
    expect(screen.getByRole('button', { name: 'הבא' })).toBeDisabled();
  });

  it('locks the Volhard test behind the four pre-conditions', async () => {
    const user = userEvent.setup();
    await render(<BreedMatchScreen />);
    await user.press(screen.getByRole('tab', { name: 'מבחן גור' }));

    expect(screen.getByRole('button', { name: 'התחלת המבחן' })).toBeDisabled();
    for (const name of ['גיל מדויק: יום 49 (7 שבועות)', 'בודק ניטרלי', 'חדר שקט ולא מוכר', 'גור במצב גופני מאוזן']) {
      await user.press(screen.getByRole('checkbox', { name }));
    }
    await user.press(screen.getByRole('button', { name: 'התחלת המבחן' }));

    expect(screen.getByText('משיכה חברתית וביטחון בבני אדם')).toBeOnTheScreen();
    await user.press(screen.getByRole('radio', { name: '3: ניגש מיד, זנב למעלה' }));
    expect(screen.getByText('מעקב ונכונות לשיתוף פעולה')).toBeOnTheScreen();
  });

  it('shows the adoption protocol and the ethical directory', async () => {
    const user = userEvent.setup();
    await render(<BreedMatchScreen />);
    await user.press(screen.getByRole('tab', { name: 'כלב בוגר' }));

    expect(screen.getByText('3 ימים – הלם חושי')).toBeOnTheScreen();
    expect(screen.getByText('החוג הישראלי לכלבי רועים')).toBeOnTheScreen();
    expect(screen.getByText('כלביית הבשן')).toBeOnTheScreen();
    expect(screen.getByText(/לפני החלטה חסרים שלבי חובה/)).toBeOnTheScreen();
  });
});
