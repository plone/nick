/**
 * Utils.
 * @module helpers/utils/utils
 */

import { omitBy } from 'es-toolkit/object';
import type { VocabularyTerm } from '../../types';

/**
 * Map asynchronous but in order through array
 * @method mapAsync
 * @param {Array} array Array to be looped over
 * @param {function} callback Callback function
 * @returns {Promise} Promise which returns when all callbacks are done
 */
export async function mapAsync<Item>(
  array: Item[],
  callback: (item: Item, index: number) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i);
  }
}

/**
 * Map synchronous through array
 * @method mapSync
 * @param {Array} array Array to be looped over
 * @param {function} callback Callback function
 */
export function mapSync<Item>(
  array: Item[],
  callback: (item: Item, index: number) => void,
): void {
  for (let i = 0; i < array.length; i++) {
    callback(array[i], i);
  }
}

/**
 * Create a unique id
 * @method uniqueId
 * @param {String} id Base id.
 * @param {Array<String>} ids Array of sibling ids.
 * @param {Number} counter Current iteration.
 * @returns {String} Unique id.
 */
export function uniqueId(id: string, ids: string[], counter = 0): string {
  const newId = counter === 0 ? id : `${id}-${counter}`;
  return ids.indexOf(newId) === -1 ? newId : uniqueId(id, ids, counter + 1);
}

/**
 * Remove undefined
 * @method removeUndefined
 * @param {Object} object Object to remove undefined values from.
 * @returns {Object} Cleaned up object.
 */
export function removeUndefined<T extends object>(object: T): Partial<T> {
  return omitBy(object, (value) => typeof value === 'undefined');
}

/**
 * Convert array to vocabulary
 * @method arrayToVocabulary
 * @param {Array} items Items to be converted
 * @returns {Array} Array of terms
 */
export function arrayToVocabulary(items: string[]): VocabularyTerm[] {
  return items.map((item) => ({
    title: item,
    token: item,
  }));
}

/**
 * Convert object to vocabulary
 * @method objectToVocabulary
 * @param {Object} items Items to be converted
 * @returns {Array} Array of terms
 */
export function objectToVocabulary(items: {
  [key: string]: string;
}): VocabularyTerm[] {
  return Object.keys(items).map((key) => ({
    title: items[key],
    token: key,
  }));
}

/**
 * Checks if variable is a promise
 * @method isPromise
 * @param {*} variable Variable to be checked
 * @returns {boolean} True if variable is a promise
 */
export function isPromise(variable: any): boolean {
  return typeof variable === 'object' && typeof variable.then === 'function';
}

/**
 * Escape string to be usable for regexps
 * @method regExpEscape
 * @param {String} string Input string
 * @returns {String} Escaped string
 */
export function regExpEscape(string: string): string {
  return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Get the node version
 * @method getNodeVersion
 * @param {String} string Input string
 * @returns {String} Node version
 */
export function getNodeVersion(): string {
  return process.version;
}

/**
 * Strip newlines from string
 * @method stripNewlines
 * @param {String} string Input string
 * @returns {String} String without newlines
 */
export function stripNewlines(string: string): string {
  return string.replace(/\r\n|\n|\r/gm, '');
}

/**
 * Convert string with bytes to number
 * @param bytes Input string
 * @returns Values in bytes
 */
export function bytesToNumber(bytes: string): number {
  const units: { [key: string]: number } = {
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  // Match number and unit
  const match = bytes.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);

  if (!match) return parseFloat(bytes) || 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return units[unit] ? value * units[unit] : value;
}
