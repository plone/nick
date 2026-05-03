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

// Internal imports
import { hasPermission } from '../../helpers/auth/auth';
import { RequestException } from '../../helpers/error/error';

dayjs.extend(utc);

export const handler = async (req: Request, trx: Knex.Transaction) => {
  await req.type.fetchRelated('_workflow', trx);
  return {
    json: req.type._workflow.toJson(req),
  };
};

export default [
  {
    op: 'post',
    view: '/@workflow/:transition',
    client: 'changeWorkflow',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const recursive = req.body?.include_children === true ? true : false;
      await req.type.fetchRelated('_workflow', trx);

      // Check permission
      if (
        !hasPermission(
          req.permissions,
          req.type._workflow.json.transitions[req.params.transition].permission,
        )
      ) {
        throw new RequestException(401, {
          message: req.i18n(
            'You are not authorization to access this resource.',
          ),
        });
      }

      // Get new state and modified timestamp
      const new_state =
        req.type._workflow.json.transitions[req.params.transition].new_state;
      const modified = dayjs.utc().format();

      // Change workflow
      await req.document.changeWorkflow(
        req.params.transition,
        req.user,
        modified,
        recursive,
        trx,
        req,
      );

      // Return workflow state
      return {
        json: {
          action: req.params.transition,
          actor: req.user.id,
          comments: '',
          review_state: new_state,
          time: modified,
          title: req.type._workflow.json.states[new_state].title,
        },
        xkeys: [req.document.uuid],
      };
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
