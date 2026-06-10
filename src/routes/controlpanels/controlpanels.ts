/**
 * Controlpanels route.
 * @module routes/controlpanels/controlpanels
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { without } from 'es-toolkit/array';
import { mapKeys, merge, omit, pick } from 'es-toolkit/object';
import slugify from 'slugify';

// Internal imports
import contentRules from '../../content_rules';
import {
  handleBlocks,
  handleFiles,
  handleImages,
  handleRelationLists,
} from '../../helpers/content/content';
import { RequestException } from '../../helpers/error/error';
import { stripI18n } from '../../helpers/i18n/i18n';
import { apiLimiter } from '../../helpers/limiter/limiter';
import { translateSchema } from '../../helpers/schema/schema';
import { getUrl } from '../../helpers/url/url';
import { uniqueId } from '../../helpers/utils/utils';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@controlpanels',
    permission: 'Manage Site',
    client: 'getControlpanels',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Controlpanel = models.get('Controlpanel');
      const controlpanels = await Controlpanel.fetchAll(
        {},
        { order: 'title' },
        trx,
      );
      return {
        json: await controlpanels.toJson(req),
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/content-rules',
    permission: 'Manage Site',
    client: 'getControlpanelContentRules',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rules = await ContentRule.fetchAll(
        {},
        { order: 'title', related: '_documents' },
        trx,
      );
      return {
        json: {
          '@id': `${getUrl(req)}/@controlpanels/content-rules`,
          group: 'Content',
          title: 'Content Rules',
          items: [await content_rules.toJson(req)],
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@controlpanels/content-rules',
    permission: 'Manage Site',
    client: 'createControlpanelContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const blacklist = await ContentRule.fetchAll({}, {}, trx).then(
        (content_rules: InstanceType<typeof ContentRule>[]) =>
          content_rules.map(
            (content_rule: InstanceType<typeof ContentRule>) => content_rule.id,
          ),
      );
      const content_rule = await ContentRule.create(
        {
          id: uniqueId(
            slugify(req.body.title, { lower: true, remove: /[*+~.()'"!:@?]/g }),
            blacklist,
          ),
          title: req.body.title,
          description: req.body.description || '',
          event: req.body.event,
          enabled: req.body.enabled || false,
          json: {
            cascading: req.body.cascading || false,
            stop: req.body.stop || false,
            actions: [],
            conditions: [],
          },
        },
        {},
        trx,
      );

      // Send created
      await content_rule.fetchRelated('_documents', trx);
      return {
        status: 201,
        json: await content_rule.toJson(req, true),
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/:id',
    permission: 'Manage Site',
    client: 'getControlpanel',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      switch (req.params.id) {
        case 'dexterity-types':
          const Type = models.get('Type');
          const Document = models.get('Document');
          const types = await Type.fetchAll({}, {}, trx);
          const path = getUrl(req);
          const documents = await Document.buildQuery({}, {}, trx)
            .select('type')
            .where('deleted', false)
            .count()
            .groupBy('type');
          const counts: { [key: string]: number } = {};
          documents.map((document: InstanceType<typeof Document>) => {
            counts[document.type] = parseInt(document.count);
          });

          return {
            json: {
              '@id': `${path}/@controlpanels/dexterity-types`,
              items: types.map((type: InstanceType<typeof Type>) => ({
                '@id': `${path}/@controlpanels/dexterity-types/${type.id}`,
                '@type': type.id,
                title: type.title,
                description: type.description,
                id: type.id,
                count: counts[type.id] || 0,
                meta_type: type.id,
              })),
              title: req.i18n('Content Types'),
              group: req.i18n('Content'),
            },
          };
        default:
          const Controlpanel = models.get('Controlpanel');
          const controlpanel = await Controlpanel.fetchById(
            req.params.id,
            {},
            trx,
          );
          if (!controlpanel) {
            throw new RequestException(404, { error: req.i18n('Not found.') });
          }
          return {
            json: await controlpanel.toJson(req, true),
          };
      }
    },
  },
  {
    op: 'post',
    view: '/@controlpanels/dexterity-types',
    permission: 'Manage Site',
    client: 'createControlpanelType',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const Workflow = models.get('Workflow');

      // Check if type exists
      const workflows = await Workflow.fetchAll({}, {}, trx);
      const current = await Type.fetchById(req.body.title, {}, trx);
      let typeModel;

      // If doesn’t exist
      if (!current) {
        typeModel = await Type.create(
          {
            id: req.body.title,
            global_allow: true,
            allowed_content_types: [],
            filter_content_types: false,
            schema: {
              fieldsets: [],
              properties: {},
              required: [],
              behaviors: [],
              layouts: [],
            },
            workflow: workflows.models[0].id,
            ...req.body,
          },
          {},
          trx,
        );
      } else {
        typeModel = await Type.update(
          req.body.title,
          merge(current.$toDatabaseJson(), req.body),
          trx,
        );
      }

      await typeModel.cacheSchema(trx);

      // Return success
      return {
        status: 201,
        json: await typeModel.toControlPanelJSON(req, trx),
      };
    },
  },
  {
    op: 'delete',
    view: '/@controlpanels/dexterity-types/:id',
    permission: 'Manage Site',
    client: 'deleteControlpanelType',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      await Type.deleteById(req.params.id, trx);

      // Return deleted
      return {
        status: 204,
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/dexterity-types/:id',
    permission: 'Manage Site',
    client: 'getControlpanelType',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const type = await Type.fetchById(req.params.id, {}, trx);

      // Return success
      return {
        json: await type.toControlPanelJSON(req, trx),
      };
    },
  },
  {
    op: 'patch',
    view: '/@controlpanels/dexterity-types/:id',
    permission: 'Manage Site',
    client: 'updateControlpanel',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const fields = [
        'title',
        'description',
        'allowed_content_types',
        'filter_content_types',
      ];

      // Fetch type
      let type = await Type.fetchById(req.params.id, {}, trx);

      // Calc behaviors
      let behaviors = type.schema.behaviors;
      mapKeys(
        omit(req.body, fields),
        (enabled: boolean, behavior: any): any => {
          if (enabled) {
            behaviors.push(behavior);
          } else {
            behaviors = without(behaviors, behavior);
          }
        },
      );

      // Update type
      type = await Type.update(
        req.params.id,
        {
          ...pick(req.body, fields),
          schema: {
            ...type.schema,
            behaviors,
          },
        },
        trx,
      );

      // Chache schema
      await type.cacheSchema(trx);

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'patch',
    view: '/@controlpanels/:id',
    permission: 'Manage Site',
    client: 'updateControlpanel',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Controlpanel = models.get('Controlpanel');

      // Make a copy
      let json = { ...req.body };

      const controlpanel = await Controlpanel.fetchById(req.params.id, {}, trx);

      // Handle images
      json = await handleBlocks(json);
      json = await handleFiles(json, controlpanel.schema, trx);
      json = await handleImages(json, controlpanel.schema, trx);
      json = await handleRelationLists(json, controlpanel.schema);

      await Controlpanel.update(
        req.params.id,
        {
          data: {
            ...controlpanel.data,
            ...json,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/content-rules/:rule/action/:action',
    permission: 'Manage Site',
    client: 'getControlpanelContentRuleAction',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (
        !content_rule ||
        !content_rule.json.actions[parseInt(req.params.action, 10)]
      ) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: {
          '@id': `${getUrl(req)}/@controlpanels/content-rules/${req.params.rule}/action/${req.params.action}`,
          '@schema': translateSchema(
            stripI18n(
              contentRules.getAction(
                content_rule.json.actions[parseInt(req.params.action, 10)].type,
              ).schema,
            ),
            req,
          ),
          ...omit(content_rule.json.actions[parseInt(req.params.action, 10)], [
            'type',
          ]),
        },
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/content-rules/:rule/condition/:condition',
    permission: 'Manage Site',
    client: 'getControlpanelContentRuleCondition',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (
        !content_rule ||
        !content_rule.json.conditions[parseInt(req.params.condition, 10)]
      ) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: {
          '@id': `${getUrl(req)}/@controlpanels/content-rules/${req.params.rule}/condition/${req.params.condition}`,
          '@schema': translateSchema(
            stripI18n(
              contentRules.getCondition(
                content_rule.json.conditions[parseInt(req.params.condition, 10)]
                  .type,
              ).schema,
            ),
            req,
          ),
          ...omit(
            content_rule.json.conditions[parseInt(req.params.condition, 10)],
            ['type'],
          ),
        },
      };
    },
  },
  {
    op: 'get',
    view: '/@controlpanels/content-rules/:id',
    permission: 'Manage Site',
    client: 'getControlpanelContentRule',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(req.params.id, {}, trx);
      if (!content_rule) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      await content_rule.fetchRelated('_documents', trx);
      return {
        json: await content_rule.toJson(req, true),
      };
    },
  },

  {
    op: 'post',
    view: '/@controlpanels/content-rules/:id/action',
    permission: 'Manage Site',
    client: 'createControlpanelContentRuleAction',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(req.params.id, {}, trx);
      if (!content_rule) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const updated_content_rule = await ContentRule.update(
        req.params.id,
        {
          json: {
            ...content_rule.json,
            actions: [...content_rule.json.actions, req.body],
          },
        },
        trx,
      );

      // Send created
      await updated_content_rule.fetchRelated('_documents', trx);
      return {
        status: 201,
        json: await updated_content_rule.toJson(req, true),
      };
    },
  },
  {
    op: 'post',
    view: '/@controlpanels/content-rules/:id/condition',
    permission: 'Manage Site',
    client: 'createControlpanelContentRuleCondition',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(req.params.id, {}, trx);
      if (!content_rule) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const updated_content_rule = await ContentRule.update(
        req.params.id,
        {
          json: {
            ...content_rule.json,
            conditions: [...content_rule.json.conditions, req.body],
          },
        },
        trx,
      );

      // Send created
      await updated_content_rule.fetchRelated('_documents', trx);
      return {
        status: 201,
        json: await updated_content_rule.toJson(req, true),
      };
    },
  },
  {
    op: 'patch',
    view: '/@controlpanels/content-rules/:rule/action/:action',
    permission: 'Manage Site',
    client: 'updateControlpanelContentRuleAction',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const actionIndex = parseInt(req.params.action, 10);
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (!content_rule || !content_rule.json.actions[actionIndex]) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const actions = [...content_rule.json.actions];
      if (req.body['form.button.Move']) {
        const newIndex =
          actionIndex + (req.body['form.button.Move'] === '_move_up' ? -1 : 1);
        if (newIndex < 0 || newIndex >= actions.length) {
          throw new RequestException(400, { error: req.i18n('Invalid move.') });
        }
        actions[actionIndex] = actions.splice(
          newIndex,
          1,
          actions[actionIndex],
        )[0];
      } else {
        actions[actionIndex] = {
          type: actions[actionIndex].type,
          ...omit(req.body, ['@id', '@schema']),
        };
      }
      await ContentRule.update(
        req.params.rule,
        {
          json: {
            ...content_rule.json,
            actions,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'patch',
    view: '/@controlpanels/content-rules/:rule/condition/:condition',
    permission: 'Manage Site',
    client: 'updateControlpanelContentRuleCondition',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const conditionIndex = parseInt(req.params.condition, 10);
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (!content_rule || !content_rule.json.conditions[conditionIndex]) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const conditions = [...content_rule.json.conditions];
      if (req.body['form.button.Move']) {
        const newIndex =
          conditionIndex +
          (req.body['form.button.Move'] === '_move_up' ? -1 : 1);
        if (newIndex < 0 || newIndex >= conditions.length) {
          throw new RequestException(400, { error: req.i18n('Invalid move.') });
        }
        conditions[conditionIndex] = conditions.splice(
          newIndex,
          1,
          conditions[conditionIndex],
        )[0];
      } else {
        conditions[conditionIndex] = {
          type: conditions[conditionIndex].type,
          ...omit(req.body, ['@id', '@schema']),
        };
      }
      await ContentRule.update(
        req.params.rule,
        {
          json: {
            ...content_rule.json,
            conditions,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'patch',
    view: '/@controlpanels/content-rules/:id',
    permission: 'Manage Site',
    client: 'updateControlpanelContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(req.params.id, {}, trx);
      if (!content_rule) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      await ContentRule.update(
        req.params.id,
        {
          title: req.body.title,
          description: req.body.description || '',
          event: req.body.event,
          enabled: req.body.enabled || false,
          json: {
            ...content_rule.json,
            cascading:
              typeof req.body.cascading === 'boolean'
                ? req.body.cascading
                : content_rule.json.cascading,
            stop:
              typeof req.body.stop === 'boolean'
                ? req.body.stop
                : content_rule.json.stop,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@controlpanels/content-rules/:rule/action/:action',
    permission: 'Manage Site',
    client: 'deleteControlpanelContentRuleAction',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (
        !content_rule ||
        !content_rule.json.actions[parseInt(req.params.action, 10)]
      ) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const actions = [...content_rule.json.actions];
      actions.splice(parseInt(req.params.action, 10), 1);
      await ContentRule.update(
        req.params.rule,
        {
          json: {
            ...content_rule.json,
            actions,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@controlpanels/content-rules/:rule/condition/:condition',
    permission: 'Manage Site',
    client: 'deleteControlpanelContentRuleCondition',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      const content_rule = await ContentRule.fetchById(
        req.params.rule,
        {},
        trx,
      );
      if (
        !content_rule ||
        !content_rule.json.conditions[parseInt(req.params.condition, 10)]
      ) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      const conditions = [...content_rule.json.conditions];
      conditions.splice(parseInt(req.params.condition, 10), 1);
      await ContentRule.update(
        req.params.rule,
        {
          json: {
            ...content_rule.json,
            conditions,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@controlpanels/content-rules/:id',
    permission: 'Manage Site',
    client: 'deleteControlpanelContentRule',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const ContentRule = models.get('ContentRule');
      await ContentRule.deleteById(req.params.id, trx);

      return {
        status: 204,
      };
    },
  },
];
