/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useWellnessStore, getLocalDateString } from '../store/useWellnessStore';
import { TimeOfDay, MoodLog } from '../types';
import { sanitizeInput } from '../utils/sanitizer';

/**
 * Custom hook managing mood logging business logic, alerts, and time-of-day prompts.
 */
export const useMoodLog = () => {
  const { moodLogs, addMoodLog } = useWellnessStore();

  /**
   * Determines if the current time is morning (< 12:00) or evening/afternoon (>= 12:00)
   * @returns 'morning' | 'evening'
   */
  const getTimeOfDay = (): TimeOfDay => {
    const hours = new Date().getHours();
    return hours < 12 ? 'morning' : 'evening';
  };

  /**
   * Retrieves today's mood log if recorded.
   */
  const todayMoodLog = useMemo<MoodLog | undefined>(() => {
    const todayStr = getLocalDateString();
    return moodLogs.find((log) => log.date === todayStr);
  }, [moodLogs]);

  /**
   * Submits a clean, sanitized check-in log.
   * @param mood Rating score from 1 to 5
   * @param journal Free-form text journal input entry
   */
  const logMood = (mood: number, journal: string): { success: boolean; error?: string } => {
    if (mood < 1 || mood > 5) {
      return { success: false, error: 'Invalid mood value' };
    }
    const cleanJournal = sanitizeInput(journal, 500);
    addMoodLog(mood, cleanJournal || null);
    return { success: true };
  };

  return {
    timeOfDay: getTimeOfDay(),
    todayMoodLog,
    logMood,
    allMoodLogs: moodLogs,
  };
};
