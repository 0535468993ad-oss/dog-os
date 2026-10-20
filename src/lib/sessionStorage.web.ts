import AsyncStorage from '@react-native-async-storage/async-storage';

// Web: browsers have no hardware-backed key store (expo-secure-store is native-only), so the session is in
// localStorage, readable by any script on the origin. That is why the app loads no third-party scripts
// (see the cookie policy and AGENTS.md); keep it that way.
export const sessionStorage = AsyncStorage;
