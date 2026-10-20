// Offline-first rendering: a failed refresh keeps cached data on screen with a notice; only an empty
// cache gets the full-page error. Includes the React Query behaviour this relies on.
import { onlineManager, QueryClient, QueryObserver } from '@tanstack/react-query';
import { act, render, screen, userEvent } from '@testing-library/react-native';

import { StaleDataNotice } from '@/components/ui';
import { SupportRequestList } from '@/features/support/components/SupportRequestList';
import type { SupportRequestRow } from '@/lib/database.types';

import { cacheState } from '../queryView';

describe('cacheState', () => {
  it.each([
    [null, false, 'fresh'],
    [null, true, 'fresh'],
    [new Error('offline'), true, 'stale'],
    [new Error('offline'), false, 'failed'],
  ] as const)('error %p, cached %p → %s', (error, hasData, expected) => {
    expect(cacheState(error, hasData)).toBe(expected);
  });
});

describe('React Query keeps cached data when a refetch fails', () => {
  it('sets error but keeps data (the premise of the stale state)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, networkMode: 'always' } } });
    let fail = false;
    const observer = new QueryObserver(client, { queryKey: ['k'], queryFn: async () => (fail ? Promise.reject(new TypeError('Network request failed')) : ['row']) });
    const unsubscribe = observer.subscribe(() => undefined);
    await act(() => observer.refetch());
    fail = true;
    await act(() => observer.refetch());

    const result = observer.getCurrentResult();
    expect(result.data).toEqual(['row']);
    expect(result.error).toBeInstanceOf(TypeError);
    expect(cacheState(result.error, result.data !== undefined)).toBe('stale');
    unsubscribe();
    client.clear();
  });
});

describe('StaleDataNotice', () => {
  afterEach(() => act(() => onlineManager.setOnline(true)));

  it('renders nothing when the data is fresh', async () => {
    await render(<StaleDataNotice visible={false} onRetry={jest.fn()} />);
    expect(screen.queryByText(/מוצג המידע האחרון/)).toBeNull();
  });

  it('explains a failed refresh and retries', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    await render(<StaleDataNotice visible onRetry={onRetry} />);

    expect(screen.getByLabelText('לא הצלחנו לרענן את המידע. מוצג המידע האחרון שנשמר.')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: 'ניסיון חוזר לרענן את המידע' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('says the device is offline when it is', async () => {
    await render(<StaleDataNotice visible onRetry={jest.fn()} />);
    await act(() => onlineManager.setOnline(false));
    expect(screen.getByLabelText('אין חיבור לאינטרנט. מוצג המידע האחרון שנשמר.')).toBeTruthy();
  });
});

describe('a screen with cached data and a failed refresh', () => {
  const request: SupportRequestRow = {
    id: 'r1',
    user_id: 'u1',
    request_type: 'general',
    subject: 'שאלה על החשבון',
    message: 'פרטי הפנייה',
    contact_email: null,
    status: 'open',
    created_at: '2026-10-20T10:00:00.000Z',
    updated_at: '2026-10-20T10:00:00.000Z',
  };
  const offline = new TypeError('Network request failed');

  it('keeps the cached list and shows the notice instead of the error page', async () => {
    await render(<SupportRequestList requests={[request]} isLoading={false} error={offline} onRetry={jest.fn()} />);
    expect(screen.getByText('שאלה על החשבון')).toBeTruthy();
    expect(screen.getByText(/מוצג המידע האחרון שנשמר/)).toBeTruthy();
    expect(screen.queryByText(/אין חיבור לשרת/)).toBeNull(); // the full-page error's message
  });

  it('shows the full-page error only when nothing is cached', async () => {
    await render(<SupportRequestList requests={undefined} isLoading={false} error={offline} onRetry={jest.fn()} />);
    expect(screen.queryByText(/מוצג המידע האחרון שנשמר/)).toBeNull();
    expect(screen.getByText(/אין חיבור לשרת/)).toBeTruthy();
  });
});
