/**
 * Actions tests.
 * @module routes/actions/actions
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Actions', () => {
  it('should get actions as anonymous', () =>
    testRequest(app, 'actions/get_anonymous'));

  it('should get actions as authenticated', () =>
    testRequest(app, 'actions/get_authenticated'));
});
