/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveEncrypted, loadDecrypted } from './crypto';

// Setup Mock LocalStorage
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

describe('local storage encryption and decryption', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should encrypt and successfully decrypt stored structures', () => {
    const testData = {
      streakCount: 5,
      activeTarget: ['JEE', 'Boards']
    };
    
    saveEncrypted('test_key', testData);
    
    // Check that directly looking at local storage yields raw encrypted (non-plain text) data
    const rawInStorage = localStorage.getItem('test_key');
    expect(rawInStorage).not.toBeNull();
    expect(rawInStorage).not.toContain('streakCount');
    expect(rawInStorage).not.toContain('activeTarget');

    // Decrypt and assert equality
    const loadedData = loadDecrypted<typeof testData>('test_key');
    expect(loadedData).toEqual(testData);
  });

  it('should return null if key does not exist', () => {
    const result = loadDecrypted('non_existent_key');
    expect(result).toBeNull();
  });
});
