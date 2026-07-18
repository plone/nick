/**
 * Scheduled jobs routes.
 * @module routes/scheduled_jobs/scheduled_jobs
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuid } from 'uuid';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import jobs from '../../helpers/jobs/jobs';
import { apiLimiter } from '../../helpers/limiter/limiter';
import { getUrl } from '../../helpers/url/url';
import models from '../../models';
import scheduledJobs from '../../scheduled_jobs';

dayjs.extend(utc);

export default [
  {
    op: 'get',
    view: '/@scheduled-job-actions',
    permission: 'Manage Site',
    client: 'getScheduledJobActions',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, _trx: Knex.Transaction) => {
      return {
        json: scheduledJobs.getActions(req),
      };
    },
  },
  {
    op: 'get',
    view: '/@scheduled-jobs/:id',
    permission: 'Manage Site',
    client: 'getScheduledJob',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      const scheduledJob = await ScheduledJob.fetchById(req.params.id, {}, trx);
      if (!scheduledJob) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: {
          '@id': `${getUrl(req)}/@scheduled-jobs/${scheduledJob.id}`,
          ...(await scheduledJob.toJson(req)),
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@scheduled-jobs/:id/start',
    permission: 'Manage Site',
    client: 'startScheduledJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      const scheduledJob = await ScheduledJob.fetchById(req.params.id, {}, trx);
      if (!scheduledJob) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      const Job = models.get('Job');
      const newUuid = uuid();
      const created = dayjs.utc().format();
      await Job.create(
        {
          uuid: newUuid,
          title: scheduledJob.title,
          description: scheduledJob.description,
          params: {
            scheduled_job: scheduledJob.id,
            action: scheduledJob.action,
            ...scheduledJob.params,
          },
          actor: req.user.id,
          created,
          started: null,
          finished: null,
          status: 'created',
          result: {},
        },
        {},
        trx,
      );

      // Check if job needs to be ran
      await jobs.check(trx);

      return {
        status: 204,
      };
    },
  },
  {
    op: 'get',
    view: '/@scheduled-jobs',
    permission: 'Manage Site',
    client: 'getScheduledJobs',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      const scheduledJobs = await ScheduledJob.fetchAll(
        {},
        { order: 'title' },
        trx,
      );
      return {
        json: await scheduledJobs.toJson(req),
      };
    },
  },
  {
    op: 'post',
    view: '/@scheduled-jobs',
    permission: 'Manage Site',
    client: 'createScheduledJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      const scheduledJob = await ScheduledJob.create(
        {
          id: req.body.id,
          title: req.body.title,
          description: req.body.description,
          action: req.body.action,
          params: req.body.params || {},
          schedule: req.body.schedule || '0 0 * * *',
          enabled: req.body.enabled ?? true,
        },
        {},
        trx,
      );

      // Refresh tasks
      await scheduledJobs.refreshTasks(trx);

      // Send created
      return {
        status: 201,
        json: {
          '@id': `${getUrl(req)}/@scheduled-jobs/${scheduledJob.id}`,
          ...(await scheduledJob.toJson(req)),
        },
      };
    },
  },
  {
    op: 'patch',
    view: '/@scheduled-jobs/:id',
    permission: 'Manage Site',
    client: 'updateScheduledJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      await ScheduledJob.update(
        req.params.id,
        {
          id: req.body.id,
          title: req.body.title,
          description: req.body.description,
          action: req.body.action,
          params: req.body.params || {},
          schedule: req.body.schedule || '0 0 * * *',
          enabled: req.body.enabled ?? true,
        },
        trx,
      );

      // Refresh tasks
      await scheduledJobs.refreshTasks(trx);

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@scheduled-jobs/:id',
    permission: 'Manage Site',
    client: 'deleteScheduledJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ScheduledJob = models.get('ScheduledJob');
      await ScheduledJob.deleteById(req.params.id, trx);

      // Refresh tasks
      await scheduledJobs.refreshTasks(trx);

      return {
        status: 204,
      };
    },
  },
];
