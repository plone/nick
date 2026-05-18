/**
 * Children from query behavior.
 * @module behaviors/children_from_query/children_from_query
 */

// Type imports
import type { QueryString, Request } from '../../types';

// External imports
import { Knex } from 'knex';

// Internal imports
import { querystringToQuery } from '../../helpers/query/query';
import models from '../../models';

interface DocumentType {
  id: string;
  json: {
    query: QueryString;
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
   * @param {boolean} types Flag to include types in the output.
   * @return {Promise<void>} No return value.
   */
  fetchChildren: async function (
    this: DocumentType,
    req: Request,
    trx: Knex.Transaction,
    _types: boolean = true,
  ): Promise<void> {
    const Catalog = models.get('Catalog');
    const Document = models.get('Document');
    const query = await querystringToQuery(this.json.query, '/', req, trx);
    let items = await Catalog.fetchAllRestricted(query[0], query[1], trx, req);
    const uuids = items.map((item: InstanceType<typeof Catalog>) => item.UID);
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
