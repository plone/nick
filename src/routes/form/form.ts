/**
 * Form routes.
 * @module routes/form/form
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import { Request } from '../../types';

export default [
  {
    op: 'post',
    view: '/@schemaform-data',
    permission: 'View',
    client: 'schemaformData',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      return {
        json: {},
      };
    },
  },
];
