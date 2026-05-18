/**
 * Navigation root route.
 * @module routes/navroot/navroot
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { uniq } from 'es-toolkit/array';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  await req.navroot.fetchChildren({}, trx);
  await req.navroot.fetchRelationLists(trx);

  return {
    json: await req.navroot.toJson(req),
    xkeys: uniq([req.document.uuid, req.navroot.uuid]),
  };
};

export default [
  {
    op: 'get',
    view: '/@navroot',
    permission: 'View',
    client: 'getNavroot',
    cache: 'content',
    handler,
  },
];
