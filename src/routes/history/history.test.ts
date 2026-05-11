/**
 * History tests.
 * @module routes/history/history
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('History', () => {
  it('should return the history', () => testRequest(app, 'history/get'));

  it('should return a content object of a specific version', () =>
    testRequest(app, 'history/get_version'));

  it('should revert to a specific version', async () => {
    await testRequest(app, 'content/post');
    await testRequest(app, 'content/patch');
    return testRequest(app, 'history/patch');
  });
});
