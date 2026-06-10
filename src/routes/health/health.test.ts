/**
 * Health tests.
 * @module routes/health/health
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Health', () => {
  it('should get the health information', () => testRequest(app, 'health/get'));
});
