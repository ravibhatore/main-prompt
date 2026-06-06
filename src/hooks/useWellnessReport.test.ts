/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let mockMoodLogs: any[] = [];
let mockLoggedTriggers: any[] = [];

// Mock the store
vi.mock('../store/useWellnessStore', () => {
  return {
    useWellnessStore: () => ({
      moodLogs: mockMoodLogs,
      loggedTriggers: mockLoggedTriggers,
    }),
  };
});

// Mock React imports
vi.mock('react', () => {
  return {
    useMemo: (fn: any) => fn(),
    useEffect: (fn: any) => fn(),
  };
});

import { useWellnessReport } from './useWellnessReport';

describe('useWellnessReport Custom Hook', () => {
  beforeEach(() => {
    mockMoodLogs = [];
    mockLoggedTriggers = [];
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not show crisis resources when history has fewer than 3 logs', () => {
    mockMoodLogs = [
      { date: '2026-06-06', mood: 1, timestamp: Date.now() },
      { date: '2026-06-05', mood: 1, timestamp: Date.now() - 24 * 60 * 60 * 1000 },
    ];

    const { showCrisisResources } = useWellnessReport();
    expect(showCrisisResources).toBe(false);
  });

  it('should show crisis resources if 3 consecutive calendar days are <= 2 mood', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    mockMoodLogs = [
      { date: '2026-06-06', mood: 2, timestamp: Date.now() },
      { date: '2026-06-05', mood: 1, timestamp: Date.now() - oneDay },
      { date: '2026-06-04', mood: 2, timestamp: Date.now() - 2 * oneDay },
    ];

    const { showCrisisResources } = useWellnessReport();
    expect(showCrisisResources).toBe(true);
  });

  it('should not show crisis resources if mood <= 2 logs are not consecutive calendar days', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    mockMoodLogs = [
      { date: '2026-06-06', mood: 1, timestamp: Date.now() },
      { date: '2026-06-04', mood: 2, timestamp: Date.now() - 2 * oneDay },
      { date: '2026-06-02', mood: 1, timestamp: Date.now() - 4 * oneDay },
    ];

    const { showCrisisResources } = useWellnessReport();
    expect(showCrisisResources).toBe(false);
  });

  it('should compute weekly analytics average mood and select top trigger correctly', () => {
    const nowStamp = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    mockMoodLogs = [
      { date: '2026-06-06', mood: 4, timestamp: nowStamp },
      { date: '2026-06-05', mood: 3, timestamp: nowStamp - oneDay },
      // log older than a week (should be ignored in weekly averages)
      { date: '2026-05-15', mood: 1, timestamp: nowStamp - 15 * oneDay },
    ];

    mockLoggedTriggers = [
      {
        categories: ['syllabus', 'sleep'],
        timestamp: nowStamp - 500,
      },
      {
        categories: ['syllabus'],
        timestamp: nowStamp - oneDay - 500,
      },
      // older trigger
      {
        categories: ['peer'],
        timestamp: nowStamp - 20 * oneDay,
      }
    ];

    const { weeklyAnalytics } = useWellnessReport();
    expect(weeklyAnalytics.avgMood).toBe(3.5); // (4 + 3) / 2
    expect(weeklyAnalytics.topTrigger).toBe('Syllabus Backlog & Overwhelm'); // predefined key translations
    expect(weeklyAnalytics.suggestion).toBeDefined();
  });
});
