/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { MoodLog, StressTrigger, EmotionReflection, WellnessState } from '../types';
import { saveEncrypted, loadDecrypted } from '../utils/crypto';

// Local storage storage key
const STORAGE_KEY = '__wellness_companion_secret_state__';

interface WellnessStoreState extends WellnessState {
  addMoodLog: (mood: number, journal: string | null) => void;
  addStressTrigger: (categories: string[], customTrigger?: string) => void;
  addReflection: (hardToday: string, managedWell: string, tomorrowWill: string) => void;
  setSelectedExams: (exams: string[]) => void;
  resetStore: () => void;
  loadFromServer: () => Promise<void>;
}

/**
 * Generates local date string of format yyyy-mm-dd
 */
export const getLocalDateString = (dateObj: Date = new Date()): string => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets yesterdays date string given today's date string
 */
export const getYesterdayDateString = (todayStr: string): string => {
  const [y, m, d] = todayStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  dateObj.setDate(dateObj.getDate() - 1);
  return getLocalDateString(dateObj);
};

// Initial state builder
const getInitialState = (): WellnessState => {
  const loaded = loadDecrypted<WellnessState>(STORAGE_KEY);
  if (loaded) {
    // Audit reflection streak: if last reflected date was before yesterday, clean state streak
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString(todayStr);
    
    const stateToReturn = {
      ...loaded,
      selectedExams: loaded.selectedExams || ['NEET', 'JEE', 'Boards'],
    };
    
    if (loaded.lastReflectedDate && 
        loaded.lastReflectedDate !== todayStr && 
        loaded.lastReflectedDate !== yesterdayStr) {
      return {
        ...stateToReturn,
        streakCount: 0,
      };
    }
    return stateToReturn;
  }
  return {
    moodLogs: [],
    loggedTriggers: [],
    reflections: [],
    streakCount: 0,
    lastReflectedDate: null,
    selectedExams: ['NEET', 'JEE', 'Boards'],
  };
};

const syncToServer = (payload: any) => {
  fetch('/api/wellness', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch((err) => console.warn('Could not sync with local database server:', err));
};

export const useWellnessStore = create<WellnessStoreState>((set) => ({
  ...getInitialState(),

  addMoodLog: (mood: number, journal: string | null) => {
    set((state) => {
      const todayStr = getLocalDateString();
      
      // Keep only one mood log per day or append. Let's replace if already logged today for clean data
      const cleanedLogs = state.moodLogs.filter((log) => log.date !== todayStr);
      const newLog: MoodLog = {
        id: crypto.randomUUID(),
        date: todayStr,
        mood,
        journal,
        timestamp: Date.now(),
      };

      const updated = {
        ...state,
        moodLogs: [...cleanedLogs, newLog].sort((a, b) => b.timestamp - a.timestamp),
      };

      const payload = {
        moodLogs: updated.moodLogs,
        loggedTriggers: updated.loggedTriggers,
        reflections: updated.reflections,
        streakCount: updated.streakCount,
        lastReflectedDate: updated.lastReflectedDate,
        selectedExams: updated.selectedExams,
      };

      saveEncrypted(STORAGE_KEY, payload);
      syncToServer(payload);

      return updated;
    });
  },

  addStressTrigger: (categories: string[], customTrigger?: string) => {
    set((state) => {
      const todayStr = getLocalDateString();
      
      // Replace if today's trigger exists, so it's one consolidated log per day
      const cleanedTriggers = state.loggedTriggers.filter((t) => t.date !== todayStr);
      const newTrigger: StressTrigger = {
        id: crypto.randomUUID(),
        date: todayStr,
        categories,
        customTrigger: customTrigger || undefined,
        timestamp: Date.now(),
      };

      const updated = {
        ...state,
        loggedTriggers: [...cleanedTriggers, newTrigger].sort((a, b) => b.timestamp - a.timestamp),
      };

      const payload = {
        moodLogs: updated.moodLogs,
        loggedTriggers: updated.loggedTriggers,
        reflections: updated.reflections,
        streakCount: updated.streakCount,
        lastReflectedDate: updated.lastReflectedDate,
        selectedExams: updated.selectedExams,
      };

      saveEncrypted(STORAGE_KEY, payload);
      syncToServer(payload);

      return updated;
    });
  },

  addReflection: (hardToday: string, managedWell: string, tomorrowWill: string) => {
    set((state) => {
      const todayStr = getLocalDateString();
      const yesterdayStr = getYesterdayDateString(todayStr);
      
      // Only one reflection allowed per day to count towards mindfulness streaks
      const cleanedReflections = state.reflections.filter((r) => r.date !== todayStr);
      const newReflection: EmotionReflection = {
        id: crypto.randomUUID(),
        date: todayStr,
        hardToday,
        managedWell,
        tomorrowWill,
        timestamp: Date.now(),
      };

      let newStreak = state.streakCount;
      if (state.lastReflectedDate === yesterdayStr) {
        newStreak += 1;
      } else if (state.lastReflectedDate === todayStr) {
        // Already reflected today, do not increment but keep current streak
      } else {
        newStreak = 1;
      }

      const updated = {
        ...state,
        reflections: [...cleanedReflections, newReflection].sort((a, b) => b.timestamp - a.timestamp),
        streakCount: newStreak,
        lastReflectedDate: todayStr,
      };

      const payload = {
        moodLogs: updated.moodLogs,
        loggedTriggers: updated.loggedTriggers,
        reflections: updated.reflections,
        streakCount: updated.streakCount,
        lastReflectedDate: updated.lastReflectedDate,
        selectedExams: updated.selectedExams,
      };

      saveEncrypted(STORAGE_KEY, payload);
      syncToServer(payload);

      return updated;
    });
  },

  setSelectedExams: (exams: string[]) => {
    set((state) => {
      const updated = {
        ...state,
        selectedExams: exams,
      };

      const payload = {
        moodLogs: updated.moodLogs,
        loggedTriggers: updated.loggedTriggers,
        reflections: updated.reflections,
        streakCount: updated.streakCount,
        lastReflectedDate: updated.lastReflectedDate,
        selectedExams: updated.selectedExams,
      };

      saveEncrypted(STORAGE_KEY, payload);
      syncToServer(payload);

      return updated;
    });
  },

  resetStore: () => {
    const freshState = {
      moodLogs: [],
      loggedTriggers: [],
      reflections: [],
      streakCount: 0,
      lastReflectedDate: null,
      selectedExams: ['NEET', 'JEE', 'Boards'],
    };
    saveEncrypted(STORAGE_KEY, freshState);
    syncToServer(freshState);
    set(freshState);
  },

  loadFromServer: async () => {
    try {
      const res = await fetch('/api/wellness');
      const json = await res.json();
      if (json.success && json.data) {
        const serverData = json.data;
        if (Array.isArray(serverData.moodLogs)) {
          saveEncrypted(STORAGE_KEY, serverData);
          set((state) => ({
            ...state,
            ...serverData,
          }));
        }
      }
    } catch (err) {
      console.warn('Server database is not reachable, utilizing decrypted localStorage backup:', err);
    }
  },
}));
