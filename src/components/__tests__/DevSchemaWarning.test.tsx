import { render, screen, userEvent } from '@testing-library/react-native';

import { DevSchemaWarning } from '../DevSchemaWarning';

describe('DevSchemaWarning', () => {
  it('announces that migrations are missing', async () => {
    await render(<DevSchemaWarning reason="schema_missing" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/חסרות טבלאות במסד הנתונים/);
  });

  it('says when the consent screen was skipped by the development switch', async () => {
    await render(<DevSchemaWarning reason="dev_flag" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/מסך ההסכמות מדולג/);
    expect(screen.getByRole('alert')).toHaveTextContent(/לא נרשמה הסכמה/);
  });

  it('can be dismissed with an accessible button', async () => {
    const user = userEvent.setup();
    await render(<DevSchemaWarning reason="schema_missing" />);

    await user.press(screen.getByRole('button', { name: 'הסתרת אזהרת מצב הפיתוח' }));
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });
});
