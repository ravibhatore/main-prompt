/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import CryptoJS from 'crypto-js';

// Lazily initialize or retrieve a machine-local encryption key.
// This prevents hardcoded keys in the bundle while securing local data against raw browser level inspection.
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('__companion_enc_key__');
  if (!key) {
    key = CryptoJS.lib.WordArray.random(16).toString();
    localStorage.setItem('__companion_enc_key__', key);
  }
  return key;
};

/**
 * Encrypts and saves item inside localStorage
 * @param key LocalStorage location key
 * @param data Clean typescript object to persist
 */
export const saveEncrypted = (key: string, data: unknown): void => {
  try {
    const rawString = JSON.stringify(data);
    const secret = getEncryptionKey();
    const cipherText = CryptoJS.AES.encrypt(rawString, secret).toString();
    localStorage.setItem(key, cipherText);
  } catch (error) {
    console.error('Encryption / Storage failed:', error);
  }
};

/**
 * Retrieves and decrypts the requested storage entry
 * @param key LocalStorage location key
 * @returns Decrypted object or null if invalid or not found
 */
export const loadDecrypted = <T>(key: string): T | null => {
  try {
    const cipherText = localStorage.getItem(key);
    if (!cipherText) {
      return null;
    }
    const secret = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(cipherText, secret);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      return null;
    }
    return JSON.parse(decryptedText) as T;
  } catch (error) {
    console.error('Decryption / Loading failed:', error);
    return null;
  }
};
