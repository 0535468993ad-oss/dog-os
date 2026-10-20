import { TextField } from '@/components/ui';

interface DogWeightFieldProps {
  dogName: string | null;
  value: string;
  onChange: (text: string) => void;
  /** Shown when the typed weight can't be used. */
  error?: string | null;
}

/** The dog's weight in kg, prefilled from the profile and editable for this meal plan only. */
export function DogWeightField({ dogName, value, onChange, error }: DogWeightFieldProps) {
  return (
    <TextField
      label={dogName ? `המשקל של ${dogName} (ק״ג)` : 'משקל הכלב (ק״ג)'}
      value={value}
      onChangeText={onChange}
      error={error}
      hint="הכמויות מחושבות לפי המשקל. השינוי כאן לא נשמר בפרופיל."
      inputMode="decimal"
      keyboardType="decimal-pad"
      maxLength={5}
    />
  );
}
