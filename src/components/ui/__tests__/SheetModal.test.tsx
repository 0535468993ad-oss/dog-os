import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { AppText } from '../AppText';
import { SheetModal } from '../sheet/SheetModal';

function renderSheet(open: boolean, onClose = jest.fn()) {
  return render(
    <SheetModal open={open} title="בחירת כלב" onClose={onClose}>
      <AppText>תוכן החלונית</AppText>
    </SheetModal>,
  );
}

describe('SheetModal', () => {
  it('renders nothing while closed', async () => {
    await renderSheet(false);
    expect(screen.queryByRole('header', { name: 'בחירת כלב' })).toBeNull();
    expect(screen.queryByText('תוכן החלונית')).toBeNull();
  });

  it('shows its title and content when open', async () => {
    await renderSheet(true);
    expect(screen.getByRole('header', { name: 'בחירת כלב' })).toBeOnTheScreen();
    expect(screen.getByText('תוכן החלונית')).toBeOnTheScreen();
  });

  it('closes from the close button and from the scrim', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    await renderSheet(true, onClose);

    await user.press(screen.getByRole('button', { name: 'סגירה' }));
    // The scrim's opacity follows the sheet's spring, which the Jest mock doesn't run, so it reads as hidden here.
    await fireEvent.press(screen.getByRole('button', { name: 'סגירת החלונית', includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('hides its content from assistive tech as soon as it starts closing', async () => {
    const { rerender } = await renderSheet(true);
    await rerender(
      <SheetModal open={false} title="בחירת כלב" onClose={jest.fn()}>
        <AppText>תוכן החלונית</AppText>
      </SheetModal>,
    );
    expect(screen.queryByText('תוכן החלונית')).toBeNull();
  });
});
