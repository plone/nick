/**
 * Related route.
 * @module routes/related/related
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { getUrl } from '../../helpers/url/url';
import models from '../../models';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Catalog = models.get('Catalog');

  // Check if ai enabled
  if (!config.settings.ai?.models?.embed?.enabled) {
    throw new RequestException(400, {
      message: req.i18n('AI is disabled.'),
    });
  }

  // Fetch the catalog related to the document
  await req.document.fetchRelated('_catalog', trx);

  // Fetch catalog items with closest embeddings
  const items = await Catalog.fetchClosestEmbeddingRestricted(
    req.document._catalog._embedding,
    5,
    trx,
    req,
  );

  // Get base url
  const baseUrl = getUrl(req);

  // Fetch indexes
  if (!req.indexes) {
    const Index = models.get('Index');
    req.indexes = await Index.fetchAll({}, {}, trx);
  }

  return {
    json: {
      '@id': `${baseUrl}/@related`,
      items: items
        .map((item: InstanceType<typeof Catalog>) => item.toJson(req))
        .filter((item: any) => item.UID !== req.document._catalog.UID),
    },
  };
};

export default [
  {
    op: 'get',
    view: '/@related',
    permission: 'View',
    client: 'getRelated',
    cache: 'manage',
    handler,
  },
];
