/**
 * Workflow Model.
 * @module models/workflow/workflow
 */

// Type imports
import type { Json, Request } from '../../types';

// External imports
import { flatten } from 'es-toolkit/array';
import { mapValues, pick, pickBy } from 'es-toolkit/object';

// Internal imports
import { Model } from '../_model/_model';
import { getUrl } from '../../helpers/url/url';

/**
 * A model for Workflow.
 * @class Workflow
 * @extends Model
 */
export class Workflow extends Model {
  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object
   * @returns {Json} JSON object.
   */
  toJson(req: Request): Json {
    const self: any = this;
    const current_state_id = req.document.workflow_state;
    const current_state = (self.json.states || {})[current_state_id] || {};

    return {
      '@id': `${getUrl(req)}/@workflow`,
      history: [],
      state: {
        id: current_state_id,
        title: req.i18n(current_state.title),
      },
      transitions: Object.entries(
        mapValues(
          pick(
            pickBy(self.json.transitions || {}, (transition: any) =>
              req.permissions.includes(transition.permission),
            ),
            current_state.transitions || [],
          ),
          (item: any) => item.title,
        ),
      ).map((transition) => ({
        '@id': `${getUrl(req)}/@workflow/${transition[0]}`,
        title: req.i18n(transition[1]),
      })),
    } as Json;
  }

  /**
   * Get permissions by state and roles
   * @method getPermissions
   * @param {string} state Current workflow state
   * @param {string[]} roles Array of roles
   * @returns {string[]} Array of permissions.
   */
  getPermissions(state: string, roles: string[]): string[] {
    const self: any = this;
    return flatten(
      roles.map(
        (role) => (self.json.states || {})[state]?.permissions?.[role] || [],
      ),
    );
  }
}
