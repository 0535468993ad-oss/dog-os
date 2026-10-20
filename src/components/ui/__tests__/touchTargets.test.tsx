// WCAG 2.5.5 / platform guidelines: every control's touch target is at least MIN_TOUCH_AREA (44pt).
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MIN_TOUCH_AREA } from '@/constants/theme';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { ChipGroup } from '../ChipGroup';
import { IconButton } from '../IconButton';
import { SegmentedControl } from '../SegmentedControl';

function minSize(element: { props: { style?: unknown } }) {
  const style = StyleSheet.flatten(element.props.style as never) as { minHeight?: number; minWidth?: number; height?: number } | undefined;
  return { height: style?.minHeight ?? style?.height ?? 0, width: style?.minWidth ?? Number.POSITIVE_INFINITY };
}

describe('touch targets', () => {
  it('Button', async () => {
    await render(<Button title="שמירה" onPress={() => undefined} compact />);
    expect(minSize(screen.getByRole('button', { name: 'שמירה' })).height).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });

  it('IconButton', async () => {
    await render(<IconButton icon="trash-outline" accessibilityLabel="מחיקה" onPress={() => undefined} />);
    const size = minSize(screen.getByRole('button', { name: 'מחיקה' }));
    expect(size.height).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
    expect(size.width).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });

  it('Checkbox', async () => {
    await render(<Checkbox checked={false} onChange={() => undefined} label="אני מסכים/ה" />);
    const size = minSize(screen.getByRole('checkbox', { name: 'אני מסכים/ה' }));
    expect(size.height).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
    expect(size.width).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });

  it('ChipGroup options', async () => {
    await render(<ChipGroup options={[{ value: 'a', label: 'קטן' }]} value={null} onChange={() => undefined} accessibilityLabel="גודל" />);
    expect(minSize(screen.getByRole('radio', { name: 'קטן' })).height).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });

  it('SegmentedControl segments', async () => {
    await render(<SegmentedControl segments={[{ value: 'a', label: 'אקדמיה' }]} value="a" onChange={() => undefined} accessibilityLabel="אזור" />);
    expect(minSize(screen.getByRole('tab', { name: 'אקדמיה' })).height).toBeGreaterThanOrEqual(MIN_TOUCH_AREA);
  });
});
