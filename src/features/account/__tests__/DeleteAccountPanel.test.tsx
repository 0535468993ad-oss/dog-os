// Account deletion is irreversible: the confirm button stays disabled until the phrase is typed exactly.
import { render, screen, userEvent } from '@testing-library/react-native';

import { DeleteAccountPanel } from '../components/DeleteAccountPanel';
import { DELETE_PHRASE } from '../utils/deleteConfirmation';

describe('DeleteAccountPanel', () => {
  it('opens, requires the typed phrase, then confirms', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    await render(<DeleteAccountPanel deleting={false} onConfirm={onConfirm} />);

    await user.press(screen.getByRole('button', { name: 'מחיקת החשבון' }));
    const confirm = screen.getByRole('button', { name: 'מחיקת החשבון' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(`הקלידו ״${DELETE_PHRASE}״ לאישור`), DELETE_PHRASE);
    expect(confirm).toBeEnabled();

    await user.press(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels back to the collapsed button', async () => {
    const user = userEvent.setup();
    await render(<DeleteAccountPanel deleting={false} onConfirm={jest.fn()} />);

    await user.press(screen.getByRole('button', { name: 'מחיקת החשבון' }));
    await user.press(screen.getByRole('button', { name: 'ביטול' }));

    expect(screen.queryByText('מחיקת חשבון לצמיתות')).toBeNull();
  });
});
