/**
 * Principals routes.
 * @module routes/principals/principals
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import { apiLimiter } from '../../helpers/limiter/limiter';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@principals',
    permission: 'Manage Users',
    client: 'getPrincipals',
    cache: 'manage',
    middleware: apiLimiter,
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');
      const Group = models.get('Group');
      const query =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      if (!query || query.length < 2) {
        throw new RequestException(400, {
          error: req.i18n('Query must be at least 2 characters long.'),
        });
      }
      const users = await User.fetchAll(
        { id: ['like', `%${query}%`] },
        { order: 'fullname', related: '[_roles, _groups]' },
        trx,
      );
      const groups = await Group.fetchAll(
        { id: ['like', `%${query}%`] },
        { order: 'title', related: '_roles' },
        trx,
      );
      return {
        json: {
          users: await users.toJson(req),
          groups: await groups.toJson(req),
        },
        xkeys: ['groups', 'users'],
      };
    },
  },
];
