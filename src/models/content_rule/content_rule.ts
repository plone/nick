/**
 * Content Rule Model.
 * @module models/content_rule/content_rule
 */

// Type imports
import type { Json, Request } from '../../types';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import contentRules from '../../content_rules';
import { getRootUrl } from '../../helpers/url/url';

/**
 * A model for Content Rule.
 * @class ContentRule
 * @extends Model
 */
export class ContentRule extends Model {
  // Set relation mappings
  static get relationMappings() {
    const Document = models.get('Document');

    return {
      _documents: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Document,
        join: {
          from: 'content_rule.id',
          through: {
            from: 'content_rule_document.content_rule',
            to: 'content_rule_document.document',
            extra: ['enabled', 'bubble'],
          },
          to: 'document.uuid',
        },
      },
    };
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @param {Boolean} extend Extend data
   * @returns {Json} JSON object.
   */
  toJson(req: Request, extend: boolean = false): Json {
    const self: any = this;
    return {
      '@id': `${getRootUrl(req)}/@controlpanels/content-rules/${self.id}`,
      id: self.id,
      title: self.title,
      description: self.description,
      assigned: self._documents.length > 0,
      enabled: self.enabled,
      trigger: self.event,
      ...(extend
        ? {
            actions: self.json.actions
              ? self.json.actions.map((action: any, index: number) => {
                  const actionData = contentRules.getAction(action.type);
                  return {
                    idx: index,
                    title: actionData.getTitle(req),
                    description: actionData.getDescription(req),
                    summary: actionData.getSummary(req, action),
                    first: index === 0,
                    last: index === self.json.actions.length - 1,
                  };
                })
              : [],
            conditions: self.json.conditions
              ? self.json.conditions.map((condition: any, index: number) => {
                  const conditionData = contentRules.getCondition(
                    condition.type,
                  );
                  return {
                    idx: index,
                    title: conditionData.getTitle(req),
                    description: conditionData.getDescription(req),
                    summary: conditionData.getSummary(req, condition),
                    first: index === 0,
                    last: index === self.json.conditions.length - 1,
                  };
                })
              : [],
            cascading: self.json.cascading || false,
            stop: self.json.stop || false,
            event: self.event,
            addable_actions: contentRules.getActions(req),
            addable_conditions: contentRules.getConditions(req),
            assignments: self._documents.map((document: any) => ({
              url: `${getRootUrl(req)}${document.path}`,
              title: document.json.title,
              description: document.json.description || '',
            })),
          }
        : {}),
    } as any;
  }
}
