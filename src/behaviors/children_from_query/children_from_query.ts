/**
 * Children from query behavior.
 * @module behaviors/children_from_query/children_from_query
 */

// Type imports
import type { Request } from '../../types';

// External imports
import { Knex } from 'knex';

// Internal imports
import { querystringToQuery } from '../../helpers/query/query';
import models from '../../models';

interface DocumentType {
  id: string;
  json: {
    query: string;
  };
  _children?: any[];
}

/**
 * Children from query behavior.
 * @constant children_from_query
 */
export const children_from_query = {
  /**
   * Fetch children.
   * @method fetchChildren
   * @param {Object} req Request object
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<void>} No return value.
   */
  fetchChildren: async function (
    this: DocumentType,
    req: Request,
    trx: Knex.Transaction,
  ): Promise<void> {
    const Catalog = models.get('Catalog');
    const Document = models.get('Document');
    const query = await querystringToQuery(this.json.query, '/', req, trx);
    let items = await Catalog.fetchAllRestricted(query[0], query[1], trx, req);
    const uuids = items.map((item: any) => item.UID);
    items = await Document.fetchAll(
      {
        uuid: ['=', uuids],
      },
      {},
      trx,
    );
    this._children = items.models;
  },
};
