/**
 * Behavior Model.
 * @module models/behavior/behavior
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import { Model } from '../_model/_model';
import { BehaviorCollection } from '../../collections/behavior/behavior';
import { mergeSchemas } from '../../helpers/schema/schema';
import type { Schema } from '../../types';

/**
 * A model for Behavior.
 * @class Behavior
 * @extends Model
 */
export class Behavior extends Model {
  static collection: (typeof Model)['collection'] =
    BehaviorCollection as unknown as (typeof Model)['collection'];

  /**
   * Fetch schema.
   * @method fetchSchema
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Schema>} Schema.
   */
  async fetchSchema(trx?: Knex.Transaction): Promise<Schema> {
    const schema = (this as any).schema;

    if (schema.behaviors) {
      const behaviors = await Behavior.fetchAll(
        {
          id: ['=', schema.behaviors],
        },
        {
          order: {
            column: 'id',
            values: schema.behaviors,
          },
        },
        trx,
      );
      return mergeSchemas(
        {
          name: 'behaviors',
          data: await behaviors.fetchSchema(trx),
        },
        {
          name: (this as any).id,
          data: schema,
        },
      );
    }

    return schema;
  }
}
