/**
 * Authentication tests.
 * @module routes/authentication/authentication
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Authentication', () => {
  it('should handle login', () =>
    testRequest(app, 'authentication/login_post_valid'));

  it('should fail on incorrect credentials', () =>
    testRequest(app, 'authentication/login_post_incorrect'));

  it('should fail on invalid user', () =>
    testRequest(app, 'authentication/login_post_invalid'));

  it('should fail on missing credentials', () =>
    testRequest(app, 'authentication/login_post_missing'));

  it('should handle login-renew with a valid user', () =>
    testRequest(app, 'authentication/login_renew_post_valid'));

  it('should handle login-renew with an invalid user', () =>
    testRequest(app, 'authentication/login_renew_post_invalid'));

  it('should handle logout', () =>
    testRequest(app, 'authentication/logout_post'));
});
