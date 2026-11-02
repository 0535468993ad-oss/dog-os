// Interaction states added by the design-system overhaul: focus boundary, non-color selection cues,
// tonal button and segment selection.
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

import { Button } from '../Button';
import { ChipGroup } from '../ChipGroup';
import { SegmentedControl } from '../SegmentedControl';
import { Skeleton, SkeletonBlock } from '../Skeleton';
import { TextField } from '../TextField';

// The global mock renders icons as nothing; here they render a View tagged with the icon name, so the
// non-color selection cue (the check mark) is observable.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => createElement(View, { testID: `icon-${name}` }) };
});

function flat(element: { props: { style?: unknown } }) {
  return StyleSheet.flatten(element.props.style as never) as { borderColor?: string; backgroundColor?: string; borderWidth?: number };
}

describe('TextField focus state', () => {
  it('shows the focus boundary while focused and forwards focus events', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(<TextField label="שם" onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByLabelText('שם');
    // The boundary is drawn by the row around the input, which also holds any icon or reveal button.
    const boundary = () => flat(screen.getByTestId('text-field-control')).borderColor;

    expect(boundary()).toBe(colors.borderStrong);
    await fireEvent(input, 'focus');
    expect(boundary()).toBe(colors.focus);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await fireEvent(input, 'blur');
    expect(boundary()).toBe(colors.borderStrong);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('keeps the error boundary even while focused', async () => {
    await render(<TextField label="שם" error="שדה חובה" />);
    await fireEvent(screen.getByLabelText('שם'), 'focus');
    expect(flat(screen.getByTestId('text-field-control')).borderColor).toBe(colors.danger);
  });

  it('draws the bronze brand boundary when asked', async () => {
    await render(<TextField label="שם" tone="brand" />);
    expect(flat(screen.getByTestId('text-field-control')).borderColor).toBe(colors.accentBronze);
  });
});

describe('ChipGroup selection', () => {
  const options = [
    { value: 'a', label: 'קטן' },
    { value: 'b', label: 'גדול' },
  ] as const;

  it('marks the selected chip with state and a non-color cue', async () => {
    await render(<ChipGroup options={options} value="a" onChange={() => undefined} accessibilityLabel="גודל" />);
    expect(screen.getByRole('radio', { name: 'קטן' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'גדול' })).not.toBeSelected();
    // Exactly one check-mark icon is rendered: the selected chip's.
    expect(screen.getAllByTestId('icon-checkmark')).toHaveLength(1);
  });

  it('toggles values in multiple mode', async () => {
    const onChange = jest.fn();
    await render(<ChipGroup multiple options={options} value={['a']} onChange={onChange} accessibilityLabel="גודל" />);
    await userEvent.press(screen.getByRole('checkbox', { name: 'גדול' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    await userEvent.press(screen.getByRole('checkbox', { name: 'קטן' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('SegmentedControl', () => {
  it('exposes the selected tab and reports changes', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        segments={[
          { value: 'academy', label: 'אקדמיה' },
          { value: 'library', label: 'אנציקלופדיה' },
        ]}
        value="academy"
        onChange={onChange}
        accessibilityLabel="אזור"
      />,
    );
    expect(screen.getByRole('tab', { name: 'אקדמיה' })).toBeSelected();
    await userEvent.press(screen.getByRole('tab', { name: 'אנציקלופדיה' }));
    expect(onChange).toHaveBeenCalledWith('library');
  });
});

describe('Button', () => {
  it('renders the tonal variant on the muted brand surface', async () => {
    await render(<Button title="עוד" variant="tonal" onPress={() => undefined} />);
    expect(flat(screen.getByRole('button', { name: 'עוד' })).backgroundColor).toBe(colors.primaryMuted);
  });

  it('does not fire while loading and reports busy', async () => {
    const onPress = jest.fn();
    await render(<Button title="שמירה" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'שמירה' });
    expect(button).toBeBusy();
    await userEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Skeleton', () => {
  it('is announced as a single labelled loading element', async () => {
    await render(
      <Skeleton label="טוענים את לוח הבקרה">
        <SkeletonBlock width="50%" />
        <SkeletonBlock round height={40} />
      </Skeleton>,
    );
    expect(screen.getByRole('progressbar', { name: 'טוענים את לוח הבקרה' })).toBeOnTheScreen();
  });

  it('draws round blocks as circles of the given height', async () => {
    await render(
      <Skeleton>
        <SkeletonBlock round height={40} testID="avatar" />
      </Skeleton>,
    );
    // Hidden from assistive technology on purpose, so it is queried with includeHiddenElements.
    const block = screen.getByTestId('avatar', { includeHiddenElements: true });
    expect(StyleSheet.flatten(block.props.style)).toMatchObject({ width: 40, height: 40, borderRadius: 20 });
  });
});
