import { I18nManager, Platform } from 'react-native';

import { colors } from '@/constants/theme';

/**
 * Hebrew-only app. Builds get RTL from the expo-localization plugin; this covers Expo Go and the first
 * launch (native direction changes apply after the next app start).
 */
export function configureRtl(): void {
  if (Platform.OS !== 'web' && !I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
}

/**
 * Web: document direction/language for screen readers and CSS logical properties, a clearly visible
 * keyboard focus indicator (WCAG 2.4.7) and reduced motion when the user asks for it.
 */
export function configureWebDocument(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
  const style = document.createElement('style');
  style.textContent = `:focus-visible { outline: 3px solid ${colors.focus} !important; outline-offset: 2px; border-radius: 6px; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`;
  document.head.appendChild(style);
}
