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
      await mapAsync(items, async (item: any) => {
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
      const documents: any = {};
      items.map((item: any) => {
        documents[item._UID] = item;
      });

      // Find breaches
      const output: any = [];
      await mapAsync(items, async (item: any) => {
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
            breaches: breaches.map((breach: any) => ({
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
