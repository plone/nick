/**
 * Content rules routes.
 * @module routes/content_rules/content_rules
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import { apiLimiter } from '../../helpers/limiter/limiter';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@content-rules',
    permission: 'Modify',
    client: 'getContentRules',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rules = await ContentRule.fetchAll(
        {},
        { order: 'title' },
        trx,
      );

      // Create lookup for content rules
      const contentRuleLookup: { [key: string]: any } = {};
      content_rules.models.forEach((content_rule: any) => {
        contentRuleLookup[content_rule.id] = content_rule;
      });

      // Fetch content rules for this document
      await req.document.fetchRelated('_contentRules', trx);
      const assignedContentRuleIds = req.document._contentRules.map(
        (content_rule: any) => content_rule.id,
      );

      // Fetch acquired content rules
      const acquiredContentRules: any[] = [];
      if (req.document.parent) {
        let document = req.document;
        do {
          await document.fetchRelated('_parent', trx);
          document = document._parent;

          await document.fetchRelated('_contentRules', trx);

          document._contentRules.forEach((content_rule: any) => {
            if (assignedContentRuleIds.includes(content_rule.id)) {
              return;
            }
            acquiredContentRules.push({
              id: content_rule.id,
              title: content_rule.title,
              description: content_rule.description,
              enabled: content_rule.enabled,
              trigger: content_rule.event,
            });
          });
        } while (document.parent);
      }

      return {
        json: {
          'content-rules': {
            acquired_rules: acquiredContentRules,
            assignable_rules: content_rules.models
              .filter(
                (content_rule: any) =>
                  !req.document._contentRules.some(
                    (contentRule: any) => contentRule.id === content_rule.id,
                  ),
              )
              .map((content_rule: any) => ({
                id: content_rule.id,
                title: content_rule.title,
                description: content_rule.description,
              })),
            assigned_rules: req.document._contentRules.map(
              (content_rule: any) => ({
                id: content_rule.id,
                title: content_rule.title,
                description: content_rule.description,
                bubbles: content_rule.bubble,
                enabled: content_rule.enabled,
                global_enabled: contentRuleLookup[content_rule.id].enabled,
                trigger: content_rule.event,
              }),
            ),
          },
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@content-rules/:id',
    permission: 'Modify',
    client: 'createContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      await req.document.$relatedQuery('_contentRules', trx).relate({
        id: req.params.id,
        enabled: true,
        bubble: false,
      });

      // Send created
      return {
        status: 201,
        json: {
          message: req.i18n('Successfully assigned the content rule {rule}', {
            rule: req.params.id,
          }),
        },
      };
    },
  },
  {
    op: 'patch',
    view: '/@content-rules',
    permission: 'Modify',
    client: 'updateContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check if enable action
      if (req.body['form.button.Enable']) {
        await req.document
          .$relatedQuery('_contentRules', trx)
          .update({
            enabled: true,
          })
          .whereIn('id', req.body.rule_ids);

        // Send ok
        return {
          status: 200,
          json: {
            message: req.i18n('Successfully enabled rules {rules}', {
              rules: req.body.rule_ids.join(', '),
            }),
          },
        };
      }

      // Check if disable action
      if (req.body['form.button.Disable']) {
        await req.document
          .$relatedQuery('_contentRules', trx)
          .update({
            enabled: false,
          })
          .whereIn('id', req.body.rule_ids);

        // Send ok
        return {
          status: 200,
          json: {
            message: req.i18n('Successfully disabled rules {rules}', {
              rules: req.body.rule_ids.join(', '),
            }),
          },
        };
      }

      // Check if bubble action
      if (req.body['form.button.Bubble']) {
        await req.document
          .$relatedQuery('_contentRules', trx)
          .update({
            bubble: true,
          })
          .whereIn('id', req.body.rule_ids);

        // Send ok
        return {
          status: 200,
          json: {
            message: req.i18n(
              'Successfully enabled rules {rules} to subfolders',
              {
                rules: req.body.rule_ids.join(', '),
              },
            ),
          },
        };
      }

      // Check if disable action
      if (req.body['form.button.NoBubble']) {
        await req.document
          .$relatedQuery('_contentRules', trx)
          .update({
            bubble: false,
          })
          .whereIn('id', req.body.rule_ids);

        // Send ok
        return {
          status: 200,
          json: {
            message: req.i18n(
              'Successfully disabled rules {rules} to subfolders',
              {
                rules: req.body.rule_ids.join(', '),
              },
            ),
          },
        };
      }

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@content-rules',
    permission: 'Modify',
    client: 'deleteContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Fetch content rules for this document
      await req.document
        .$relatedQuery('_contentRules', trx)
        .unrelate()
        .whereIn('id', req.body.rule_ids);

      // Send ok
      return {
        status: 204,
      };
    },
  },
];
