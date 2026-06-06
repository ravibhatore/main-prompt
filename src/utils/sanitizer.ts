/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes input text to prevent XSS vulnerability attacks in journal and custom fields.
 * Uses DOMPurify under-the-hood.
 * @param input Clean or unsafe raw string from user
 * @param maxLength Optional limit to clip inputs to
 * @returns Clean, safe, sanitized string
 */
export const sanitizeInput = (input: string, maxLength?: number): string => {
  if (!input) {
    return '';
  }
  let safeString = DOMPurify.sanitize(input).trim();
  if (maxLength && safeString.length > maxLength) {
    safeString = safeString.slice(0, maxLength);
  }
  return safeString;
};
