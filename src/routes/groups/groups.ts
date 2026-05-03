/**
 * Groups routes.
 * @module routes/groups/groups
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { apiLimiter } from '../../helpers/limiter/limiter';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@groups/:id',
    permission: 'Manage Users',
    client: 'getGroup',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Group = models.get('Group');
      const group = await Group.fetchById(
        req.params.id,
        {
          related: '_roles',
        },
        trx,
      );
      if (!group) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: await group.toJson(req),
        keys: [req.params.id],
      };
    },
  },
  {
    op: 'get',
    view: '/@groups',
    permission: 'Manage Users',
    client: 'getGroups',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Group = models.get('Group');
      const query =
        typeof req.query.query === 'string' ? req.query.query : undefined;
      if (query && query.length < 2) {
        throw new RequestException(400, {
          error: req.i18n('Query must be at least 2 characters long.'),
        });
      }
      const groups = await Group.fetchAll(
        query ? { id: ['like', `%${query}%`] } : {},
        { order: 'title', related: '_roles' },
        trx,
      );
      return {
        json: await groups.toJson(req),
        keys: ['groups'],
      };
    },
  },
  {
    op: 'post',
    view: '/@groups',
    permission: 'Manage Users',
    client: 'createGroup',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Group = models.get('Group');
      const group = await Group.create(
        {
          id: req.body.groupname,
          title: req.body.title,
          description: req.body.description,
          email: req.body.email,
          _roles: req.body.roles,
          _users: req.body.users,
        },
        { related: 'roles' },
        trx,
      );

      // Trigger on after add group
      await config.settings.events.trigger(
        'onAfterAddGroup',
        req.document,
        group,
        trx,
      );

      // Send created
      return {
        status: 201,
        json: await group.toJson(req),
      };
    },
  },
  {
    op: 'patch',
    view: '/@groups/:id',
    permission: 'Manage Users',
    client: 'updateGroup',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Group = models.get('Group');
      const group = await Group.update(
        req.params.id,
        {
          id: req.body.groupname,
          title: req.body.title,
          description: req.body.description,
          email: req.body.email,
          _roles: req.body.roles,
          _users: req.body.users,
        },
        trx,
      );

      // Trigger on after update group
      await config.settings.events.trigger(
        'onAfterUpdateGroup',
        req.document,
        group,
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@groups/:id',
    permission: 'Manage Users',
    client: 'deleteGroup',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Group = models.get('Group');
      if (config.settings.systemGroups.includes(req.params.id)) {
        throw new RequestException(401, {
          error: {
            message: req.i18n('You can’t delete system groups.'),
            type: req.i18n('System group'),
          },
        });
      }

      // Trigger on before delete group
      await config.settings.events.trigger(
        'onBeforeDeleteGroup',
        req.document,
        req.user,
        trx,
        req.params.id,
      );

      await Group.deleteById(req.params.id, trx);

      // Trigger on after delete group
      await config.settings.events.trigger(
        'onAfterDeleteGroup',
        req.document,
        req.user,
        trx,
        req.params.id,
      );

      return {
        status: 204,
      };
    },
  },
];
