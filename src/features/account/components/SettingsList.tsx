import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { Divider } from '@/components/ui';

import { SETTINGS_DIVIDER_INSET } from './SettingsRow';

/** Stacks settings rows with hairline dividers between them, inset past the icon squircle. */
export function SettingsList({ children }: { children: ReactNode }) {
  // Conditional rows render `null`; only real elements get a divider.
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <Divider inset={SETTINGS_DIVIDER_INSET} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
