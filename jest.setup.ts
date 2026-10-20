// Runs before every test file (before modules are imported).

// Public config for src/config/env.ts. Fake values: tests never reach a real backend.
Object.assign(process.env, {
  EXPO_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
});

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Icon fonts load through the native asset registry, which doesn't exist under Jest. Every icon in the app
// is decorative (accessible={false}), so rendering nothing loses no accessible content.
jest.mock('@expo/vector-icons/Ionicons', () => ({ __esModule: true, default: () => null }));

// NetInfo's native module doesn't exist under Jest; its official mock reports a connected device.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));
