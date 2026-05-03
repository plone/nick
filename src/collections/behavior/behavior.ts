/**
 * BehaviorCollection.
 * @module collection/behavior/behavior
 */

// Type imports
import type { Model, Schema } from '../../types';

// External imports
import { Knex } from 'knex';

// Internal imports
import { Collection } from '../../collections/_collection/_collection';
import { mergeSchemas } from '../../helpers/schema/schema';

interface BehaviorModel extends Model {
  fetchSchema: (trx: Knex.Transaction) => Promise<Schema>;
  id: string;
}

/**
 * Behavior Collection
 * @class BehaviorCollection
 * @extends Collection
 */
export class BehaviorCollection extends Collection<BehaviorModel> {
  /**
   * Fetch schema.
   * @method fetchSchema
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Schema>} Schema.
   */
  async fetchSchema(trx: Knex.Transaction): Promise<Schema> {
    return mergeSchemas(
      ...(await Promise.all(
        this.map(async (model) => ({
          name: model.id,
          data: await model.fetchSchema(trx),
        })),
      )),
    );
  }
}
