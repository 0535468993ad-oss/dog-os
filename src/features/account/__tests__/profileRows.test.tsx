// Profile polish: tinted icon squircles, inset dividers between rows, and the dog card's ring and action row.
import { render, screen, userEvent, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, tints } from '@/constants/theme';
import { makeDog } from '@/test/fixtures';

import { DogProfileCard } from '../components/DogProfileCard';
import { SettingsList } from '../components/SettingsList';
import { SETTINGS_DIVIDER_INSET, SettingsRow } from '../components/SettingsRow';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/dogs/hooks', () => ({
  useDogPhotoUrl: () => ({ data: undefined }),
  useSetActiveDog: () => ({ mutate: jest.fn() }),
}));

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe('SettingsRow', () => {
  it('puts the icon in a 34pt squircle tinted with the row tone', async () => {
    await render(<SettingsRow icon="leaf-outline" tone="health" label="בטיחות מזון ותזונה" onPress={jest.fn()} />);
    expect(flat(screen.getByTestId('settings-row-icon'))).toMatchObject({ width: 34, height: 34, borderRadius: 9, backgroundColor: tints.health });
  });

  it('defaults to the amber tone and reports presses', async () => {
    const onPress = jest.fn();
    await render(<SettingsRow icon="key-outline" label="שינוי סיסמה" onPress={onPress} />);
    expect(flat(screen.getByTestId('settings-row-icon')).backgroundColor).toBe(tints.primary);

    await userEvent.press(screen.getByRole('button', { name: 'שינוי סיסמה' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SettingsList', () => {
  it('draws one inset divider between each pair of rows and skips rows that render nothing', async () => {
    await render(
      <SettingsList>
        <SettingsRow icon="key-outline" label="א" onPress={jest.fn()} />
        {null}
        <SettingsRow icon="mail-outline" label="ב" onPress={jest.fn()} />
        <SettingsRow icon="book-outline" label="ג" onPress={jest.fn()} />
      </SettingsList>,
    );

    const dividers = screen.getAllByTestId('divider');
    expect(dividers).toHaveLength(2);
    for (const divider of dividers) expect(flat(divider).marginStart).toBe(SETTINGS_DIVIDER_INSET);
  });

  it('draws no divider for a single row', async () => {
    await render(
      <SettingsList>
        <SettingsRow icon="key-outline" label="א" onPress={jest.fn()} />
      </SettingsList>,
    );
    expect(screen.queryByTestId('divider')).toBeNull();
  });
});

describe('DogProfileCard', () => {
  it('rings the avatar in amber and keeps breed, activate and edit in one action row', async () => {
    await render(<DogProfileCard dog={makeDog({ name: 'רקסי' })} isActive={false} onActivate={jest.fn()} onEdit={jest.fn()} />);

    expect(flat(screen.getByTestId('dog-avatar-ring'))).toMatchObject({ borderWidth: 2, borderColor: colors.primary });
    const actions = within(screen.getByTestId('dog-card-actions'));
    expect(actions.getByRole('link', { name: /^פרופיל ומודיעין גזע:/ })).toBeOnTheScreen();
    expect(actions.getByRole('button', { name: 'הפיכת רקסי לכלב הפעיל' })).toBeOnTheScreen();
    expect(actions.getByRole('button', { name: 'עריכת הפרופיל של רקסי' })).toBeOnTheScreen();
  });

  it('hides "make active" for the active dog and still calls edit', async () => {
    const onEdit = jest.fn();
    await render(<DogProfileCard dog={makeDog({ name: 'רקסי' })} isActive onActivate={jest.fn()} onEdit={onEdit} />);

    expect(screen.queryByRole('button', { name: 'הפיכת רקסי לכלב הפעיל' })).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'עריכת הפרופיל של רקסי' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
