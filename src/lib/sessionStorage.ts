import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { reportError } from '@/utils/errors';

import { createChunkedSecureStorage } from './chunkedSecureStorage';

// Native: the auth session lives only in the hardware-backed keystore. AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
// lets token refresh run in the background after the first unlock, and keeps the entry out of backups and
// device-to-device transfers. Sessions saved unencrypted by earlier versions are migrated and deleted.
const options: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export const sessionStorage = createChunkedSecureStorage(
  {
    getItemAsync: (key) => SecureStore.getItemAsync(key, options),
    setItemAsync: (key, value) => SecureStore.setItemAsync(key, value, options),
    deleteItemAsync: (key) => SecureStore.deleteItemAsync(key, options),
  },
  { legacy: AsyncStorage, onError: (error, operation) => reportError(error, `session-storage:${operation}`) },
);
