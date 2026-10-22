// Hand-maintained to match supabase/migrations. Once the CLI is linked, regenerate with:
//   npx supabase gen types typescript --project-id jzzvwwvznqzuiwcifaad > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type DogSize = 'small' | 'medium' | 'large' | 'giant';
export type TrainingCategory = 'basics' | 'obedience' | 'behavior' | 'leash' | 'puppy' | 'tricks';
export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ChatRole = 'user' | 'assistant';
export type KnowledgeCategory = 'methodology' | 'behavioral_issue' | 'core_command' | 'puppy_foundation' | 'working_skill';
export type TrainingMethod =
  | 'classical_conditioning'
  | 'operant_conditioning'
  | 'positive_reinforcement'
  | 'clicker_training'
  | 'lima'
  | 'ethology'
  | 'cognitive_science'
  | 'desensitization';
export type VetCategory = 'emergency' | 'condition' | 'breed_health' | 'preventive' | 'medication';
export type OrganSystem =
  | 'cardiovascular'
  | 'respiratory'
  | 'gastrointestinal'
  | 'dermatological'
  | 'neurological'
  | 'musculoskeletal'
  | 'urinary'
  | 'endocrine'
  | 'ocular'
  | 'otic'
  | 'dental'
  | 'multisystem';
export type CareUrgency = 'emergency' | 'vet_visit' | 'home_care';
export type JournalCategory = 'behavior' | 'health' | 'training' | 'general';
export type JournalMood = 'great' | 'good' | 'okay' | 'bad';
export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'ai_disclaimer' | 'analytics' | 'ai_data_sharing';
export type ConsentSource = 'signup' | 'reconsent' | 'settings' | 'cookie_banner';
export type SupportRequestType =
  | 'privacy_access'
  | 'privacy_correction'
  | 'privacy_deletion'
  | 'privacy_objection'
  | 'accessibility'
  | 'general';
export type SupportRequestStatus = 'open' | 'in_progress' | 'closed';

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = {
  id: string;
  display_name: string | null;
  active_dog_id: string | null;
  onboarding_completed: boolean;
} & Timestamps;

export type DogRow = {
  id: string;
  user_id: string;
  name: string;
  breed: string;
  breed_id: string | null;
  birth_date: string;
  size: DogSize;
  weight_kg: number | null;
  profile_photo_path: string | null;
} & Timestamps;

export type TrainingSessionRow = {
  id: string;
  user_id: string;
  dog_id: string;
  skill: string;
  duration_minutes: number;
  completed_at: string;
  notes: string | null;
  created_at: string;
};

export type TrainingModuleRow = {
  id: string;
  title: string;
  summary: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  estimated_minutes: number;
  tips: string[];
  sort_order: number;
  created_at: string;
};

export type TrainingModuleStepRow = {
  id: string;
  module_id: string;
  position: number;
  title: string;
  instructions: string;
};

export type TrainingProgressRow = {
  id: string;
  user_id: string;
  dog_id: string;
  step_id: string;
  completed_at: string;
};

export type ChatHistoryRow = {
  id: string;
  user_id: string;
  dog_id: string | null;
  role: ChatRole;
  message: string;
  created_at: string;
};

export type VaccinationRow = {
  id: string;
  user_id: string;
  dog_id: string;
  name: string;
  last_given: string | null;
  due_date: string | null;
  notes: string | null;
} & Timestamps;

export type WeightLogRow = {
  id: string;
  user_id: string;
  dog_id: string;
  weight_kg: number;
  measured_on: string;
  created_at: string;
};

export type FoodPortionRow = {
  id: string;
  user_id: string;
  dog_id: string;
  food_name: string;
  kcal_per_100g: number | null;
  grams_per_meal: number;
  meals_per_day: number;
  notes: string | null;
} & Timestamps;

export type MedicalNoteRow = {
  id: string;
  user_id: string;
  dog_id: string;
  title: string;
  body: string;
  noted_on: string;
} & Timestamps;

export type KnowledgeArticleRow = {
  id: string;
  category: KnowledgeCategory;
  methods: TrainingMethod[];
  title: string;
  summary: string;
  historical_context: string;
  principles: string;
  steps: Json;
  pros: string[];
  cons: string[];
  practical_tips: string[];
  related_module_ids: string[];
  reading_minutes: number;
  sort_order: number;
  created_at: string;
};

export type KnowledgeBookmarkRow = {
  user_id: string;
  article_id: string;
  created_at: string;
};

export type VetArticleRow = {
  id: string;
  category: VetCategory;
  organ_system: OrganSystem | null;
  urgency: CareUrgency | null;
  title: string;
  summary: string;
  overview: string;
  signs: string[];
  causes: string;
  actions: Json;
  when_to_call_vet: string;
  prevention: string;
  breeds: string[];
  tags: string[];
  sort_order: number;
  created_at: string;
};

export type VetSymptomRow = {
  id: string;
  name: string;
  description: string;
  base_urgency: CareUrgency;
  red_flags: string[];
  sort_order: number;
};

export type VetSymptomConditionRow = {
  symptom_id: string;
  article_id: string;
};

/** Mirrors the check constraint on knowledge_chunks.category. */
export type KnowledgeChunkCategory = 'EMERGENCY_TOXICOLOGY' | 'CLINICAL_NUTRITION' | 'ETHOLOGY_BEHAVIOR' | 'TRAINING_DRIVE' | 'ISRAEL_REGULATION_BREEDS';

