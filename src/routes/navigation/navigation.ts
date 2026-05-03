/**
 * Navigation routes.
 * @module routes/navigation/navigation
 */

import models from '../../models';
import { getUrl } from '../../helpers/url/url';
import { mapAsync } from '../../helpers/utils/utils';
import { compact } from 'es-toolkit/array';
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
  const Catalog = models.get('Catalog');
  const Controlpanel = models.get('Controlpanel');
  const Index = models.get('Index');

  // Fetch query params
  const maxDepth = parseInt(req.query['expand.navigation.depth']) || 1;

  // Fetch settings
  const controlpanel = await Controlpanel.fetchById('navigation', {}, trx);
  const settings = controlpanel.data;

  // Fetch indexes
  if (!req.indexes) {
    req.indexes = await Index.fetchAll({}, {}, trx);
  }

  // Return navigation
  return {
    json: {
      '@id': `${getUrl(req)}/@navigation`,
      items: [
        ...compact(settings.additional_items.split('\n')).map((item: any) => {
          const navitem = item.split('|');
          return {
            title: navitem[0],
            description: navitem[1],
            '@id': navitem[2],
            items: [],
          };
        }),
        ...(await getItems(
          req.navroot.uuid,
          settings.displayed_types,
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
    view: '/@navigation',
    permission: 'View',
    client: 'getNavigation',
    cache: 'content',
    handler,
  },
];
