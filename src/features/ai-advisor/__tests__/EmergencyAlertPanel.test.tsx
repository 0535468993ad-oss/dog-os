import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { EmergencyAlertPanel } from '../components/EmergencyAlertPanel';
import { useEmergencyIntercept } from '../hooks/useEmergencyIntercept';
import { checkEmergency } from '../utils/safetyGuardrails';

const alertsFor = (message: string) => {
  const result = checkEmergency(message);
  if (result.level !== 'critical') throw new Error('expected critical');
  return result.alerts;
};

describe('EmergencyAlertPanel', () => {
  it('announces the emergency and shows the steps, contacts and a way to send anyway', async () => {
    const onSendAnyway = jest.fn();
    const onClose = jest.fn();
    await render(<EmergencyAlertPanel alerts={alertsFor('הכשת נחש')} onSendAnyway={onSendAnyway} onClose={onClose} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('הכשת נחש')).toBeTruthy();
    expect(screen.getByText(/בית דגן/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'זו לא בעיה דחופה – לשלוח ליועץ' }));
    expect(onSendAnyway).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'סגירה' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('useEmergencyIntercept', () => {
  it('holds an emergency message and hands it back on release', async () => {
    const { result } = await renderHook(() => useEmergencyIntercept());

    let stopped = false;
    await act(() => {
      stopped = result.current.intercept('הכלב אכל שוקולד');
    });
    expect(stopped).toBe(true);
    expect(result.current.alerts?.[0]?.titleHe).toBe('שוקולד');

    let released: string | null = null;
    await act(() => {
      released = result.current.release();
    });
    expect(released).toBe('הכלב אכל שוקולד');
    expect(result.current.alerts).toBeNull();
  });

  it('lets an everyday message through', async () => {
    const { result } = await renderHook(() => useEmergencyIntercept());
    let stopped = true;
    await act(() => {
      stopped = result.current.intercept('איך מלמדים לשבת?');
    });
    expect(stopped).toBe(false);
    expect(result.current.alerts).toBeNull();
  });
});
