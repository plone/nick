/**
 * Redirect Model.
 * @module models/redirect/redirect
 */

// Type imports
import type { Knex } from 'knex';
import type { Json, Request } from '../../types';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';

/**
 * A model for Redirect.
 * @class Redirect
 * @extends Model
 */
export class Redirect extends Model {
  static tableName: string = 'redirect';
  static get idColumn(): string[] {
    return ['document', 'path'];
  }

  // Declare properties.
  declare path: string;
  declare manual: boolean;
  declare datetime: string;
  declare 'redirect-to': string;
  declare _document: any;

  // Set relation mappings
  static get relationMappings() {
    const Document = models.get('Document');
    return {
      _document: {
        relation: Model.BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'redirect.document',
          to: 'document.uuid',
        },
      },
    };
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Json} JSON object.
   */
  toJson(_req: Request): Json {
    const self: InstanceType<typeof Redirect> = this;
    return {
      path: self.path,
      manual: self.manual,
      datetime: self.datetime,
      'redirect-to': self._document ? self._document.path : null,
    } as Json;
  }

  /**
   * Fetch by path
   * @method fetchByPath
   * @static
   * @param {string} path Path to check
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<any>} Document model or false.
   */
  static fetchByPath(path: string, trx?: Knex.Transaction): Promise<any> {
    return this.fetchOne(
      {
        path,
      },
      { related: '_document' },
      trx,
    );
  }
}
