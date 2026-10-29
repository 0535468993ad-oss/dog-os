// Obsidian brand polish on shared UI: the recessed segmented track, the quiet section label and inset dividers.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_AREA } from '@/constants/theme';

import { Divider, SectionHeader } from '../Misc';
import { SegmentedControl } from '../SegmentedControl';

const flat = (element: { props: { style?: unknown } }) => StyleSheet.flatten(element.props.style as never) as Record<string, unknown>;

describe('SegmentedControl', () => {
  it('sits on a recessed, hairline-bordered track with dark text on the selected amber pill', async () => {
    await render(
      <SegmentedControl
        segments={[
          { value: 'academy', label: 'אקדמיה' },
          { value: 'library', label: 'אנציקלופדיה' },
        ]}
        value="academy"
        onChange={jest.fn()}
        accessibilityLabel="אזור"
      />,
    );

    expect(flat(screen.getByLabelText('אזור'))).toMatchObject({ backgroundColor: colors.surfaceSunken, borderRadius: 12, borderWidth: 1, padding: 4 });
    expect(flat(screen.getByText('אקדמיה')).color).toBe(colors.onPrimary);
    expect(flat(screen.getByText('אנציקלופדיה')).color).toBe(colors.textSecondary);
    for (const tab of screen.getAllByRole('tab')) expect(flat(tab).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });
});

describe('SectionHeader', () => {
  it('labels a group in the quiet 13px section style, below the screen title', async () => {
    await render(<SectionHeader title="כלים" />);
    expect(flat(screen.getByRole('header', { name: 'כלים' }))).toMatchObject({ fontSize: 13, color: colors.textLabel });
  });
});

describe('Divider', () => {
  it('runs full width by default and indents its start edge when inset', async () => {
    await render(<Divider />);
    expect(flat(screen.getByTestId('divider')).marginStart).toBeUndefined();

    await render(<Divider inset={46} />);
    expect(flat(screen.getByTestId('divider')).marginStart).toBe(46);
  });
});
