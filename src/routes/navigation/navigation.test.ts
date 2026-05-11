/**
 * Navigation tests.
 * @module routes/navigation/navigation
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Navigation', () => {
  it('should return the navigation', () => testRequest(app, 'navigation/get'));
});
