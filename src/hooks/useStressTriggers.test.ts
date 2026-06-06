/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock DOMPurify
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

let mockLoggedTriggers: any[] = [];
const mockAddStressTrigger = vi.fn((categories: string[], customTrigger: string | undefined) => {
  mockLoggedTriggers.push({
    categories,
    customTrigger,
    date: '2026-06-06',
    timestamp: Date.now(),
  });
});

// Mock store
vi.mock('../store/useWellnessStore', () => {
  return {
    useWellnessStore: () => ({
      loggedTriggers: mockLoggedTriggers,
      addStressTrigger: mockAddStressTrigger,
    }),
    getLocalDateString: (d?: Date) => {
      const date = d || new Date();
      // Simple yyyy-mm-dd converter
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
  };
});

// Mock React imports
vi.mock('react', () => {
  return {
    useMemo: (fn: any) => fn(),
    useEffect: (fn: any) => fn(),
  };
});

import { useStressTriggers } from './useStressTriggers';

describe('useStressTriggers Custom Hook', () => {
  beforeEach(() => {
    mockLoggedTriggers = [];
    mockAddStressTrigger.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should get todayTriggerLog if present', () => {
    mockLoggedTriggers.push({
      date: '2026-06-06',
      categories: ['syllabus'],
      customTrigger: 'Big Mock Exam',
    });

    const { todayTriggerLog } = useStressTriggers();
    expect(todayTriggerLog).toBeDefined();
    expect(todayTriggerLog?.categories).toContain('syllabus');
  });

  it('should save triggers with sanitized custom inputs', () => {
    const { logTriggers } = useStressTriggers();
    const result = logTriggers(['sleep'], 'Testing trigger with script <script>alert("hi")</script>');

    expect(result.success).toBe(true);
    expect(mockAddStressTrigger).toHaveBeenCalled();
    const mockArg1 = mockAddStressTrigger.mock.calls[0][1];
    expect(mockArg1).not.toContain('<script>');
  });

  it('should generate continuous 30-day calendar heatmap structure correctly', () => {
    // Save trigger log for today and 2 days ago
    mockLoggedTriggers.push({
      date: '2026-06-06',
      categories: ['syllabus', 'peer'],
      timestamp: Date.now(),
    });
    // today is 2026-06-06, so 2 days ago is 2026-06-04
    mockLoggedTriggers.push({
      date: '2026-06-04',
      categories: ['sleep'],
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });

    const { heatmapData } = useStressTriggers();
    // Heatmap should have exactly 30 entries
    expect(heatmapData).toHaveLength(30);

    // Filter down to dates with triggers
    const todayData = heatmapData.find(item => item.date === '2026-06-06');
    const twoDaysAgoData = heatmapData.find(item => item.date === '2026-06-04');

    expect(todayData?.count).toBe(2);
    expect(twoDaysAgoData?.count).toBe(1);
    expect(twoDaysAgoData?.categories).toContain('sleep');
  });
});
