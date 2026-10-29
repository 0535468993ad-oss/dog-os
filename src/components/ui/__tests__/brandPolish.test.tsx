// Obsidian brand polish on shared UI: the recessed segmented track, bold section headers, inset dividers,
// accent-bar card tones and empty progress tracks.
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors, fonts, MIN_TOUCH_AREA } from '@/constants/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Card } from '../Card';
import { Divider, ProgressBar, SectionHeader } from '../Misc';
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
  it('heads a group in bold, bright 18px type that outranks its action button', async () => {
    await render(<SectionHeader title="חיסונים" action={<Button title="+ הוספה" variant="ghost" compact onPress={jest.fn()} />} />);
    const header = flat(screen.getByRole('header', { name: 'חיסונים' }));
    expect(header).toMatchObject({ fontSize: 18, fontFamily: fonts.bold, color: colors.textPrimary });
    expect(Number(header.fontSize)).toBeGreaterThan(Number(flat(screen.getByText('+ הוספה')).fontSize));
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

describe('Card tones', () => {
  it('keeps toned cards on the clean obsidian surface with a start-edge accent bar', async () => {
    await render(
      <Card tone="primary" accessibilityLabel="תובנות">
        <AppText>תוכן</AppText>
      </Card>,
    );
    expect(flat(screen.getByLabelText('תובנות'))).toMatchObject({ backgroundColor: colors.surface, borderStartWidth: 3, borderStartColor: colors.primary });
  });

  it('leaves the default card without an accent bar and keeps danger tinted', async () => {
    await render(
      <>
        <Card accessibilityLabel="רגיל">
          <AppText>א</AppText>
        </Card>
        <Card tone="danger" accessibilityLabel="חירום">
          <AppText>ב</AppText>
        </Card>
      </>,
    );
    expect(flat(screen.getByLabelText('רגיל')).borderStartWidth).toBeUndefined();
    expect(flat(screen.getByLabelText('חירום')).backgroundColor).toBe(colors.dangerMuted);
  });
});

describe('ProgressBar', () => {
  it('shows a dim stub on an empty track and a real fill otherwise', async () => {
    await render(<ProgressBar value={0} label="חדות מוחית: 0%" />);
    expect(screen.getByRole('progressbar', { name: 'חדות מוחית: 0%' }).props.accessibilityValue).toMatchObject({ now: 0 });
    expect(flat(screen.getByTestId('progress-empty')).backgroundColor).toBe(colors.primaryMuted);

    await render(<ProgressBar value={0.4} label="עוצמת קשר: 40%" />);
    expect(screen.queryByTestId('progress-empty')).toBeNull();
  });
});
