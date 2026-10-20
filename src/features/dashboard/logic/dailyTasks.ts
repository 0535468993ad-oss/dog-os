import type Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';

import type { HealthData } from '@/features/health/api';
import { vaccinationStatus } from '@/features/health/logic/vaccinationStatus';
import type { TrainingModule } from '@/features/training/api';
import type { JournalEntryRow, VaccinationRow } from '@/lib/database.types';
import { daysBetween } from '@/utils/date';

export interface DailyTask {
  id: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail?: string;
  href: Href;
  urgent?: boolean;
}

export interface DailyTaskInputs {
  today: string;
  health: HealthData | undefined;
  nextModule: TrainingModule | null;
  completedSteps: Set<string>;
  journal: JournalEntryRow[] | undefined;
}

/** Vaccinations due within this many days become a task. */
export const TASK_VACCINE_WINDOW_DAYS = 14;
/** Vaccinations due within this many days appear as health reminders. */
export const REMINDER_WINDOW_DAYS = 30;
/** A weigh-in task appears when the last weigh-in is older than this. */
export const WEIGH_IN_INTERVAL_DAYS = 30;

/** Today's to-do list: next training step, meals, due vaccinations, monthly weigh-in and the journal entry. */
export function buildDailyTasks({ today, health, nextModule, completedSteps, journal }: DailyTaskInputs): DailyTask[] {
  const tasks: DailyTask[] = [];

  if (nextModule) {
    const nextStep = nextModule.steps.find((s) => !completedSteps.has(s.id));
    tasks.push({
      id: 'training',
      icon: 'school-outline',
      title: `אימון: ${nextModule.title}`,
      detail: nextStep ? `שלב ${nextStep.position} – ${nextStep.title}` : undefined,
      href: { pathname: '/training/module/[moduleId]', params: { moduleId: nextModule.id } },
    });
  }

  for (const f of health?.food ?? []) {
    tasks.push({ id: `food-${f.id}`, icon: 'restaurant-outline', title: `${f.meals_per_day} ארוחות × ${f.grams_per_meal} גרם`, detail: f.food_name, href: '/health' });
  }

  for (const v of dueWithin(health?.vaccinations ?? [], today, TASK_VACCINE_WINDOW_DAYS)) {
    tasks.push({ id: `vac-${v.id}`, icon: 'medkit-outline', title: `חיסון: ${v.name}`, detail: vaccinationStatus(v, today).label, href: '/health', urgent: v.due_date! < today });
  }

  const weights = health?.weights ?? [];
  const lastWeight = weights[weights.length - 1];
  if (!lastWeight || daysBetween(lastWeight.measured_on, today) > WEIGH_IN_INTERVAL_DAYS) {
    tasks.push({ id: 'weigh', icon: 'scale-outline', title: 'שקילה חודשית', href: '/health' });
  }

  if (!journal?.some((j) => j.entry_date === today)) {
    tasks.push({ id: 'journal', icon: 'book-outline', title: 'רשומה ביומן להיום', href: '/journal' });
  }
  return tasks;
}

/** Vaccinations with a due date no more than `days` ahead (including overdue ones). */
export function dueWithin(vaccinations: VaccinationRow[], today: string, days: number): VaccinationRow[] {
  return vaccinations.filter((v) => v.due_date && daysBetween(today, v.due_date) <= days);
}

/** Vaccinations to show as health reminders on the dashboard. */
export function healthReminders(health: HealthData | undefined, today: string): VaccinationRow[] {
  return dueWithin(health?.vaccinations ?? [], today, REMINDER_WINDOW_DAYS);
}

/** Hebrew summary of today's open tasks. */
export function taskSummary(count: number): string {
  if (count === 0) return 'אין משימות פתוחות להיום';
  return count === 1 ? 'משימה אחת להיום' : `${count} משימות להיום`;
}
