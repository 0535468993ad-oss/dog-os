import { ChipGroup, type ChipOption } from '@/components/ui';

import { findIngredient, PANTRY_ITEM_IDS } from '../utils/catalog';

const OPTIONS: ChipOption<string>[] = PANTRY_ITEM_IDS.flatMap((id) => {
  const definition = findIngredient(id);
  return definition ? [{ value: id, label: definition.nameHe }] : [];
});

/** Quick-tap chips for common household foods; several can be selected. */
export function PantrySelector({ value, onChange }: { value: readonly string[]; onChange: (ids: string[]) => void }) {
  return <ChipGroup multiple options={OPTIONS} value={value} onChange={onChange} accessibilityLabel="מה יש לכם בבית" />;
}
