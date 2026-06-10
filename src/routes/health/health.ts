/**
 * Health route.
 * @module routes/health/health
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Internal imports
import config from '../../helpers/config/config';
import requests from '../../helpers/requests/requests';
import { getRootUrl } from '../../helpers/url/url';

dayjs.extend(utc);

export default [
  {
    op: 'get',
    view: '/@health',
    permission: 'View',
    client: 'getHealth',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      let status = 'pass';
      let output = '';
      const now = dayjs.utc();

      // Get durations of all requests
      const durations = Object.values(requests.requests).map((request) => {
        const created = dayjs.utc(request.created);
        return now.diff(created, 'seconds');
      });
      const stalled = durations.filter(
        (duration) => duration > config.settings.health.stalled,
      );
      const long_running = durations.filter(
        (duration) => duration > config.settings.health.long_running,
      );

      // Determine health status
      if (stalled.length > 0) {
        status = 'fail';
        output = req.i18n(
          '{count} request(s) taking longer than {duration} seconds',
          { count: stalled.length, duration: config.settings.health.stalled },
        );
      } else if (long_running.length > 0) {
        status = 'warn';
        output = req.i18n(
          '{count} request(s) taking longer than {duration} seconds',
          {
            count: long_running.length,
            duration: config.settings.health.long_running,
          },
        );
      }

      // Return health information
      return {
        json: {
          '@id': `${getRootUrl(req)}/@health`,
          status,
          ...(status !== 'pass' ? { output } : {}),
          checks: {
            uptime: [
              {
                componentType: 'system',
                observedValue: now.diff(dayjs.utc(requests.started), 'seconds'),
                observedUnit: 's',
                status: 'pass',
                time: now.format(),
              },
            ],
          },
        },
      };
    },
  },
];
