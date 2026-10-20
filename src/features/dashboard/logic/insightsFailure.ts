import type { EdgeFunctionError } from '@/utils/errors';

/** HTTP statuses where falling back to rule-based insights is the designed behaviour, not an anomaly. */
const EXPECTED_STATUSES: ReadonlySet<number> = new Set([
  404, // function not deployed (gateway NOT_FOUND) or dog not found
  429, // daily generation cap or AI provider rate limit
  503, // AI provider not configured or temporarily unavailable
]);

/**
 * Whether an `insights` failure is expected and should fall back silently. 403 counts only as the AI
 * opt-out; any other 403, 401, 5xx, network failure or unknown code is an anomaly worth reporting.
 */
export function isExpectedInsightsFailure({ status, code }: EdgeFunctionError): boolean {
  if (status === 403) return code === 'ai_opted_out';
  return EXPECTED_STATUSES.has(status);
}
