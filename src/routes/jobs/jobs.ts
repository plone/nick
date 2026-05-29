/**
 * Jobs routes.
 * @module routes/jobs/jobs
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

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

dayjs.extend(utc);

export default [
  {
    op: 'get',
    view: '/@jobs/:id',
    permission: 'View',
    client: 'getJob',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const job = await Job.fetchById(req.params.id, {}, trx);

      // Check not found
      if (!job) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== job.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      return {
        ...(job.status === 'success'
          ? {
              headers: {
                location: `${getUrl(req)}/@jobs/${req.params.id}/result`,
              },
            }
          : {}),
        json: {
          '@id': `${getUrl(req)}/@jobs/${req.params.id}`,
          ...(await job.toJson(req)),
        },
      };
    },
  },
  {
    op: 'get',
    view: '/@jobs/:id/result',
    permission: 'View',
    client: 'getJobResult',
    cache: 'content',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const job = await Job.fetchById(req.params.id, {}, trx);

      // Check not found
      if (!job) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== job.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      return {
        json: job.result,
      };
    },
  },
  {
    op: 'get',
    view: '/@jobs',
    permission: 'View',
    client: 'getJobs',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const jobs = await Job.fetchAll(
        {},
        { order: { column: 'created', reverse: true } },
        trx,
      );

      // Filter jobs based on permission
      jobs.filter((job: any) => {
        return (
          req.permissions.includes('Manage Site') || req.user.id === job.actor
        );
      });

      return {
        json: await jobs.toJson(req),
      };
    },
  },
  {
    op: 'delete',
    view: '/@jobs/:id',
    permission: 'View',
    client: 'deleteJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const job = await Job.fetchById(req.params.id, {}, trx);

      // Check permission
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== job.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      // Delete job
      await Job.deleteById(req.params.id, trx);

      return {
        status: 204,
      };
    },
  },
  {
    op: 'post',
    view: '/@jobs/:id/abort',
    permission: 'View',
    client: 'abortJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const job = await Job.fetchById(req.params.id, {}, trx);

      // Check permission
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== job.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      // Abort job
      await jobs.abort(req.params.id);

      return {
        status: 204,
      };
    },
  },
  {
    op: 'post',
    view: '/@jobs/:id/retry',
    permission: 'View',
    client: 'retryJob',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Job = models.get('Job');
      const job = await Job.fetchById(req.params.id, {}, trx);
      if (!job) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== job.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      const newUuid = uuid();
      const created = dayjs.utc().format();
      await Job.create(
        {
          uuid: newUuid,
          title: job.title,
          description: job.description,
          params: job.params,
          actor: job.actor,
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

      return {
        status: 204,
      };
    },
  },
];
