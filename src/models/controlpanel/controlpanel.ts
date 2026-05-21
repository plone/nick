/**
 * Controlpanel Model.
 * @module models/controlpanel/controlpanel
 */

// Type imports
import type { Json, Request, Schema } from '../../types';

// External imports
import { compact } from 'es-toolkit/array';

// Internal imports
import { Model } from '../_model/_model';
import { translateSchema } from '../../helpers/schema/schema';
import { getRootUrl } from '../../helpers/url/url';

/**
 * A model for Controlpanel.
 * @class Controlpanel
 * @extends Model
 */
export class Controlpanel extends Model {
  static tableName: string = 'controlpanel';

  // Declare properties
  declare id: string;
  declare title: string;
  declare group: string;
  declare data: { [key: string]: any };
  declare schema: Schema;

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object
   * @param {Boolean} extend Extend data
   * @returns {Json} JSON object.
   */
  toJson(req: Request, extend = false): Json {
    const self: InstanceType<typeof Controlpanel> = this;
    // Get basic data
    const json = {
      '@id': `${getRootUrl(req)}/@controlpanels/${self.id}`,
      group: self.group,
      title: self.title,
    };

    // Return extended or basic data
    return extend
      ? ({
          ...json,
          data: self.data,
          schema: translateSchema(self.schema, req),
        } as unknown as Json)
      : (json as Json);
  }

  /**
   * Get factory fields.
   * @method getFactoryFields
   * @param {string} factory Factory field.
   * @returns {string[]} Array of fields with given factory.
   */
  getFactoryFields(factory: string): string[] {
    const self: InstanceType<typeof Controlpanel> = this;
    const properties = (self.schema && self.schema.properties) || {};

    // Get factory fields
    const factoryFields = Object.keys(properties).map((property) =>
      properties[property].factory === factory ? property : false,
    );
    return compact(factoryFields) as string[];
  }
}
