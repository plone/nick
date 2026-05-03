/**
 * Index Model.
 * @module models/index/index
 */

// Type imports
import type { Json, Request } from '../../types';

// External imports
import { mapValues } from 'es-toolkit/object';

// Internal imports
import { Model } from '../_model/_model';
import { IndexCollection } from '../../collections/index/index';

/**
 * A model for Index.
 * @class Index
 * @extends Model
 */
export class Index extends Model {
  static collection: (typeof Model)['collection'] =
    IndexCollection as unknown as (typeof Model)['collection'];

  /**
   * Returns JSON data.
   * @method toJSON
   * @param {Request} req Request object
   * @returns {Promise<Json>} JSON object.
   */
  async toJson(req: Request): Promise<Json> {
    const self: any = this;
    return {
      title: req.i18n(self.title),
      description: req.i18n(self.description),
      group: self.group,
      enabled: self.enabled,
      sortable: self.sortable,
      values: {},
      vocabulary: self.vocabulary,
      operations: Object.keys(self.operators || {}),
      operators: mapValues(self.operators || {}, (operator: any) => ({
        ...operator,
        title: req.i18n(operator.title),
        description: req.i18n(operator.description),
      })),
    } as Json;
  }
}
