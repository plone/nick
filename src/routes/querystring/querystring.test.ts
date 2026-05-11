/**
 * Querystring tests.
 * @module routes/querystring/querystring
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Querystring', () => {
  it('should return the querystring', () =>
    testRequest(app, 'querystring/get'));
});
