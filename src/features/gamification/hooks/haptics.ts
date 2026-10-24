import * as Haptics from 'expo-haptics';

// Haptic feedback for the training loop. Best-effort: devices without a haptic engine (and web)
// simply do nothing, so a rejection is ignored rather than surfaced.

const ignore = () => undefined;

/** A step ticked in a command's checklist. */
export function hapticChecklistStep(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

/** A step marked inside a live session: light, like any step check; the heavy tap is kept for completion. */
export function hapticStep(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

/** A whole exercise session was confirmed. */
export function hapticExerciseDone(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(ignore);
}

/** A level-up or a new trophy. */
export function hapticCelebrate(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}

/** Scoring was blocked (too fast, or frozen). */
export function hapticWarning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
}
