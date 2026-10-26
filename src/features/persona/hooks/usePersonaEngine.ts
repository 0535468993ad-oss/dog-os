import { useQuery, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/components/ui';
import { queryKeys } from '@/lib/queryClient';
import { reportError } from '@/utils/errors';

import { DEFAULT_PERSONA_SETTINGS, loadPersonaSettings, savePersonaSettings } from '../api/personaStorage';
import { PERSONAS } from '../data/personasData';
import type { PersonaContextVars, PersonaCopyKey, PersonaId, PersonaSettings } from '../types';
import { aiPersonaFor, formatCopy, lootPromptFor, praiseFor } from '../utils/personaCopy';

/**
 * The chosen persona and its copy. Emergency surfaces pass `emergency` and always get CLINICAL_PRO. The
 * AI never receives a prompt built here: chat sends only `aiPersona(message)`, an id the server maps to
 * its own reviewed tone instruction, so a client cannot inject instructions into the model.
 */
export function usePersonaEngine() {
  const client = useQueryClient();
  const key = queryKeys.persona();
  const query = useQuery({ queryKey: key, queryFn: loadPersonaSettings, staleTime: Infinity });
  const settings = query.data ?? DEFAULT_PERSONA_SETTINGS;
  const active = settings.personaId;

  /** Applies settings at once and saves them; a failed save is reported and shown. */
  const save = (next: PersonaSettings) => {
    client.setQueryData(key, next);
    savePersonaSettings(next).catch((error: unknown) => {
      reportError(error, 'persona/save');
      showToast('לא הצלחנו לשמור את הבחירה במכשיר. נסו שוב.');
    });
  };
  const latest = () => client.getQueryData<PersonaSettings>(key) ?? settings;

  return {
    activePersona: active,
    persona: PERSONAS[active],
    isLoading: query.isLoading,
    setPersona: (personaId: PersonaId) => save({ ...latest(), personaId }),
    formatCopy: (copyKey: PersonaCopyKey, vars: Partial<PersonaContextVars>, emergency = false) => formatCopy(active, copyKey, vars, emergency),
    praise: (combo: number, vars: Partial<PersonaContextVars>) => praiseFor(active, combo, vars),
    lootPrompt: (tap: number) => lootPromptFor(active, tap),
    /** The persona id to send with a chat message (clinical when the message is an emergency). */
    aiPersona: (message: string) => aiPersonaFor(active, message),
    contractSignedAt: (dogId: string): string | null => settings.contracts[dogId] ?? null,
    signContract: (dogId: string, now = new Date()) => save({ ...latest(), contracts: { ...latest().contracts, [dogId]: now.toISOString() } }),
  };
}
