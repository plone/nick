/**
 * Breadcrumbs tests.
 * @module routes/breadcrumbs/breadcrumbs
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Breadcrumbs', () => {
  it('should return the breadcrumbs', () =>
    testRequest(app, 'breadcrumbs/get'));
});
