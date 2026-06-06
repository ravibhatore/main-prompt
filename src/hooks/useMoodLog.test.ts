/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock DOMPurify as Node environment doesn't have native window APIs
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: (input: string) => {
        if (!input) return '';
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  };
});

let mockMoodLogs: any[] = [];
const mockAddMoodLog = vi.fn((mood: number, journal: string | null) => {
  mockMoodLogs.push({ mood, journal, date: '2026-06-06' });
});

// Mock the useWellnessStore module
vi.mock('../store/useWellnessStore', () => {
  return {
    useWellnessStore: () => ({
      moodLogs: mockMoodLogs,
      addMoodLog: mockAddMoodLog,
    }),
    getLocalDateString: () => '2026-06-06'
  };
});

// Mock React imports
vi.mock('react', () => {
  return {
    useMemo: (fn: any) => fn(),
    useEffect: (fn: any) => fn(),
  };
});

import { useMoodLog } from './useMoodLog';

describe('useMoodLog Custom Hook', () => {
  beforeEach(() => {
    mockMoodLogs = [];
    mockAddMoodLog.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should compute timeOfDay correct to morning (hours < 12)', () => {
    // Set system time to 10 AM (morning)
    vi.setSystemTime(new Date('2026-06-06T10:00:00.000Z'));
    const hookResult = useMoodLog();
    expect(hookResult.timeOfDay).toBe('morning');
  });

  it('should compute timeOfDay correct to evening (hours >= 12)', () => {
    // Set system time to 4 PM (evening)
    vi.setSystemTime(new Date('2026-06-06T16:00:00.000Z'));
    const hookResult = useMoodLog();
    expect(hookResult.timeOfDay).toBe('evening');
  });

  it('should fail with invalid option mood score bounds', () => {
    const { logMood } = useMoodLog();
    const resultLow = logMood(0, 'invalid mood');
    const resultHigh = logMood(6, 'invalid mood');

    expect(resultLow.success).toBe(false);
    expect(resultLow.error).toBe('Invalid mood value');
    expect(resultHigh.success).toBe(false);
    expect(resultHigh.error).toBe('Invalid mood value');
    expect(mockAddMoodLog).not.toHaveBeenCalled();
  });

  it('should pass and invoke addMoodLog with sliced journal notes', () => {
    const { logMood } = useMoodLog();
    const result = logMood(4, 'Great revision day! '.repeat(50));

    expect(result.success).toBe(true);
    expect(mockAddMoodLog).toHaveBeenCalled();
    const lastCallArg = mockAddMoodLog.mock.calls[0][1];
    expect(lastCallArg?.length).toBeLessThanOrEqual(501);
  });
});
