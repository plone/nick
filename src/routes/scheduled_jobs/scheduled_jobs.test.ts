/**
 * Scheduled Jobs tests.
 * @module routes/scheduled_jobs/scheduled_jobs.test
 */

// External imports
import { describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Scheduled Jobs', () => {
  it('should return the scheduled job actions', () =>
    testRequest(app, 'scheduled_jobs/get_actions'));

  it('should return a scheduled job', () =>
    testRequest(app, 'scheduled_jobs/get'));

  it('should return the scheduled jobs', () =>
    testRequest(app, 'scheduled_jobs/get_all'));

  it('should add a new scheduled job', () =>
    testRequest(app, 'scheduled_jobs/post'));

  it('should start a scheduled job', () =>
    testRequest(app, 'scheduled_jobs/post_start'));

  it('should update a scheduled job', async () => {
    await testRequest(app, 'scheduled_jobs/post');
    return testRequest(app, 'scheduled_jobs/patch');
  });

  it('should delete a scheduled job', async () => {
    await testRequest(app, 'scheduled_jobs/post');
    return testRequest(app, 'scheduled_jobs/delete');
  });
});
