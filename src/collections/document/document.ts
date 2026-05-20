/**
 * DocumentCollection.
 * @module collections/document/document
 */

// Type imports
import type { Json, Model, Request } from '../../types';

// Internal imports
import { Collection } from '../../collections/_collection/_collection';

/**
 * Document Collection
 * @class DocumentCollection
 * @extends Collection
 */
export class DocumentCollection extends Collection<Model> {
  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toJson(req: Request): Promise<Json> {
    return await Promise.all(
      this.map(async (model) => await model.toJson(req)),
    );
  }

  /**
   * Returns Recyclebin JSON data.
   * @method toRecyclebinJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toRecyclebinJson(req: Request): Promise<Json> {
    return await Promise.all(
      this.map(async (model) => await model.toRecyclebinJson(req)),
    );
  }
}
