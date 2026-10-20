import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';

import { errorResponse, logError } from './http.ts';

export { Anthropic };

export const MODEL = 'claude-opus-5-5';

export function createAnthropic(): Anthropic | null {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  // Edge Functions have a wall-clock limit, so keep retries/timeouts bounded.
  return new Anthropic({ apiKey, maxRetries: 1, timeout: 90_000 });
}

export function textOf(content: ReadonlyArray<{ type: string }>): string {
  return content
    .flatMap((block) => (block.type === 'text' && 'text' in block && typeof block.text === 'string' ? [block.text] : []))
    .join('\n')
    .trim();
}

export function anthropicErrorResponse(error: unknown): Response {
  if (error instanceof Anthropic.RateLimitError) {
    return errorResponse('rate_limited', 429, 'The AI service is busy. Try again in a minute.');
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    logError('anthropic:credentials', error);
    return errorResponse('ai_unavailable', 503, 'The AI service is not configured.');
  }
  if (error instanceof Anthropic.BadRequestError) {
    logError('anthropic:bad-request', error);
    return errorResponse('internal', 500);
  }
  if (error instanceof Anthropic.APIError) {
    // 5xx and 529 (overloaded) are transient.
    logError('anthropic:api', error);
    return errorResponse('ai_unavailable', 503, 'The AI service is temporarily unavailable.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    logError('anthropic:connection', error);
    return errorResponse('ai_unavailable', 503, 'The AI service is temporarily unavailable.');
  }
  logError('anthropic:unexpected', error);
  return errorResponse('internal', 500);
}
