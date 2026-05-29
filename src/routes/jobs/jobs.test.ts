/**
 * Jobs tests.
 * @module routes/jobs/jobs.test
 */

// External imports
import { afterEach, beforeEach, describe, it } from 'vitest';

// Internal imports
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';
import models from '../../models';

describe('Jobs', () => {
  beforeEach(() => {
    // Add a job to the database to test against
    const Job = models.get('Job');
    return Job.create(
      {
        uuid: 'a2fe7e07-d54b-435b-9cb0-e12f1f80a589',
        title: 'Reindex Events',
        description: 'Reindex all events',
        params: {
          scheduled_job: 'reindex-events',
          action: 'reindex',
          type: 'Event',
        },
        actor: 'admin',
        created: '2022-04-02T20:00:00.000Z',
        started: null,
        finished: null,
        status: 'created',
        result: {},
      },
      {},
    );
  });

  afterEach(() => {
    // Clear the jobs from the database
    const Job = models.get('Job');
    return Job.deleteById('a2fe7e07-d54b-435b-9cb0-e12f1f80a589');
  });

  it('should return a job', () => testRequest(app, 'jobs/get'));

  it('should return the jobs', () => testRequest(app, 'jobs/get_all'));

  it('should delete a job', async () => testRequest(app, 'jobs/delete'));
});
