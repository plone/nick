import { describe, it, expect } from 'vitest';
import {
  mapAsync,
  mapSync,
  uniqueId,
  removeUndefined,
  arrayToVocabulary,
  objectToVocabulary,
  isPromise,
  regExpEscape,
  getNodeVersion,
  stripNewlines,
  bytesToNumber,
} from './utils';

describe('utils', () => {
  describe('mapAsync', () => {
    it('maps async in order', async () => {
      const result = await mapAsync([1, 2, 3], async (item) => item * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('returns empty array for empty input', async () => {
      const result = await mapAsync([], async () => {});
      expect(result).toEqual([]);
    });
  });

  describe('mapSync', () => {
    it('maps sync through array', () => {
      const result: number[] = [];
      mapSync([1, 2, 3], (item) => result.push(item * 2));
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('uniqueId', () => {
    it('returns id if unique', () => {
      expect(uniqueId('test', ['other'])).toBe('test');
    });

    it('appends counter if not unique', () => {
      expect(uniqueId('test', ['test', 'other'])).toBe('test-1');
    });

    it('increments counter until unique', () => {
      expect(uniqueId('test', ['test', 'test-1', 'test-2'])).toBe('test-3');
    });
  });

  describe('removeUndefined', () => {
    it('removes undefined values', () => {
      expect(removeUndefined({ a: 1, b: undefined, c: 'test' })).toEqual({
        a: 1,
        c: 'test',
      });
    });

    it('returns empty object when all undefined', () => {
      expect(removeUndefined({ a: undefined })).toEqual({});
    });
  });

  describe('arrayToVocabulary', () => {
    it('converts string array to vocabulary terms', () => {
      expect(arrayToVocabulary(['a', 'b'])).toEqual([
        { title: 'a', token: 'a' },
        { title: 'b', token: 'b' },
      ]);
    });
  });

  describe('objectToVocabulary', () => {
    it('converts object to vocabulary terms', () => {
      expect(objectToVocabulary({ key: 'Value' })).toEqual([
        { title: 'Value', token: 'key' },
      ]);
    });
  });

  describe('isPromise', () => {
    it('returns true for promise', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
    });

    it('returns false for non-promise', () => {
      expect(isPromise({})).toBe(false);
    });
  });

  describe('regExpEscape', () => {
    it('escapes special regex characters', () => {
      expect(regExpEscape('a.b[c]')).toBe('a\\.b\\[c\\]');
    });
  });

  describe('getNodeVersion', () => {
    it('returns node version', () => {
      expect(getNodeVersion()).toBe(process.version);
    });
  });

  describe('stripNewlines', () => {
    it('removes newlines', () => {
      expect(stripNewlines('a\nb\rc\r\nd')).toBe('abcd');
    });
  });

  describe('bytesToNumber', () => {
    it('converts KB to bytes', () => {
      expect(bytesToNumber('1 KB')).toBe(1024);
    });

    it('converts MB to bytes', () => {
      expect(bytesToNumber('1 MB')).toBe(1024 ** 2);
    });

    it('returns number for plain string', () => {
      expect(bytesToNumber('512')).toBe(512);
    });

    it('returns 0 for invalid string', () => {
      expect(bytesToNumber('invalid')).toBe(0);
    });

    it('returns value for unknown unit', () => {
      expect(bytesToNumber('5 xb')).toBe(5);
    });
  });
});
