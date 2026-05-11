/**
 * User tests.
 * @module routes/users/users
 */

// External imports
import { describe, it, afterEach } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('User', () => {
  afterEach(async () => {
    await testRequest(app, 'users/delete');
  });

  it('should get a list of users', () => testRequest(app, 'users/list'));

  it('should get a list of users by query', () =>
    testRequest(app, 'users/list_query'));

  it('should get an error when not logged in', () =>
    testRequest(app, 'users/list_anonymous'));

  it('should get an individual user', () => testRequest(app, 'users/get'));

  it('should not get a user when not logged in', () =>
    testRequest(app, 'users/get_anonymous'));

  it('should not get a user when not found', () =>
    testRequest(app, 'users/get_notfound'));

  it('should add a new user', () => testRequest(app, 'users/post'));

  it('should update a user', async () => {
    await testRequest(app, 'users/post');
    return testRequest(app, 'users/patch');
  });

  it('should delete a user', async () => {
    await testRequest(app, 'users/post');
    return testRequest(app, 'users/delete');
  });

  it('should send a reset password mail', async () => {
    await testRequest(app, 'users/post');
    return testRequest(app, 'users/reset_password_mail');
  });

  it('should reset a password', async () => {
    await testRequest(app, 'users/post');
    return testRequest(app, 'users/reset_password_set');
  });

  it('should set own password', async () => {
    await testRequest(app, 'users/post');
    return testRequest(app, 'users/reset_password_own');
  });
});
