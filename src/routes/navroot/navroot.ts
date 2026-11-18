/**
 * Navigation root route.
 * @module routes/navroot/navroot
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { uniq } from 'es-toolkit/array';

// Internal imports
import { getUrl } from '../../helpers/url/url';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  await req.navroot.fetchRelationLists(trx, req);

  return {
    json: {
      '@id': `${getUrl(req)}/@navroot`,
      navroot: await req.navroot.toJson(req),
    },
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
