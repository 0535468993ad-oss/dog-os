export type DogSize = 'small' | 'medium' | 'large';

export interface Dog {
  id: string;
  name: string;
  breed: string;
  birthDate: string; // ISO 8601
  size: DogSize;
  photoUrl?: string;
}

export interface TrainingSession {
  id: string;
  dogId: string;
  skill: string;
  durationMinutes: number;
  completedAt: string; // ISO 8601
  notes?: string;
}
