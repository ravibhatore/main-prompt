/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useWellnessStore } from '../store/useWellnessStore';
import { TRANSLATIONS } from '../constants/translations';

/**
 * Custom hook managing recommendation engine, crisis threshold checks, top triggers, and weekly suggestions.
 */
export const useWellnessReport = () => {
  const { moodLogs, loggedTriggers } = useWellnessStore();

  /**
   * Helper to parse yyyy-mm-dd to midnight timestamp for differences
   */
  const getMidnightTime = (dateStr: string): number => {
    return new Date(dateStr + 'T00:00:00').getTime();
  };

  /**
   * Checks if mood is <= 2 for 3+ consecutive logged days in historical data.
   * Considers actual calendar consecutiveness: consecutive log dates having <= 2.
   */
  const showCrisisResources = useMemo<boolean>(() => {
    if (moodLogs.length < 3) {
      return false;
    }

    // Sort ascending by date to check chronologically
    const sorted = [...moodLogs].sort((a, b) => a.date.localeCompare(b.date));

    // Look for any window of 3 consecutive calendar days where mood is <= 2
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (let i = 0; i <= sorted.length - 3; i++) {
      const entry1 = sorted[i];
      const entry2 = sorted[i + 1];
      const entry3 = sorted[i + 2];

      if (entry1.mood <= 2 && entry2.mood <= 2 && entry3.mood <= 2) {
        // Verify they are consecutive calendar days
        const t1 = getMidnightTime(entry1.date);
        const t2 = getMidnightTime(entry2.date);
        const t3 = getMidnightTime(entry3.date);

        const diff12 = Math.abs(t2 - t1);
        const diff23 = Math.abs(t3 - t2);

        // Within 1.5 to 2 days room for clock jumps or exactly 1 day offset
        const maxOffset = ONE_DAY_MS * 1.5;
        if (diff12 < maxOffset && diff23 < maxOffset) {
          return true;
        }
      }
    }

    return false;
  }, [moodLogs]);

  /**
   * Calculates the top trigger category over the last week.
   */
  const weeklyAnalytics = useMemo(() => {
    const triggerCounts: Record<string, number> = {};
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentTriggers = loggedTriggers.filter((t) => t.timestamp >= oneWeekAgo);

    recentTriggers.forEach((log) => {
      log.categories.forEach((cat) => {
        triggerCounts[cat] = (triggerCounts[cat] || 0) + 1;
      });
    });

    const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
    const topTrigger = sortedTriggers[0] ? sortedTriggers[0][0] : null;

    // Calculate weekly average mood
    const recentMoods = moodLogs.filter((m) => m.timestamp >= oneWeekAgo);
    const avgMood = recentMoods.length > 0 
      ? Number((recentMoods.reduce((sum, item) => sum + item.mood, 0) / recentMoods.length).toFixed(1))
      : null;

    // Suggestions engine
    let suggestion = TRANSLATIONS.support.report.goodMoodTip;
    if (topTrigger === 'syllabus') {
      suggestion = TRANSLATIONS.support.report.lowMoodSyllabusTip;
    } else if (topTrigger === 'sleep') {
      suggestion = TRANSLATIONS.support.report.lowMoodSleepTip;
    } else if (avgMood && avgMood <= 2.5) {
      suggestion = TRANSLATIONS.support.report.lowMoodSyllabusTip;
    }

    // Friendly display friendly name for the top trigger
    const predefinedKeys = Object.keys(TRANSLATIONS.trigger.predefined);
    let topTriggerLabel = topTrigger || 'None';
    if (topTrigger && predefinedKeys.includes(topTrigger)) {
      topTriggerLabel = TRANSLATIONS.trigger.predefined[topTrigger as keyof typeof TRANSLATIONS.trigger.predefined];
    }

    return {
      avgMood,
      topTrigger: topTriggerLabel,
      suggestion,
      triggerFrequency: triggerCounts,
    };
  }, [loggedTriggers, moodLogs]);

  return {
    showCrisisResources,
    weeklyAnalytics,
  };
};
