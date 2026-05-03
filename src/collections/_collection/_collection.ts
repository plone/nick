/**
 * Collection.
 * @module collection/_collection/_collection
 */

// Type imports
import type { Json, Model, Request, Vocabulary } from '../../types';

/**
 * Base collection used to extend collections from.
 * @class Collection
 */
export class Collection<T extends Model> {
  protected models: T[];

  /**
   * Construct a Collection.
   * @constructs Collection
   */
  constructor(models: T[]) {
    this.models = models;
  }

  /**
   * Maps over models.
   * @method map
   * @param {function} callback Callback function.
   * @returns {Array} Array of models.
   */
  map<U>(callback: (model: T) => U): U[] {
    return this.models.map(callback);
  }

  /**
   * Filter models.
   * @method filter
   * @param {function} callback Callback function.
   */
  filter(callback: (model: T) => boolean): void {
    this.models = this.models.filter(callback) as T[];
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toJson(req: Request): Promise<Json> {
    return this.map((model) => model.toJson(req));
  }

  /**
   * Returns vocabulary data.
   * @method getVocabulary
   * @param {Request} req Request object.
   * @returns {Vocabulary} Vocabulary.
   */
  getVocabulary(req: Request): Vocabulary {
    return this.map((model) => model.getVocabularyTerm(req));
  }

  /**
   * Returns length of the collection.
   * @method getLength
   * @returns {Number} Length of the collection.
   */
  getLength(): number {
    return this.models.length;
  }
}
