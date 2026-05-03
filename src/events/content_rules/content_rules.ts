/**
 * Content Rules events
 * @module events/content_rules
 */

// External imports
import { omit } from 'es-toolkit/object';
import { Knex } from 'knex';

// Internal imports
import contentRules from '../../content_rules';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

const contentHandler = async (
  event: string,
  document: any,
  user: any,
  trx: Knex.Transaction,
  ...params: any[]
) => {
  // Fetch content rules
  const ContentRule = models.get('ContentRule');

  // Get assigned content rules for document
  let assignedContentRules = [];
  await document.fetchRelated('_contentRules', trx);
  assignedContentRules.push(...document._contentRules);

  // Add content rules from parent items
  let cur = document;
  while (cur.path !== '/') {
    if (!cur._parent) {
      await cur.fetchRelated('_parent', trx);
    }
    cur = cur._parent;
    await cur.fetchRelated('_contentRules', trx);
    assignedContentRules.push(
      ...cur._contentRules.filter((contentRule: any) => contentRule.bubble),
    );
  }

  // Filter enabled and matching rules
  assignedContentRules = assignedContentRules.filter(
    (contentRule: any) => contentRule.enabled && contentRule.event === event,
  );

  // Loop through content rules
  await mapAsync(assignedContentRules, async (contentRule: any) => {
    // Fetch content rule
    const globalRule = await ContentRule.fetchById(contentRule.id, {}, trx);

    // Check if content rule is enabled
    if (!globalRule.enabled) return;

    // Check conditions
    const checks = await Promise.all(
      contentRule.json.conditions.map(async (condition: any) => {
        const conditionObj = contentRules.getCondition(condition.type);
        return await conditionObj.handler(
          omit(condition, ['type']),
          document,
          user,
          contentRule,
          trx,
          ...(params as []),
        );
      }),
    );

    // Check if all conditions pass
    if (checks.includes(false) === false) {
      // Call all actions
      await mapAsync(contentRule.json.actions, async (action: any) => {
        const actionObj = contentRules.getAction(action.type);
        await actionObj.handler(
          omit(action, ['type']),
          document,
          user,
          contentRule,
          trx,
          ...(params as []),
        );
      });
    }
  });
};

const userHandler = async (
  event: string,
  user: any,
  trx: Knex.Transaction,
  ...params: any[]
) => {
  const Document = models.get('Document');
  const ContentRule = models.get('ContentRule');

  // Fetch content rules
  const assignedContentRules = await ContentRule.query(trx)
    .select('content_rule.*', 'content_rule_document.*')
    .join(
      'content_rule_document',
      'content_rule.id',
      '=',
      'content_rule_document.content_rule',
    )
    .where('content_rule_document.enabled', true)
    .where('content_rule.event', event)
    .where('content_rule.enabled', true);

  // Loop through content rules
  await mapAsync(assignedContentRules, async (contentRule: any) => {
    // Fetch document
    const document = await Document.fetchByUuid(contentRule.document, {}, trx);

    // Check conditions
    const checks = await Promise.all(
      contentRule.json.conditions.map(async (condition: any) => {
        const conditionObj = contentRules.getCondition(condition.type);
        return await conditionObj.handler(
          omit(condition, ['type']),
          document,
          user,
          contentRule,
          trx,
          ...(params as []),
        );
      }),
    );

    // Check if all conditions pass
    if (checks.includes(false) === false) {
      // Call all actions
      await mapAsync(contentRule.json.actions, async (action: any) => {
        const actionObj = contentRules.getAction(action.type);
        await actionObj.handler(
          omit(action, ['type']),
          document,
          user,
          contentRule,
          trx,
          ...(params as []),
        );
      });
    }
  });
};

export const content_rules = {
  // Content events
  onAfterAdd: async (
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => contentHandler('onAfterAdd', document, user, trx, ...params),
  onAfterDelete: async (
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => contentHandler('onAfterDelete', document, user, trx, ...params),
  onAfterModified: async (
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => contentHandler('onAfterModified', document, user, trx, ...params),
  onAfterCopy: async (
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => contentHandler('onAfterCopy', document, user, trx, ...params),
  onAfterChangeWorkflow: async (
    document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => contentHandler('onAfterChangeWorkflow', document, user, trx, ...params),

  // User events
  onAfterLogin: async (
    _document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => userHandler('onAfterLogin', user, trx, ...params),
  onAfterLogout: async (
    _document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => userHandler('onAfterLogout', user, trx, ...params),
  onAfterCreateUser: async (
    _document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => userHandler('onAfterCreateUser', user, trx, ...params),
  onAfterDeleteUser: async (
    _document: any,
    user: any,
    trx: Knex.Transaction,
    ...params: any[]
  ) => userHandler('onAfterDeleteUser', user, trx, ...params),
};
