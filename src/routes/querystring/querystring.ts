/**
 * Action route.
 * @module routes/actions/actions
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import { getUrl } from '../../helpers/url/url';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@querystring',
    permission: 'View',
    client: 'getQuerystring',
    cache: 'static',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Index = models.get('Index');

      // Get all enabled indexes
      const indexes = await Index.fetchAll(
        { enabled: true, metadata: false },
        { order: 'title' },
        trx,
      );

      // Get all enabled and sortable indexes
      const sortableIndexes = await Index.fetchAll(
        { sortable: true, enabled: true, metadata: false },
        { order: 'title' },
        trx,
      );

      // Return data
      return {
        json: {
          '@id': `${getUrl(req)}/@querystring`,
          indexes: await indexes.toJson(req),
          sortable_indexes: await sortableIndexes.toJson(req),
        },
      };
    },
  },
];
