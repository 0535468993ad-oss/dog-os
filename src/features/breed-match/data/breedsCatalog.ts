import type { BreedProfile } from '../types';
import { COMPANION_BREEDS } from './companionBreeds';
import { FAMILY_RETRIEVER_BREEDS } from './familyRetrieverBreeds';
import { HERDING_SPORTING_BREEDS } from './herdingSportingBreeds';
import { RESCUE_ARCHETYPES } from './rescueArchetypes';
import { TOY_BREEDS } from './toyBreeds';
import { WORKING_BREEDS } from './workingBreeds';

/** Every profile the match engine ranks: IKC breeds first, then the shelter archetypes. */
export const BREEDS_CATALOG: readonly BreedProfile[] = [
  ...WORKING_BREEDS,
  ...HERDING_SPORTING_BREEDS,
  ...FAMILY_RETRIEVER_BREEDS,
  ...COMPANION_BREEDS,
  ...TOY_BREEDS,
  ...RESCUE_ARCHETYPES,
];

/** The catalog profile with this id, if any. */
export function findBreed(id: string): BreedProfile | undefined {
  return BREEDS_CATALOG.find((breed) => breed.id === id);
}
