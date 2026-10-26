// The (app) layout's first-run routing, rendered through Expo Router: where an owner lands on launch,
// and where finishing or skipping onboarding takes them. Secondary screens (the report, the journal)
// must never be the landing fallback.
import { act, screen } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import AppLayout from '@/app/(app)/_layout';

type Route = 'LOADING' | 'ONBOARDING' | 'APP';
const mockStore: { value: Route; listeners: Set<() => void> } = { value: 'APP', listeners: new Set() };
// The route lives in a tiny store, so changing it re-renders the layout like a profile update does.
jest.mock('@/features/onboarding/hooks/useOnboarding', () => {
  const { useSyncExternalStore } = jest.requireActual<typeof import('react')>('react');
  return {
    useOnboardingRoute: () =>
      useSyncExternalStore(
        (listener: () => void) => {
          mockStore.listeners.add(listener);
          return () => mockStore.listeners.delete(listener);
        },
        () => mockStore.value,
      ),
  };
});

const setRoute = (value: Route) => {
  mockStore.value = value;
  mockStore.listeners.forEach((listener) => listener());
};

/** A stand-in screen that just names itself. */
const page = (name: string) =>
  function Page() {
    return <Text>{name}</Text>;
  };

const ROUTES = {
  '(app)/_layout': AppLayout,
  '(app)/(tabs)/_layout': function TabsLayout() {
    return (
      <>
        <Text>TAB_BAR</Text>
        <Slot />
      </>
    );
  },
  '(app)/(tabs)/index': page('HOME'),
  '(app)/(tabs)/training': page('TRAINING'),
  '(app)/onboarding': page('ONBOARDING'),
  '(app)/assessment': page('ASSESSMENT'),
  '(app)/report': page('REPORT'),
  '(app)/journal': page('JOURNAL'),
  '(app)/advisor-context': page('ADVISOR_CONTEXT'),
  '(app)/dogs/edit': page('DOG_EDIT'),
  '(app)/health/vaccination': page('VACCINATION'),
  '(app)/health/note': page('NOTE'),
  '(app)/health/food': page('FOOD'),
};

describe('(app) layout routing', () => {
  it('opens the tabs for an onboarded owner', async () => {
    setRoute('APP');
    await renderRouter(ROUTES, { initialUrl: '/' });
    expect(screen.getByText('HOME')).toBeOnTheScreen();
    expect(screen.getByText('TAB_BAR')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
  });

  it('sends an owner who has not onboarded to the wizard, never to a secondary screen', async () => {
    setRoute('ONBOARDING');
    await renderRouter(ROUTES, { initialUrl: '/' });
    expect(screen.getByText('ONBOARDING')).toBeOnTheScreen();
    expect(screen.queryByText('REPORT')).toBeNull();
    expect(screen).toHavePathname('/onboarding');
  });

  it('lands on the tabs once onboarding is finished or skipped', async () => {
    setRoute('ONBOARDING');
    await renderRouter(ROUTES, { initialUrl: '/' });
    await act(async () => setRoute('APP'));
    expect(await screen.findByText('HOME')).toBeOnTheScreen();
    expect(screen.getByText('TAB_BAR')).toBeOnTheScreen();
    expect(screen.queryByText('REPORT')).toBeNull();
  });

  it('lands on the tabs when the profile finishes loading', async () => {
    setRoute('LOADING');
    await renderRouter(ROUTES, { initialUrl: '/' });
    await act(async () => setRoute('APP'));
    expect(await screen.findByText('HOME')).toBeOnTheScreen();
    expect(screen.queryByText('REPORT')).toBeNull();
  });

  it('opens secondary screens normally from the app', async () => {
    setRoute('APP');
    await renderRouter(ROUTES, { initialUrl: '/report' });
    expect(screen.getByText('REPORT')).toBeOnTheScreen();
  });
});
