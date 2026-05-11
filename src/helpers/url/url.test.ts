/**
 * Url helper tests.
 * @module helpers/url/url.test
 */

// Type imports
import type { Request } from '../../types';

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
import { getUrl, getRootUrl, getUrlByPath, getPath, stripPath } from './url';

describe('Url', () => {
  it('should get the url of a document', () =>
    expect(
      getUrl({
        apiPath: 'http://localhost:8080',
        document: { path: '/news' },
      } as Request),
    ).toBe('http://localhost:8080/news'));

  it('should get the url of the root', () =>
    expect(
      getUrl({
        apiPath: 'http://localhost:8080',
        document: { path: '/' },
      } as Request),
    ).toBe('http://localhost:8080'));

  it('should get the root url', () =>
    expect(
      getRootUrl({
        apiPath: 'http://localhost:8080',
      } as Request),
    ).toBe('http://localhost:8080'));

  it('should get the url by path', () =>
    expect(
      getUrlByPath({ apiPath: 'http://localhost:8080' } as Request, '/news'),
    ).toBe('http://localhost:8080/news'));

  it('should get the url by root path', () =>
    expect(
      getUrlByPath({ apiPath: 'http://localhost:8080' } as Request, '/'),
    ).toBe('http://localhost:8080'));

  it('should get the path', () =>
    expect(getPath({ documentPath: '/api/news' } as Request)).toBe(
      '/api/news',
    ));

  it('should strip the path', () =>
    expect(stripPath('/api/news')).toBe('/api/news'));
});
