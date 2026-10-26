import type { FciGroup } from '../types';

// The ten FCI groups by their Hebrew names (Fédération Cynologique Internationale nomenclature).

export const FCI_GROUP_NAMES_HE: Readonly<Record<FciGroup, string>> = {
  1: 'כלבי רועים וכלבי בקר (מלבד כלבי בקר שווייצריים)',
  2: 'פינשרים ושנאוצרים, מולוסרים, כלבי הרים וכלבי בקר שווייצריים',
  3: 'טרייר',
  4: 'תחשים',
  5: 'שפיצים וכלבים מטיפוס קדום',
  6: 'כלבי ציד לפי ריח וכלבי מעקב',
  7: 'כלבי הצבעה',
  8: 'רטריברים, כלבי הקמה וכלבי מים',
  9: 'כלבי חברה וכלבי צעצוע',
  10: 'כלבי ציד ראייה (גרייהאונדים)',
};
