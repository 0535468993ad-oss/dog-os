import { AppText } from '@/components/ui';

/** Form-level error, announced to screen readers; renders nothing without a message. */
export function SubmitError({ message }: { message: string | null }) {
  return message ? (
    <AppText color="dangerText" accessibilityRole="alert">
      {message}
    </AppText>
  ) : null;
}
