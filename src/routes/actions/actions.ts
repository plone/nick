/**
 * Action route.
 * @module routes/actions/actions
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import models from '../../models';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Action = models.get('Action');
  const actions = await Action.fetchAll({}, { order: 'order' }, trx);
  return {
    json: await actions.toJson(req),
  };
};

export default [
  {
    op: 'get',
    view: '/@actions',
    permission: 'View',
    client: 'getActions',
    cache: 'content',
    handler,
  },
];
