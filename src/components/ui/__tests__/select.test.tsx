import { render, screen, userEvent } from '@testing-library/react-native';

import { Select } from '../select/Select';
import { displayText, filterOptions, shouldOfferCustom } from '../select/selectLogic';

const OPTIONS = [
  { value: 'labrador', label: 'לברדור רטריבר' },
  { value: 'mixed', label: 'מעורב' },
];

describe('select logic', () => {
  it('filters by label or value, case-insensitively', () => {
    expect(filterOptions(OPTIONS, 'לברדור').map((o) => o.value)).toEqual(['labrador']);
    expect(filterOptions(OPTIONS, 'MIXED').map((o) => o.value)).toEqual(['mixed']);
    expect(filterOptions(OPTIONS, '  ')).toHaveLength(2);
  });

  it('shows the selected label, else the custom value', () => {
    expect(displayText(OPTIONS, 'mixed')).toBe('מעורב');
    expect(displayText(OPTIONS, null, 'כנעני-מיקס')).toBe('כנעני-מיקס');
    expect(displayText(OPTIONS, null)).toBeNull();
  });

  it('offers the typed text only when allowed and not an exact option', () => {
    expect(shouldOfferCustom(true, 'פודל', [])).toBe(true);
    expect(shouldOfferCustom(false, 'פודל', [])).toBe(false);
    expect(shouldOfferCustom(true, 'מעורב', [{ value: 'mixed', label: 'מעורב' }])).toBe(false);
    expect(shouldOfferCustom(true, '   ', [])).toBe(false);
  });
});

describe('Select', () => {
  it('announces its label and value, and picks an option from the sheet', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<Select label="גזע" options={OPTIONS} value={null} onChange={onChange} />);

    await user.press(screen.getByRole('button', { name: 'גזע: לא נבחר' }));
    await user.press(await screen.findByRole('radio', { name: 'מעורב' }));
    expect(onChange).toHaveBeenCalledWith('mixed');
  });

  it('accepts a typed custom value', async () => {
    const user = userEvent.setup();
    const onCustomValue = jest.fn();
    await render(<Select label="גזע" options={OPTIONS} value={null} onChange={() => undefined} onCustomValue={onCustomValue} searchable />);

    await user.press(screen.getByRole('button', { name: 'גזע: לא נבחר' }));
    await user.type(await screen.findByLabelText('חיפוש בגזע'), 'פודל');
    await user.press(screen.getByRole('button', { name: 'שימוש ב״פודל״' }));
    expect(onCustomValue).toHaveBeenCalledWith('פודל');
  });
});
