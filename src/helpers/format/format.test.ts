/**
 * Format helper tests.
 * @module helpers/format/format.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import { formatSize, formatAttribute, formatTemplate } from './format';

describe('Format', () => {
  describe('formatSize', () => {
    it('should format size for bytes', () =>
      expect(formatSize(124)).toBe('124 B'));

    it('should format size for kilo bytes', () =>
      expect(formatSize(2000)).toBe('2 KB'));
  });

  describe('formatAttribute', () => {
    it('should format an attribute', () =>
      expect(formatAttribute('test')).toBe('"test"'));

    it('should format an attribute with dotted name', () =>
      expect(formatAttribute('test.test')).toBe('"test"."test"'));

    it('should format an attribute with json attribute', () =>
      expect(formatAttribute('test->>"test"')).toBe('test->>"test"'));

    it('should format an attribute with a function', () =>
      expect(formatAttribute('test->>"test"')).toBe('test->>"test"'));
  });

  describe('formatTemplate', () => {
    it('should replace a single variable', () =>
      expect(formatTemplate('Hello, \${name}!', { name: 'World' })).toBe(
        'Hello, World!',
      ));

    it('should replace multiple variables', () =>
      expect(
        formatTemplate('\${first} \${last}', { first: 'John', last: 'Doe' }),
      ).toBe('John Doe'));

    it('should leave non existing variables', () =>
      expect(formatTemplate('\${first} \${last}', { first: 'John' })).toBe(
        'John ${last}',
      ));
  });
});
