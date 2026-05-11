/**
 * Locking tests.
 * @module routes/lock/lock
 */

// External imports
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// Internal imports
import app from '../../app';
import * as lock from '../../helpers/lock/lock';
import { testRequest } from '../../helpers/tests/tests';

// Mock lockExpired
vi.spyOn(lock, 'lockExpired').mockReturnValue(false);

describe('Locking', () => {
  beforeEach(async () => {
    await testRequest(app, 'content/post');
  });
  afterEach(async () => {
    await testRequest(app, 'content/delete');
  });

  it('should lock an item', () => testRequest(app, 'locking/post'));

  it('should lock an item with options', () =>
    testRequest(app, 'locking/post_options'));

  it('should delete a lock', async () => {
    await testRequest(app, 'locking/post');
    return testRequest(app, 'locking/delete');
  });

  it('should delete a lock with force', async () => {
    await testRequest(app, 'locking/post');
    return testRequest(app, 'locking/delete_force');
  });

  it('should refresh a lock', async () => {
    await testRequest(app, 'locking/post');
    return testRequest(app, 'locking/patch');
  });

  it('should get lock information', async () => {
    await testRequest(app, 'locking/post');
    return testRequest(app, 'locking/get');
  });

  it('should update a document which is locked', async () => {
    await testRequest(app, 'locking/post');
    return testRequest(app, 'locking/update');
  });
});
