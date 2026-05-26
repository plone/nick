/**
 * A content rule registry.
 * @module content_rules
 */

// Type imports
import type {
  Request,
  ContentRuleAction,
  ContentRuleActions,
  ContentRuleActionJson,
  ContentRuleCondition,
  ContentRuleConditions,
  ContentRuleConditionJson,
} from '../types';

// Internal imports
import { stripI18n } from '../helpers/i18n/i18n';
import { translateSchema } from '../helpers/schema/schema';

/**
 * A content rule registry.
 * @class ContentRules
 */
class ContentRules {
  public actions: ContentRuleActions;
  public conditions: ContentRuleConditions;
  static instance: ContentRules;

  /**
   * Construct a Config.
   * @constructs Config
   */
  constructor() {
    this.actions = {};
    this.conditions = {};

    if (!ContentRules.instance) {
      ContentRules.instance = this;
    }

    return ContentRules.instance;
  }

  /**
   * Register an action rule.
   * @param {string} name The name of the action.
   * @param {ContentRuleAction} rule The action to register.
   */
  registerAction(name: string, rule: ContentRuleAction) {
    this.actions[name] = rule;
  }

  /**
   * Get an action rule.
   * @param {string} name The name of the action rule.
   * @returns {ContentRuleAction} The action rule.
   */
  getAction(name: string): ContentRuleAction {
    return this.actions[name];
  }

  /**
   * Get a list of all actions.
   * @param {Request} req The request object.
   * @returns {ContentRuleActionJson[]} The actions.
   */
  getActions(req: Request): ContentRuleActionJson[] {
    const self: ContentRules = this;
    return Object.entries(self.actions).map(
      ([name, action]: [string, ContentRuleAction]) => ({
        addview: name,
        title: action.getTitle(req),
        description: action.getDescription(req),
        '@schema': translateSchema(stripI18n(action.schema), req),
      }),
    );
  }

  /**
   * Register a condition rule.
   * @param {string} name The name of the condition.
   * @param {ContentRuleCondition} rule The condition to register.
   */
  registerCondition(name: string, rule: ContentRuleCondition) {
    this.conditions[name] = rule;
  }

  /**
   * Get a condition rule.
   * @param {string} name The name of the condition rule.
   * @returns {ContentRuleCondition} The condition rule.
   */
  getCondition(name: string): ContentRuleCondition {
    return this.conditions[name];
  }

  /**
   * Get a list of all conditions.
   * @param {Request} req The request object.
   * @returns {ContentRuleConditionJson[]} The conditions.
   */
  getConditions(req: Request): ContentRuleConditionJson[] {
    const self: ContentRules = this;
    return Object.entries(self.conditions).map(
      (condition: [string, ContentRuleCondition]) => ({
        addview: condition[0],
        title: condition[1].getTitle(req),
        description: condition[1].getDescription(req),
        '@schema': translateSchema(stripI18n(condition[1].schema), req),
      }),
    );
  }
}

// Create an instance of the ContentRules registry and register all content rules
const contentRules = new ContentRules();

// Export the instance and all content rules
export default contentRules;
