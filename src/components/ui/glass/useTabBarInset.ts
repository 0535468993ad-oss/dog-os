import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext } from 'react';

/**
 * Height of the floating tab bar the screen sits under (safe area included), or 0 outside the tabs.
 * Imported from expo-router, which vendors its own bottom-tabs: the @react-navigation copy is a different context.
 */
export function useTabBarInset(): number {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
