/**
 * Principals tests.
 * @module routes/principals/principals
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Principals', () => {
  it('should get a list of principals', () =>
    testRequest(app, 'principals/list'));
});
