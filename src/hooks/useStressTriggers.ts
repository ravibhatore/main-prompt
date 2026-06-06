/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useWellnessStore, getLocalDateString } from '../store/useWellnessStore';
import { StressTrigger } from '../types';
import { sanitizeInput } from '../utils/sanitizer';

/**
 * Custom hook managing stress triggers, custom trigger insertions, and 30-day heatmap data.
 */
export const useStressTriggers = () => {
  const { loggedTriggers, addStressTrigger } = useWellnessStore();

  /**
   * Retrieves today's logged triggers.
   */
  const todayTriggerLog = useMemo<StressTrigger | undefined>(() => {
    const todayStr = getLocalDateString();
    return loggedTriggers.find((t) => t.date === todayStr);
  }, [loggedTriggers]);

  /**
   * Submits stress triggers for today.
   * @param categories List of predefined category strings
   * @param customTrigger Optional user entered raw trigger text
   */
  const logTriggers = (categories: string[], customTrigger?: string): { success: boolean } => {
    const cleanCustom = customTrigger ? sanitizeInput(customTrigger, 100) : undefined;
    addStressTrigger(categories, cleanCustom);
    return { success: true };
  };

  /**
   * Generates sequential 30-day calendar heatmap data.
   * Starts from 29 days ago up to today.
   */
  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      
      const match = loggedTriggers.find((t) => t.date === dateStr);
      const count = match ? match.categories.length : 0;
      const categories = match ? match.categories : [];
      
      data.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        count,
        categories,
      });
    }
    return data;
  }, [loggedTriggers]);

  return {
    todayTriggerLog,
    logTriggers,
    heatmapData,
    allTriggers: loggedTriggers,
  };
};
