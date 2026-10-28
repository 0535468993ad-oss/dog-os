import { Tabs } from 'expo-router/js-tabs';

import { TAB_SCREEN_OPTIONS, TABS, tabOptions } from '@/navigation/tabBarOptions';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={tabOptions(tab)} />
      ))}
    </Tabs>
  );
}
