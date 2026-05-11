/**
 * Context Navigation tests.
 * @module routes/contextnavigation/contextnavigation
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Context Navigation', () => {
  it('should return the context navigation', () =>
    testRequest(app, 'contextnavigation/get'));
});
