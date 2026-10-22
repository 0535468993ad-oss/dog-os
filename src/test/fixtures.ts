// Typed test factories. Each returns a complete, valid row; tests override only what they assert on.

import type { HealthData, VetArticle } from '@/features/health/api';
import type { TrainingModule } from '@/features/training/types';
import type { DogRow, FoodPortionRow, JournalEntryRow, UserConsentRow, VaccinationRow, VetSymptomRow, WeightLogRow } from '@/lib/database.types';

const USER_ID = '00000000-0000-4000-8000-000000000001';
const DOG_ID = '00000000-0000-4000-8000-000000000002';
const TS = '2026-01-01T10:00:00.000Z';

export function makeDog(overrides: Partial<DogRow> = {}): DogRow {
  return {
    id: DOG_ID,
    user_id: USER_ID,
    name: 'רקסי',
    breed: 'לברדור רטריבר',
    breed_id: 'labrador',
    birth_date: '2022-05-10',
    size: 'large',
    weight_kg: 28,
    profile_photo_path: null,
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeVaccination(overrides: Partial<VaccinationRow> = {}): VaccinationRow {
  return {
    id: 'vac-1',
    user_id: USER_ID,
    dog_id: DOG_ID,
    name: 'כלבת',
    last_given: '2025-10-01',
    due_date: '2026-10-01',
    notes: null,
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeWeight(overrides: Partial<WeightLogRow> = {}): WeightLogRow {
  return { id: 'w-1', user_id: USER_ID, dog_id: DOG_ID, weight_kg: 28, measured_on: '2026-10-01', created_at: TS, ...overrides };
}

export function makeHealth(overrides: Partial<HealthData> = {}): HealthData {
  return { vaccinations: [], weights: [], food: [], notes: [], ...overrides };
}

export function makeJournal(overrides: Partial<JournalEntryRow> = {}): JournalEntryRow {
  return {
    id: 'j-1',
    user_id: USER_ID,
    dog_id: DOG_ID,
    entry_date: '2026-10-17',
    category: 'behavior',
    mood: null,
    note: 'טיול רגוע',
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeConsent(overrides: Partial<UserConsentRow> = {}): UserConsentRow {
  return {
    id: 'c-1',
    user_id: USER_ID,
    consent_type: 'terms_of_service',
    document_version: '2026-10-18',
    granted: true,
    source: 'signup',
    created_at: TS,
    ...overrides,
  };
}

export function makeModule(overrides: Partial<TrainingModule> = {}): TrainingModule {
  return {
    id: 'sit',
    title: 'ישיבה',
    summary: 'הפקודה הבסיסית',
    category: 'basics',
    difficulty: 'beginner',
    estimated_minutes: 10,
    tips: [],
    sort_order: 1,
    created_at: TS,
    steps: [{ id: 'sit-1', module_id: 'sit', position: 1, title: 'פיתוי', instructions: '...' }],
    ...overrides,
  };
}

export function makeFood(overrides: Partial<FoodPortionRow> = {}): FoodPortionRow {
  return {
    id: 'f-1',
    user_id: USER_ID,
    dog_id: DOG_ID,
    food_name: 'מזון יבש',
    kcal_per_100g: 370,
    grams_per_meal: 150,
    meals_per_day: 2,
    notes: null,
    created_at: TS,
    updated_at: TS,
    ...overrides,
  };
}

export function makeVetArticle(overrides: Partial<VetArticle> = {}): VetArticle {
  return {
    id: 'bloat',
    category: 'emergency',
    organ_system: 'gastrointestinal',
    urgency: 'emergency',
    title: 'היפוך קיבה',
    summary: 'מצב חירום בכלבים גדולים',
    overview: 'הקיבה מתמלאת גז ומסתובבת',
    signs: ['בטן נפוחה', 'ניסיונות הקאה'],
    causes: '',
    actions: [],
    when_to_call_vet: '',
    prevention: '',
    breeds: ['german-shepherd'],
    tags: ['GDV'],
    sort_order: 1,
    created_at: TS,
    ...overrides,
  };
}

export function makeSymptom(overrides: Partial<VetSymptomRow> = {}): VetSymptomRow {
  return { id: 'vomiting', name: 'הקאות', description: '', base_urgency: 'home_care', red_flags: [], sort_order: 1, ...overrides };
}

export const TEST_USER_ID = USER_ID;
