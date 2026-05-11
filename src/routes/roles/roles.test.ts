/**
 * Roles tests.
 * @module routes/roles/roles
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Roles', () => {
  it('should get a list of roles', () => testRequest(app, 'roles/get'));
});
