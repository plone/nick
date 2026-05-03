/**
 * Breadcrumbs route.
 * @module routes/breadcrumbs/breadcrumbs
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
import { compact, drop, head, last } from 'es-toolkit/array';

// Internal imports
import { getPath, getRootUrl, getUrl } from '../../helpers/url/url';
import models from '../../models';

/**
 * Traverse path.
 * @method traverse
 * @param {Object} document Current document object.
 * @param {Array} slugs Array of slugs.
 * @param {Array} items Current array of items.
 * @param {Object} trx Transaction object.
 * @returns {Promise<Array>} A Promise that resolves to an array of items.
 */
async function traverse(
  document: any,
  slugs: string[],
  items: any[],
  trx: Knex.Transaction,
): Promise<any[]> {
  if (slugs.length === 0) {
    return items;
  } else {
    const Document = models.get('Document');

    // Get child
    const child = await Document.fetchOne(
      {
        parent: document.uuid,
        id: head(slugs),
      },
      {},
      trx,
    );

    // Apply behaviors
    await child.applyBehaviors(trx);

    // Traverse up
    return traverse(
      child,
      drop(slugs, 1),
      [
        ...(child._type._schema.behaviors.includes('navigation_root')
          ? []
          : items),
        {
          '@id': `${last(items)['@id']}/${child.id}`,
          title: child.getTitle(),
        },
      ],
      trx,
    );
  }
}

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const fullPath = getPath(req);
  const navrootPath = req.navroot.path === '/' ? '' : req.navroot.path;
  const relativePath = fullPath.startsWith(navrootPath)
    ? fullPath.slice(navrootPath.length)
    : fullPath;
  const slugs = relativePath.split('/');

  const items = await traverse(
    req.navroot,
    compact(slugs),
    [
      {
        '@id': getRootUrl(req),
        title: req.document.getTitle(),
      },
    ],
    trx,
  );
  return {
    json: {
      '@id': `${getUrl(req)}/@breadcrumbs`,
      items: drop(items, 1),
      root: req.navroot.path,
    },
  };
};

export default [
  {
    op: 'get',
    view: '/@breadcrumbs',
    permission: 'View',
    client: 'getBreadcrumbs',
    cache: 'content',
    handler,
  },
];
