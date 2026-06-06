/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MoodLog {
  id: string;
  date: string; // yyyy-mm-dd format
  mood: number; // 1 to 5 scale
  journal: string | null;
  timestamp: number;
}

export interface StressTrigger {
  id: string;
  date: string; // yyyy-mm-dd format
  categories: string[]; // e.g. ["syllabus", "peer", "custom_my_trigger"]
  customTrigger?: string;
  timestamp: number;
}

export interface EmotionReflection {
  id: string;
  date: string; // yyyy-mm-dd format
  hardToday: string;
  managedWell: string;
  tomorrowWill: string;
  timestamp: number;
}

export interface WellnessState {
  moodLogs: MoodLog[];
  loggedTriggers: StressTrigger[];
  reflections: EmotionReflection[];
  streakCount: number;
  lastReflectedDate: string | null;
  selectedExams?: string[];
}

export type TimeOfDay = 'morning' | 'evening';
