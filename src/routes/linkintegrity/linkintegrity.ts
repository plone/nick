/**
 * Link integrity route.
 * @module routes/linkintegrity/linkintegrity
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import { getUrlByPath } from '../../helpers/url/url';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

interface Breach {
  '@id': string;
  '@type': string;
  title: string;
  description: string;
  review_state: string;
  breaches: Array<{
    '@id': string;
    uid: string;
    title: string;
  }>;
  items_total: number;
}

export default [
  {
    op: 'get',
    view: '/@linkintegrity',
    permission: 'Modify',
    client: 'linkintegrity',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Catalog = models.get('Catalog');
      const uuids = Array.isArray(req.query.uids)
        ? req.query.uids
        : req.query.uids || [];

      // Get items
      const items = (await Catalog.fetchAll({ _UID: ['=', uuids] }, {}, trx))
        .models;

      // Get children
      await mapAsync(items, async (item: InstanceType<typeof Catalog>) => {
        const subitems = (
          await Catalog.fetchAll(
            {
              _path: ['~', `^${item._path}/`],
            },
            {},
            trx,
          )
        ).models;
        items.push.apply(items, subitems);
      });

      // Create documents object
      const documents: { [key: string]: InstanceType<typeof Catalog> } = {};
      items.map((item: InstanceType<typeof Catalog>) => {
        documents[item._UID] = item;
      });

      // Find breaches
      const output: Breach[] = [];
      await mapAsync(items, async (item: InstanceType<typeof Catalog>) => {
        const breaches = (
          await Catalog.fetchAll(
            {
              _isReferencing: ['&&', [item._UID]],
            },
            {},
            trx,
          )
        ).models;

        // Add breach
        if (breaches.length > 0) {
          output.push({
            '@id': getUrlByPath(req, item._path),
            '@type': item.Type,
            title: item.Title,
            description: item.Description,
            review_state: item.review_state,
            breaches: breaches.map((breach: InstanceType<typeof Catalog>) => ({
              '@id': getUrlByPath(req, breach._path),
              uid: breach.UID,
              title: breach.Title,
            })),
            items_total: breaches.length,
          });
        }
      });

      // Return data
      return {
        json: output,
      };
    },
  },
];
