/**
 * Workflow routes.
 * @module routes/workflow/workflow
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { pick } from 'es-toolkit/object';

// Internal imports
import { hasPermission } from '../../helpers/auth/auth';
import { RequestException } from '../../helpers/error/error';
import { mapAsync } from '../../helpers/utils/utils';
import { checkGuard } from '../../helpers/workflow/workflow';

dayjs.extend(utc);

/**
 * Check a transition on all children of a document
 * @method checkChildren
 * @param {Request} req Request object.
 * @param {Object} document Document object.
 * @param {string} transition Transition id.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<void>} Throws when the transition can't be applied.
 */
async function checkChildren(
  req: Request,
  document: any,
  transition: string,
  trx: Knex.Transaction,
): Promise<void> {
  await document.fetchChildren({}, trx, false);
  await mapAsync(document._children, async (child: any) => {
    const check = await child.checkTransition(
      transition,
      req.user,
      trx,
      undefined,
      req,
    );
    if (check !== 'apply' && check !== 'same') {
      throw new RequestException(400, {
        error: {
          type: 'WorkflowException',
          message: req.i18n(
            'Transition {transition} is not available for {path}.',
            { transition, path: child.path },
          ),
        },
      });
    }
    await checkChildren(req, child, transition, trx);
  });
}

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const context = {
    document: req.document,
    user: req.user,
    trx,
    req,
    roles: req.roles,
    permissions: req.permissions,
  };

  // The transitions of all workflows of the chain, like listActionInfos
  const chain: { workflow: any; state: string }[] =
    await req.document.fetchWorkflowChain(trx);
  const transitions: { id: string; title: string }[] = [];
  for (const { workflow, state } of chain) {
    for (const id of await workflow.getAvailableTransitions(state, context)) {
      if (!transitions.some((transition) => transition.id === id)) {
        transitions.push({ id, title: workflow.json.transitions[id].title });
      }
    }
  }

  // The history is the review_history of the first workflow which has it
  // (the first workflow without variables), hidden from users who don't
  // pass its info guard, like in Plone
  const history =
    chain.find(({ workflow }: any) => workflow.json.variables?.review_history)
      ?.workflow ||
    chain.find(({ workflow }: any) => !workflow.json.variables)?.workflow ||
    chain[0].workflow;
  const historyGuard = history.json.variables?.review_history?.info_guard;
  const showHistory =
    !historyGuard ||
    (await checkGuard(historyGuard, { ...context, workflow: history }));
  return {
    json: chain[0].workflow.toJson(req, transitions, {
      show: showHistory,
      workflow: history,
      primary: chain[0].workflow.id,
    }),
  };
};

export default [
  {
    op: 'post',
    view: '/@workflow/:transition',
    permission: 'View',
    client: 'changeWorkflow',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const recursive = req.body?.include_children === true ? true : false;
      await req.type.fetchRelated('_workflow', trx);

      // Check the publication dates
      const dates = pick(req.body || {}, ['effective', 'expires']);
      Object.keys(dates).forEach((field: string) => {
        const value = (dates as any)[field];
        if (typeof value !== 'string' || !dayjs(value).isValid()) {
          throw new RequestException(400, {
            message: req.i18n('Invalid date for {field}.', { field }),
          });
        }
      });
      const comment =
        typeof req.body?.comment === 'string' ? req.body.comment : '';

      // Lock the document to serialize concurrent changes
      await req.document.lockForUpdate(trx);
      const transition = req.params.transition;

      // Check the transition against the current states and the guards of
      // the workflows of the chain
      const found = await req.document.findTransition(
        transition,
        req.user,
        trx,
        req.permissions,
        req,
        req.roles,
      );
      const check = found.check;
      if (check === 'unknown' || check === 'unavailable') {
        throw new RequestException(400, {
          error: {
            type: 'WorkflowException',
            message: req.i18n(
              'Transition {transition} is not available in the current state.',
              { transition },
            ),
          },
        });
      }
      if (check === 'unauthorized') {
        throw new RequestException(401, {
          message: req.i18n(
            'You are not authorization to access this resource.',
          ),
        });
      }

      // A lock of another user blocks state changes, like edits and deletes
      if (req.document.isLockedByOther(req.user.id)) {
        throw new RequestException(403, {
          error: {
            message: req.i18n('Resource is locked.'),
            type: req.i18n('Document locked'),
          },
        });
      }

      // Check the transition on all children, it is applied to all or none
      if (recursive) {
        await checkChildren(req, req.document, transition, trx);
      }

      // Return the last transition if the document is already in the new state
      if (check === 'same' && !recursive) {
        const primary = found.workflow.id === req.type._workflow.id;
        const last: any = req.document.workflow_history
          .filter(
            (item: any) =>
              (!item.type || item.type === 'workflow') &&
              (primary ? !item.workflow : item.workflow === found.workflow.id),
          )
          .pop();
        const state = found.state as string;
        return {
          json: {
            action: last?.action || null,
            actor: last?.actor || null,
            comments: last?.comments || '',
            review_state: state,
            time: last?.time || req.document.modified,
            title: req.i18n(found.workflow.json.states[state]?.title),
          },
          xkeys: [req.document.uuid],
        };
      }

      // Get new state (an empty new state stays) and modified timestamp
      const new_state =
        found.workflow.json.transitions[transition].new_state || found.state;
      const modified = dayjs.utc().format();

      // Change workflow
      await req.document.changeWorkflow(
        req.params.transition,
        req.user,
        modified,
        recursive,
        trx,
        req,
        { ...dates, comment },
      );

      // Return workflow state
      return {
        json: {
          action: req.params.transition,
          actor: req.user.id,
          comments: comment,
          review_state: new_state,
          time: modified,
          title: found.workflow.json.states[new_state].title,
        },
        xkeys: [req.document.uuid],
      };
    },
  },
  {
    op: 'post',
    view: '/@workflow',
    permission: 'View',
    cache: 'alter',
    handler: async (req: Request) => {
      throw new RequestException(400, {
        message: req.i18n('No transition specified.'),
      });
    },
  },
  {
    op: 'get',
    view: '/@workflow',
    permission: 'View',
    client: 'getWorkflow',
    cache: 'manage',
    handler,
  },
];
