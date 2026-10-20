// Hand-written to match supabase/migrations. Once the project is linked, regenerate with:
//   npx supabase gen types typescript --project-id <project-ref> > src/services/database.types.ts
import type { DogSize } from '@/types';

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type DogRow = {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  birth_date: string;
  size: DogSize;
  photo_url: string | null;
  created_at: string;
};

export type TrainingSessionRow = {
  id: string;
  owner_id: string;
  dog_id: string;
  skill: string;
  duration_minutes: number;
  completed_at: string;
  notes: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      dogs: Table<
        DogRow,
        Omit<DogRow, 'id' | 'owner_id' | 'created_at' | 'photo_url'> & {
          id?: string;
          owner_id?: string;
          photo_url?: string | null;
        }
      >;
      training_sessions: Table<
        TrainingSessionRow,
        Omit<TrainingSessionRow, 'id' | 'owner_id' | 'created_at' | 'notes' | 'completed_at'> & {
          id?: string;
          owner_id?: string;
          notes?: string | null;
          completed_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { dog_size: DogSize };
    CompositeTypes: Record<string, never>;
  };
};
