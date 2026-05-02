/**
 * Context navigation routes.
 * @module routes/contextnavigation/contextnavigation
 */

import models from '../../models';
import { getUrl } from '../../helpers/url/url';
import { mapAsync } from '../../helpers/utils/utils';
import type { Request } from '../../types';
import type { Knex } from 'knex';

async function getItems(
  parentUuid: string,
  displayed_types: string[],
  depth: number,
  maxDepth: number,
  req: Request,
  trx: Knex.Transaction,
): Promise<any[]> {
  const Catalog = models.get('Catalog');

  // Fetch items
  const items = await Catalog.fetchAllRestricted(
    { _parent: parentUuid },
    { order: '_getObjPositionInParent' },
    trx,
    req,
  );

  // Omit exclude from nav items
  items.filter((item: any) => !item.exclude_from_nav);

  // Omit by type
  items.filter((item: any) => displayed_types.includes(item.Type));

  // Get output
  const output = await items.toJson(req);

  await mapAsync(output, async (item: any) => {
    item.items =
      depth < maxDepth - 1
        ? await getItems(
            item.UID,
            displayed_types,
            depth + 1,
            maxDepth,
            req,
            trx,
          )
        : [];
  });

  return output;
}

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Controlpanel = models.get('Controlpanel');
  const Index = models.get('Index');

  // Fetch query params
  let maxDepth =
    parseInt(req.query['expand.contextnavigation.bottomLevel']) || 1000;
  if (maxDepth === 0) {
    maxDepth = 1000;
  }
  const includeTop =
    req.query['expand.contextnavigation.includeTop']?.toLowerCase() === 'true';

  // Fetch settings
  const controlpanel = await Controlpanel.fetchById('navigation', {}, trx);
  const displayed_types = controlpanel.data.displayed_types;

  // Check if top should be included
  if (includeTop) {
    await req.document.fetchRelated('_catalog', trx);
  }

  // Fetch indexes
  if (!req.indexes) {
    req.indexes = await Index.fetchAll({}, {}, trx);
  }

  // Return navigation
  return {
    json: {
      '@id': `${getUrl(req)}/@contextnavigation`,
      items: [
        ...(includeTop
          ? [{ ...(await req.document._catalog.toJson(req)), items: [] }]
          : []),
        ...(await getItems(
          req.document.uuid,
          displayed_types,
          0,
          maxDepth,
          req,
          trx,
        )),
      ],
    },
  };
};

export default [
  {
    op: 'get',
    view: '/@contextnavigation',
    permission: 'View',
    client: 'getContextNavigation',
    cache: 'content',
    handler,
  },
];

/*
includeTop=true
bottomLevel=0 // all, 1 = sub items only, 2 = subsub
*/
