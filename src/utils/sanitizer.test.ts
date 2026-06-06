/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, vi } from 'vitest';
import { sanitizeInput } from './sanitizer';

// Mock DOMPurify as Node environment doesn't have native window APIs
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: (input: string) => {
        if (!input) return '';
        // Mock stripping of script tag
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  };
});

describe('sanitizeInput utility', () => {
  it('should return empty string if input is falsy', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput(null as any)).toBe('');
  });

  it('should trim whitespace from safe inputs', () => {
    expect(sanitizeInput('   My study notes for NEET   ')).toBe('My study notes for NEET');
  });

  it('should sanitize basic HTML and prevent potential script injections', () => {
    const malicious = '<script>alert("hack")</script><b>JEE Revision</b>';
    const safeOutput = sanitizeInput(malicious);
    expect(safeOutput).not.toContain('<script>');
    expect(safeOutput).toContain('<b>JEE Revision</b>');
  });

  it('should enforce maximum length constraints when specified', () => {
    const longInput = 'A very long description about board exam preparation pressure and mock test scores';
    const shortOutput = sanitizeInput(longInput, 15);
    expect(shortOutput.length).toBeLessThanOrEqual(15);
    expect(shortOutput).toBe('A very long des');
  });
});
