/**
 * Inherit route.
 * @module routes/inherit/inherit
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { pick } from 'es-toolkit/object';

// Internal imports
import { getUrl, getUrlByPath } from '../../helpers/url/url';
import models from '../../models';

/**
 * Traverse path.
 * @method traverse
 * @param {Object} document Current document object.
 * @param {string[]} behaviors Array of behaviors.
 * @param {Object} items Current object of items.
 * @param {Object} req Request object.
 * @param {Object} trx Transaction object.
 * @returns {Promise<Array>} A Promise that resolves to an array of items.
 */
async function traverse(
  document: any,
  behaviors: string[],
  items: any,
  req: Request,
  trx: Knex.Transaction,
) {
  const Document = models.get('Document');
  const Behavior = models.get('Behavior');
  const returnItems = { ...items };

  // If type not found fetch type
  if (!document._type) {
    await document.fetchRelated('_type', trx);
  }

  await Promise.all(
    behaviors.map(async (behavior) => {
      if (
        !returnItems[behavior] &&
        document._type._schema.behaviors.includes(behavior)
      ) {
        // Fetch behavior
        const behaviorObj = await Behavior.fetchById(behavior, {}, trx);
        const props = Object.keys(behaviorObj?.schema?.properties || {});

        returnItems[behavior] = {
          from: {
            '@id': getUrlByPath(req, document.path),
            title: document.json.title,
          },
          data: pick(await document.toJson(req), props),
        };
      }
    }),
  );

  if (document.parent === null) {
    return returnItems;
  } else {
    // Get parent
    const parent = await Document.fetchOne(
      {
        uuid: document.parent,
      },
      {},
      trx,
    );

    // Traverse up
    return await traverse(parent, behaviors, returnItems, req, trx);
  }
}

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const behaviors = req.query['expand.inherit.behaviors']?.split(',') || [];
  const items = await traverse(req.document, behaviors, {}, req, trx);

  return {
    json: {
      '@id': `${getUrl(req)}/@inherit`,
      ...items,
    },
  };
};

export default [
  {
    op: 'get',
    view: '/@inherit',
    permission: 'View',
    client: 'inherit',
    cache: 'content',
    handler,
  },
];
