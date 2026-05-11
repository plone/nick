/**
 * User schema tests.
 * @module routes/userschema/userschema
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('User schema', () => {
  it('should get the user schema', () => testRequest(app, 'userschema/get'));

  it('should get the registration user schema', () =>
    testRequest(app, 'userschema/registration'));
});
