/**
 * TypeCollection.
 * @module collections/type/type
 */

// Type imports
import type { Json, Model, Request } from '../../types';

// Internal imports
import { Collection } from '../../collections/_collection/_collection';
import { hasPermission } from '../../helpers/auth/auth';
import { getRootUrl } from '../../helpers/url/url';

interface TypeModel extends Model {
  id: string;
  title: string;
  global_allow: boolean;
}

/**
 * Type Collection
 * @class TypeCollection
 * @extends Collection
 */
export class TypeCollection extends Collection<TypeModel> {
  /**
   * Returns JSON data.
   * @method toJson
   * @param {CustomRequest} req Request object.
   * @returns {Promise<TypeResponse[]>} JSON object.
   */
  async toJson(req: Request): Promise<Json> {
    return ((await super.toJson(req)) as any).map((model: TypeModel) => ({
      '@id': `${getRootUrl(req)}/@types/${model.id}`,
      addable:
        hasPermission(req.permissions, 'Add') &&
        (req.type.filter_content_types
          ? req.type.allowed_content_types.includes(model.id)
          : model.global_allow),
      title: req.i18n(model.title),
    }));
  }
}
