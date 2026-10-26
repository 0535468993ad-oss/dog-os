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

/** One beat of the contract's heartbeat: stronger as the press nears three seconds. */
export function hapticHeartbeat(strength: 0 | 1 | 2): void {
  const styles = [Haptics.ImpactFeedbackStyle.Light, Haptics.ImpactFeedbackStyle.Medium, Haptics.ImpactFeedbackStyle.Heavy] as const;
  Haptics.impactAsync(styles[strength]).catch(ignore);
}

/** A loot-box tap: medium shake, heavy crack, success burst. */
export function hapticLootTap(tap: number): void {
  if (tap >= 2) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
  else Haptics.impactAsync(tap === 1 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(ignore);
}