export type KnowledgeChunkRow = {
  id: string;
  category: KnowledgeChunkCategory;
  title_he: string;
  content_he: string;
  source_reference: string;
  is_verified: boolean;
  // PostgREST serializes pgvector as its text form, e.g. "[0.1,0.2,...]".
  embedding: string | null;
} & Timestamps;

/** One row of the match_dog_knowledge RPC (verified chunks only). */
export type KnowledgeMatchRow = Pick<KnowledgeChunkRow, 'id' | 'category' | 'title_he' | 'content_he' | 'source_reference'> & { similarity: number };

export type JournalEntryRow = {
  id: string;
  user_id: string;
  dog_id: string;
  entry_date: string;
  category: JournalCategory;
  mood: JournalMood | null;
  note: string;
} & Timestamps;

export type DailyInsightsRow = {
  dog_id: string;
  user_id: string;
  insight_date: string;
  insights: Json;
  model: string;
  created_at: string;
};

/** Per-dog training gamification state (supabase/migrations/20261022120000_dog_training_game.sql). */
export type TrainingGameRow = {
  dog_id: string;
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  distinct_active_days: number;
  daily_xp_earned: number;
  daily_xp_date: string | null;
  unlocked_trophies: string[];
  last_session_at: string | null;
  state: Json;
  client_updated_at: string;
} & Timestamps;

export type UserConsentRow = {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  document_version: string;
  granted: boolean;
  source: ConsentSource;
  created_at: string;
};

export type SupportRequestRow = {
  id: string;
  user_id: string;
  request_type: SupportRequestType;
  subject: string;
  message: string;
  contact_email: string | null;
  status: SupportRequestStatus;
} & Timestamps;

type UserOwned = 'id' | 'user_id' | 'created_at';

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'display_name' | 'active_dog_id' | 'onboarding_completed' | 'created_at' | 'updated_at'>;
      dogs: Table<DogRow, UserOwned | 'updated_at' | 'breed_id' | 'weight_kg' | 'profile_photo_path'>;
      training_sessions: Table<TrainingSessionRow, UserOwned | 'completed_at' | 'notes'>;
      training_modules: Table<TrainingModuleRow, 'tips' | 'sort_order' | 'created_at'>;
      training_module_steps: Table<TrainingModuleStepRow, 'id'>;
      user_training_progress: Table<TrainingProgressRow, 'id' | 'user_id' | 'completed_at'>;
      chat_history: Table<ChatHistoryRow, UserOwned | 'dog_id'>;
      vaccinations: Table<VaccinationRow, UserOwned | 'updated_at' | 'last_given' | 'due_date' | 'notes'>;
      weight_logs: Table<WeightLogRow, UserOwned | 'measured_on'>;
      food_portions: Table<FoodPortionRow, UserOwned | 'updated_at' | 'kcal_per_100g' | 'notes'>;
      medical_notes: Table<MedicalNoteRow, UserOwned | 'updated_at' | 'body' | 'noted_on'>;
      training_knowledge_base: Table<KnowledgeArticleRow, 'methods' | 'historical_context' | 'principles' | 'steps' | 'pros' | 'cons' | 'practical_tips' | 'related_module_ids' | 'reading_minutes' | 'sort_order' | 'created_at'>;
      knowledge_bookmarks: Table<KnowledgeBookmarkRow, 'user_id' | 'created_at'>;
      veterinary_knowledge_base: Table<VetArticleRow, 'organ_system' | 'urgency' | 'overview' | 'signs' | 'causes' | 'actions' | 'when_to_call_vet' | 'prevention' | 'breeds' | 'tags' | 'sort_order' | 'created_at'>;
      vet_symptoms: Table<VetSymptomRow, 'description' | 'red_flags' | 'sort_order'>;
      vet_symptom_conditions: Table<VetSymptomConditionRow>;
      journal_entries: Table<JournalEntryRow, UserOwned | 'updated_at' | 'entry_date' | 'category' | 'mood'>;
      dog_daily_insights: Table<DailyInsightsRow, 'created_at'>;
      dog_training_game: Table<TrainingGameRow, 'user_id' | 'created_at' | 'updated_at'>;
      user_consents: Table<UserConsentRow, UserOwned>;
      support_requests: Table<SupportRequestRow, UserOwned | 'updated_at' | 'contact_email' | 'status'>;
      knowledge_chunks: Table<KnowledgeChunkRow, 'id' | 'is_verified' | 'embedding' | 'created_at' | 'updated_at'>;
    };
    Views: Record<string, never>;
    Functions: {
      ai_data_sharing_allowed: { Args: Record<string, never>; Returns: boolean };
      match_dog_knowledge: {
        Args: { query_embedding: string; match_threshold?: number; match_count?: number; filter_category?: KnowledgeChunkCategory | null };
        Returns: KnowledgeMatchRow[];
      };
    };
    Enums: {
      dog_size: DogSize;
      training_category: TrainingCategory;
      training_difficulty: TrainingDifficulty;
      chat_role: ChatRole;
      knowledge_category: KnowledgeCategory;
      training_method: TrainingMethod;
      vet_category: VetCategory;
      organ_system: OrganSystem;
      care_urgency: CareUrgency;
      journal_category: JournalCategory;
      journal_mood: JournalMood;
      consent_type: ConsentType;
      consent_source: ConsentSource;
      support_request_type: SupportRequestType;
      support_request_status: SupportRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
