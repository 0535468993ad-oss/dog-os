import { AppText, Button, Checkbox, Disclaimer, GlassCard } from '@/components/ui';

import { VOLHARD_PRECONDITIONS } from '../data/volhardProfiles';
import type { PreconditionId } from '../types';

interface VolhardPreconditionsGateProps {
  confirmed: readonly PreconditionId[];
  gateOpen: boolean;
  onToggle: (id: PreconditionId) => void;
  onStart: () => void;
}

/** The four conditions that must hold before testing; the test stays locked until all are confirmed. */
export function VolhardPreconditionsGate({ confirmed, gateOpen, onToggle, onStart }: VolhardPreconditionsGateProps) {
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        לפני שמתחילים – ארבעה תנאי חובה
      </AppText>
      <AppText color="textSecondary">
        מבחן Volhard בודק מזג מולד: סף גירוי, ויסות תסכול, התאוששות מבהלה ודחפים. אם אחד התנאים לא מתקיים – התוצאה משקפת את הנסיבות, לא את הגור.
      </AppText>
      {VOLHARD_PRECONDITIONS.map((condition) => (
        <Checkbox key={condition.id} checked={confirmed.includes(condition.id)} onChange={() => onToggle(condition.id)} label={condition.titleHe}>
          <AppText variant="bodyStrong">{condition.titleHe}</AppText>
          <AppText variant="caption" color="textSecondary">
            {condition.detailHe}
          </AppText>
        </Checkbox>
      ))}
      <Button title="התחלת המבחן" icon="play" onPress={onStart} disabled={!gateOpen} accessibilityHint={gateOpen ? undefined : 'צריך לאשר את ארבעת התנאים'} />
      <Disclaimer>המבחן הוא כלי עזר לבחירת גור מתוך המלטה, לא אבחנה. גם גור &quot;מאוזן&quot; צריך חשיפה חברתית ואילוף.</Disclaimer>
    </GlassCard>
  );
}
