/**
 * Worklists routes.
 * @module routes/worklists/worklists
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import { getBatchParams } from '../../helpers/query/query';
import { getRootUrl, getUrl } from '../../helpers/url/url';
import {
  checkGuard,
  evaluateWorkflowExpression,
} from '../../helpers/workflow/workflow';
import models from '../../models';

/**
 * Get the values of a worklist match; values with an expression type
 * (`python:`, `string:`, ...) are evaluated for the user on the site root.
 * @method matchValues
 * @param {string[]} values Values.
 * @param {Object} context Workflow context.
 * @returns {Promise<string[]>} Values.
 */
async function matchValues(values: string[], context: any): Promise<any[]> {
  const result: any[] = [];
  for (const value of values) {
    if (/^(python|string|path|not|exists):/.test(value)) {
      const evaluated = await evaluateWorkflowExpression(value, context);
      result.push(...(Array.isArray(evaluated) ? evaluated : [evaluated]));
    } else {
      result.push(value);
    }
  }
  return result;
}

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Catalog = models.get('Catalog');
  const Document = models.get('Document');
  const Index = models.get('Index');
  const Workflow = models.get('Workflow');
  const { start, size } = getBatchParams(req.query.b_start, req.query.b_size);

  // The guards are checked on the site root, like in DCWorkflow
  const root =
    req.document.path === '/'
      ? req.document
      : await Document.fetchOne({ path: '/' }, {}, trx);
  const context = {
    document: root,
    user: req.user,
    trx,
    req,
    ...(root === req.document
      ? { roles: req.roles, permissions: req.permissions }
      : {}),
  };

  // Types by workflow: where it is the first workflow of the chain (its
  // state is the review state) and where it is a further one
  const types: Record<string, { primary: string[]; other: string[] }> = {};
  const chains = await Document.fetchChains(trx);
  Object.keys(chains).map((type: string) =>
    chains[type].map((workflow: any, index: number) => {
      types[workflow.id] = types[workflow.id] || { primary: [], other: [] };
      types[workflow.id][index === 0 ? 'primary' : 'other'].push(type);
    }),
  );

  if (!req.indexes) {
    req.indexes = await Index.fetchAll({}, {}, trx);
  }

  const items: any[] = [];
  const workflows = await Workflow.fetchAll({}, { order: 'id' }, trx);
  for (const workflow of workflows.models || workflows) {
    const worklists = workflow.json.worklists || {};
    for (const id of Object.keys(worklists).sort()) {
      const worklist = worklists[id];
      if (
        !types[workflow.id] ||
        !(await checkGuard(worklist.guard, { ...context, workflow }))
      ) {
        continue;
      }

      // Match the state in the catalog (in the workflow status for further
      // workflows of a chain) and other variables in the workflow status
      const { primary, other } = types[workflow.id];
      const where: Record<string, any> = {
        _portal_type: ['=', [...primary, ...other]],
      };
      for (const [variable, values] of Object.entries(worklist.match || {}) as [
        string,
        string[],
      ][]) {
        const matched = await matchValues(values, { ...context, workflow });
        if (variable === 'review_state') {
          where['_review_state:match'] = [
            'raw',
            `(("_portal_type" = ANY(?) AND "_review_state" = ANY(?)) OR ("_portal_type" = ANY(?) AND "document" IN (SELECT document FROM document_workflow_status WHERE workflow = ? AND state = ANY(?))))`,
            [
              primary,
              matched.map(String),
              other,
              workflow.id,
              matched.map(String),
            ],
          ];
        } else {
          where[`_variable:${variable}`] = [
            'raw',
            `"document" IN (SELECT document FROM document_workflow_status WHERE workflow = ? AND variables->>? = ANY(?))`,
            [workflow.id, variable, matched.map(String)],
          ];
        }
      }
      const total = await Catalog.countRestricted(where, trx, req);
      if (total === 0) {
        continue;
      }
      const results =
        size > 0 && start < total
          ? await Catalog.fetchFewRestricted(
              where,
              { order: 'path', offset: start, limit: size },
              trx,
              req,
            )
          : [];
      const format = (text: string) =>
        (text || '')
          .replace(/%\(count\)d/g, `${total}`)
          .replace(/%\(portal_url\)s/g, getRootUrl(req));
      items.push({
        '@id': `${getUrl(req)}/@worklists/${workflow.id}/${id}`,
        id,
        workflow: workflow.id,
        title: req.i18n(
          worklist.title || worklist.description || worklist.action?.name || id,
        ),
        description: worklist.description || '',
        action: worklist.action
          ? {
              title: format(req.i18n(worklist.action.name || '')),
              url: format(worklist.action.url || ''),
              category: worklist.action.category || 'global',
            }
          : undefined,
        items: (results.models || results).map((item: any) => ({
          ...item.toJson(req),
          review_state: item.review_state,
        })),
        items_total: total,
      });
    }
  }

  return {
    json: {
      '@id': `${getUrl(req)}/@worklists`,
      items,
      items_total: items.length,
    },
  };
};

export default [
  {
    op: 'get',
    view: '/@worklists',
    permission: 'View',
    client: 'getWorklists',
    cache: 'dynamic',
    handler,
  },
];
