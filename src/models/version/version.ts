/**
 * Version Model.
 * @module models/version/version
 */

// Type imports
import type { Json, Request } from '../../types';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import { getRootUrl, getUrl } from '../../helpers/url/url';

/**
 * A model for Version.
 * @class Version
 * @extends Model
 */
export class Version extends Model {
  // Set relation mappings
  static get relationMappings() {
    const User = models.get('User');
    return {
      _actor: {
        relation: (Model as any).BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'version.actor',
          to: 'user.id',
        },
      },
    };
  }

  // Modifiers
  static modifiers: any = {
    order(query: any) {
      query.orderBy('version', 'desc');
    },
  };

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Json} JSON object.
   */
  toJson(req: Request): Json {
    const self: any = this;
    return {
      '@id': `${getUrl(req)}/@history/${self.version}`,
      action: 'Edited',
      actor: {
        '@id': `${getRootUrl(req)}/@users/${self._actor?.id}`,
        fullname: self._actor?.fullname,
        id: self._actor?.id,
        username: self._actor?.id,
      },
      comments: (self.json || {}).changeNote,
      may_revert: true,
      time: self.created,
      transition_title: 'Edited',
      type: 'versioning',
      version: self.version,
    } as Json;
  }
}
