/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll } from 'vitest';

// Define globally mock objects at module evaluation time
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-1234',
    },
    writable: true,
  });
} else if (!global.crypto.randomUUID) {
  Object.defineProperty(global.crypto, 'randomUUID', {
    value: () => 'mock-uuid-1234',
    writable: true,
  });
}

// Setup mock for global fetch
const fetchMock = vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: { moodLogs: [] } }),
  })
);
vi.stubGlobal('fetch', fetchMock);

let useWellnessStore: any;
let getLocalDateString: any;

describe('Zustand Wellness Store', () => {
  beforeAll(async () => {
    const storeModule = await import('./useWellnessStore');
    useWellnessStore = storeModule.useWellnessStore;
    getLocalDateString = storeModule.getLocalDateString;
  });

  beforeEach(() => {
    localStorageMock.clear();
    fetchMock.mockClear();
    // Reset state values manually before running each test
    useWellnessStore.getState().resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with standard default values', () => {
    const state = useWellnessStore.getState();
    expect(state.moodLogs).toEqual([]);
    expect(state.loggedTriggers).toEqual([]);
    expect(state.reflections).toEqual([]);
    expect(state.streakCount).toBe(0);
    expect(state.lastReflectedDate).toBeNull();
    expect(state.selectedExams).toEqual(['NEET', 'JEE', 'Boards']);
  });

  it('should add mood logs and filter any duplicate dates', () => {
    const store = useWellnessStore.getState();
    store.addMoodLog(4, 'Feeling focused on physics NCERT formulas today!');
    
    const updatedState = useWellnessStore.getState();
    expect(updatedState.moodLogs).toHaveLength(1);
    expect(updatedState.moodLogs[0].mood).toBe(4);
    expect(updatedState.moodLogs[0].journal).toBe('Feeling focused on physics NCERT formulas today!');

    // Duplicate logs for exact same date (today) must override the previous entry
    store.addMoodLog(5, 'Feeling even better!');
    const finalState = useWellnessStore.getState();
    expect(finalState.moodLogs).toHaveLength(1);
    expect(finalState.moodLogs[0].mood).toBe(5);
    expect(finalState.moodLogs[0].journal).toBe('Feeling even better!');
    
    // Verifying server sync was triggered
    expect(fetchMock).toHaveBeenCalled();
  });

  it('should add stress triggers correctly', () => {
    const store = useWellnessStore.getState();
    store.addStressTrigger(['mock_test', 'syllabus'], 'Stressed about CAT mock paper scores');
    
    const updatedState = useWellnessStore.getState();
    expect(updatedState.loggedTriggers).toHaveLength(1);
    expect(updatedState.loggedTriggers[0].categories).toContain('mock_test');
    expect(updatedState.loggedTriggers[0].customTrigger).toBe('Stressed about CAT mock paper scores');
  });

  it('should handle reflections and build streaks appropriately', () => {
    const store = useWellnessStore.getState();
    const today = getLocalDateString();
    
    // Day 1 Reflection
    store.addReflection('Chemistry formulas', 'Revision sets', 'Solve NEET mock papers');
    let state = useWellnessStore.getState();
    expect(state.reflections).toHaveLength(1);
    expect(state.streakCount).toBe(1);
    expect(state.lastReflectedDate).toBe(today);

    // Duplicate reflection today keeps streak 1 and replaces reflection log
    store.addReflection('Chemistry formulas updated', 'Revision', 'Tackle remaining mocks');
    state = useWellnessStore.getState();
    expect(state.reflections).toHaveLength(1);
    expect(state.streakCount).toBe(1);
  });

  it('should be able to change target exam preparation checklists', () => {
    const store = useWellnessStore.getState();
    store.setSelectedExams(['UPSC', 'GATE']);
    
    const state = useWellnessStore.getState();
    expect(state.selectedExams).toEqual(['UPSC', 'GATE']);
  });

  it('should successfully sync and load state from server-side database', async () => {
    const mockServerData = {
      success: true,
      data: {
        moodLogs: [
          {
            id: 'mock-server-log',
            date: '2026-06-05',
            mood: 5,
            journal: 'From Server Database Mock',
            timestamp: 1717618800000,
          },
        ],
        loggedTriggers: [],
        reflections: [],
        streakCount: 3,
        lastReflectedDate: '2026-06-05',
        selectedExams: ['Boards', 'CUET'],
      },
    };

    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockServerData),
      })
    );

    const store = useWellnessStore.getState();
    await store.loadFromServer();

    const state = useWellnessStore.getState();
    expect(state.moodLogs).toHaveLength(1);
    expect(state.moodLogs[0].id).toBe('mock-server-log');
    expect(state.streakCount).toBe(3);
    expect(state.selectedExams).toEqual(['Boards', 'CUET']);
  });
});

