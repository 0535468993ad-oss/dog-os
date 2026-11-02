import { render, screen, userEvent } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('TextField adornments', () => {
  it('shows and hides a revealable password, announcing the next action', async () => {
    const user = userEvent.setup();
    await render(<TextField label="סיסמה" value="secret" onChangeText={jest.fn()} secureTextEntry revealable icon="lock-closed-outline" />);

    expect(screen.getByLabelText('סיסמה').props.secureTextEntry).toBe(true);
    await user.press(screen.getByRole('button', { name: 'הצגת הסיסמה' }));
    expect(screen.getByLabelText('סיסמה').props.secureTextEntry).toBe(false);
    await user.press(screen.getByRole('button', { name: 'הסתרת הסיסמה' }));
    expect(screen.getByLabelText('סיסמה').props.secureTextEntry).toBe(true);
  });

  it('has no reveal button unless asked, and stays hidden', async () => {
    await render(<TextField label="סיסמה" value="secret" onChangeText={jest.fn()} secureTextEntry />);
    expect(screen.queryByRole('button', { name: 'הצגת הסיסמה' })).toBeNull();
    expect(screen.getByLabelText('סיסמה').props.secureTextEntry).toBe(true);
  });

  it('leaves plain fields unmasked', async () => {
    await render(<TextField label="אימייל" value="a@b.co" onChangeText={jest.fn()} icon="mail-outline" />);
    expect(screen.getByLabelText('אימייל').props.secureTextEntry).toBe(false);
  });
});
