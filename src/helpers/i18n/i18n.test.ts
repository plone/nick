/**
 * I18n helper tests.
 * @module helpers/i18n/i18n.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import { stripI18n } from './i18n';

describe('I18n', () => {
  it('should strip i18n tags from an array', () =>
    expect(stripI18n([{ 'title:i18n': 'News' }])).toEqual([{ title: 'News' }]));

  it('should strip i18n tags from an object', () =>
    expect(stripI18n({ 'title:i18n': 'News' })).toEqual({ title: 'News' }));

  it('should strip i18n tags from an nested object', () =>
    expect(stripI18n({ parent: { 'title:i18n': 'News' } })).toEqual({
      parent: {
        title: 'News',
      },
    }));

  it('should ignore a string object', () =>
    expect(stripI18n('News')).toBe('News'));
});
