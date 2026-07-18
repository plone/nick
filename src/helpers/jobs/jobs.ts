/**
 * A jobs helper.
 * @module helpers/jobs/jobs
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { fork } from 'node:child_process';
import { v4 as uuid } from 'uuid';

// Internal imports
import models from '../../models';

dayjs.extend(utc);

/**
 * A job helper.
 * @class Jobs
 */
class Jobs {
  public worker: any;
  public uuid: string;
  static instance: Jobs;

  /**
   * Construct a Jobs helper.
   * @constructs Jobs
   */
  constructor() {
    this.worker = undefined;
    this.uuid = '';

    if (!Jobs.instance) {
      Jobs.instance = this;
    }

    return Jobs.instance;
  }

  /**
   * Add job.
   */
  async add(
    title: string,
    description: string,
    params: any,
    actor: string,
    trx: Knex.Transaction,
  ): Promise<string> {
    const newUuid = uuid();
    const created = dayjs.utc().format();

    // Create job
    const Job = models.get('Job');
    await Job.create(
      {
        uuid: newUuid,
        title: title,
        description: description,
        params: params,
        actor: actor,
        created,
        started: null,
        finished: null,
        status: 'created',
        result: {},
      },
      {},
      trx,
    );

    await jobs.check(trx);

    return newUuid;
  }

  /**
   * Check jobs.
   */
  async check(trx?: Knex.Transaction): Promise<void> {
    const self: any = this;

    // Get job
    const Job = models.get('Job');
    const job = await Job.fetchOne(
      { started: null },
      { order: { column: 'created', reverse: true } },
      trx,
    );

    // Exit if no jobs
    if (!job) {
      return;
    }

    // Set job to started
    const started = dayjs.utc().format();
    await Job.update(
      job.uuid,
      {
        status: 'started',
        started,
      },
      trx,
    );

    // Start job
    self.uuid = job.uuid;
    self.worker = fork('./scripts/job.ts', [], {
      execArgv: ['--import', 'tsx'],
    });
    self.worker.send(job.params);
    self.worker.on('message', async (data: any) => {
      const finished = dayjs.utc().format();
      await Job.update(self.uuid, {
        status: 'completed',
        finished,
        result: data,
      });
      await self.check();
    });
  }

  /**
   * Abort a job.
   * @param {string} uuid The uuid of the job
   */
  async abort(uuid: string): Promise<void> {
    if (!this.worker || this.uuid !== uuid) {
      return;
    }

    // Abort job
    this.worker.send({ exit: true });
    this.worker = undefined;
    this.uuid = '';

    // Update db
    const finished = dayjs.utc().format();
    const Job = models.get('Job');
    await Job.update(uuid, {
      status: 'aborted',
      finished,
    });
    await this.check();
  }
}

// Create an instance of the Jobs helper
const jobs = new Jobs();

// Export the instance
export default jobs;
