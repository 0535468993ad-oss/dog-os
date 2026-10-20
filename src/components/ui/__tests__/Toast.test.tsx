import { act, render, screen } from '@testing-library/react-native';

import { showToast, ToastHost } from '../Toast';

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders nothing until a message is shown', async () => {
    await render(<ToastHost />);
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('shows the message as an alert, then hides it after 5 seconds', async () => {
    await render(<ToastHost />);

    await act(() => showToast('השמירה נכשלה'));
    expect(screen.getByRole('alert')).toHaveTextContent('השמירה נכשלה');

    await act(() => jest.advanceTimersByTime(4999));
    expect(screen.getByRole('alert')).toBeOnTheScreen();

    await act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it("doesn't let an earlier toast's timer hide a newer message", async () => {
    await render(<ToastHost />);

    await act(() => showToast('ראשון'));
    await act(() => jest.advanceTimersByTime(3000));
    await act(() => {
      jest.setSystemTime(Date.now() + 1); // distinct id for the second toast
      showToast('שני');
    });
    await act(() => jest.advanceTimersByTime(2500)); // the first toast's 5s mark has passed

    expect(screen.getByRole('alert')).toHaveTextContent('שני');
  });
});
