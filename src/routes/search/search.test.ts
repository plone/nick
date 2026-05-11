/**
 * Search tests.
 * @module routes/search/search
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Search', () => {
  it('should return all items', () => testRequest(app, 'search/get'));

  it('should find the news folder', () => testRequest(app, 'search/get_news'));

  it('should be able to sort results on title', () =>
    testRequest(app, 'search/get_sort_title'));

  it('should be able to sort results on date', () =>
    testRequest(app, 'search/get_sort_date'));

  it('should ignore sort when unknown sort is specified', () =>
    testRequest(app, 'search/get_sort_unknown'));

  it('should be able to sort results reverse', () =>
    testRequest(app, 'search/get_sort_reverse'));

  it('should be able to filter on depth', () =>
    testRequest(app, 'search/get_depth'));

  it('should be able to set batch size', () =>
    testRequest(app, 'search/get_batch'));

  it('should be able to set offset', () =>
    testRequest(app, 'search/get_offset'));

  it('should ignore unknown parameters', () =>
    testRequest(app, 'search/get_unknown'));

  it('should be able to do a querystring search', () =>
    testRequest(app, 'search/post'));
});
