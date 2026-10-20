import fs from 'node:fs';
import path from 'node:path';

import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { RouteErrorBoundary } from '../RouteErrorBoundary';

// expo-router/testing-library replaces Reanimated with its bundled mock, which (Reanimated 4.5 / SDK 57)
// doesn't implement useReducedMotion – used by the motion helpers in every pressable.
jest.mock('react-native-reanimated/mock', () => ({
  ...jest.requireActual<Record<string, unknown>>('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

function Broken(): never {
  throw new Error('render failed');
}

describe('route error boundaries (integration)', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it('contains a crash to the failing route', async () => {
    await renderRouter(
      {
        index: () => <Text>דף הבית</Text>,
        broken: { default: Broken, ErrorBoundary: RouteErrorBoundary },
      },
      { initialUrl: '/broken' },
    );

    expect(await screen.findByRole('header', { name: 'משהו השתבש' })).toBeOnTheScreen();

    // Imperative navigation instead of testRouter.navigate: on SDK 57 its pathname assertion relies on the
    // synchronous render of @testing-library/react-native 13, and this project uses the async v14.
    await act(() => router.navigate('/'));
    expect(await screen.findByText('דף הבית')).toBeOnTheScreen();
  });
});

// Guard: every route file must export the boundary, so a new screen can't ship without one.
describe('every route exports ErrorBoundary', () => {
  const appDir = path.join(__dirname, '..', '..', 'app');
  const EXEMPT = new Set(['+not-found.tsx']); // static content, nothing that can fail

  const routeFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') && !EXEMPT.has(entry.name)) routeFiles.push(path.relative(appDir, full));
    }
  };
  walk(appDir);

  it('finds the route files', () => {
    expect(routeFiles.length).toBeGreaterThan(20);
  });

  it.each(routeFiles)('%s', (file) => {
    const source = fs.readFileSync(path.join(appDir, file), 'utf8');
    expect(source).toMatch(/export \{ RouteErrorBoundary as ErrorBoundary \} from '@\/components\/RouteErrorBoundary';/);
  });
});
