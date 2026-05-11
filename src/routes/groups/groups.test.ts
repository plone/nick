/**
 * Groups tests.
 * @module routes/groups/groups
 */

// External imports
import { afterEach, describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Groups', () => {
  afterEach(async () => {
    await testRequest(app, 'groups/delete');
  });

  it('should get a list of groups', () => testRequest(app, 'groups/list'));

  it('should get a list of groups by query', () =>
    testRequest(app, 'groups/list_query'));

  it('should get an error when not logged in', () =>
    testRequest(app, 'groups/list_anonymous'));

  it('should get an individual group', () => testRequest(app, 'groups/get'));

  it('should not get a group when not logged in', () =>
    testRequest(app, 'groups/get_anonymous'));

  it('should not get a group when not found', () =>
    testRequest(app, 'groups/get_notfound'));

  it('should add a new group', () => testRequest(app, 'groups/post'));

  it('should update a group', async () => {
    await testRequest(app, 'groups/post');
    return testRequest(app, 'groups/patch');
  });

  it('should delete a group', async () => {
    await testRequest(app, 'groups/post');
    return testRequest(app, 'groups/delete');
  });
});
