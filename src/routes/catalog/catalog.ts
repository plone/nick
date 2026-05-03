/**
 * Catalog route.
 * @module routes/catalog/catalog
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import { getUrl } from '../../helpers/url/url';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  await req.document.fetchRelated('_catalog', trx);

  if (req.document._children) {
    await mapAsync(req.document._children, async (child: any) => {
      await child.fetchRelated('_catalog', trx);
      await child.fetchRelationLists(trx);
    });
  }

  // Get base url
  const baseUrl = getUrl(req);

  // Fetch indexes
  if (!req.indexes) {
    const Index = models.get('Index');
    req.indexes = await Index.fetchAll({}, {}, trx);
  }

  return {
    json: {
      ...req.document._catalog.toJson(req),
      '@id': `${baseUrl}/@catalog`,
    },
    xkeys: [req.document.uuid],
  };
};

export default [
  {
    op: 'get',
    view: '/@catalog',
    permission: 'View',
    client: 'getCatalog',
    cache: 'manage',
    handler,
  },
];
