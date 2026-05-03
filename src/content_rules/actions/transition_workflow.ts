/**
 * Transition workflow action for content rules
 * @module content_rules/actions/transition_workflow
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import { Knex } from 'knex';

export const transition_workflow = {
  getTitle: (req: Request) => req.i18n('Transition workflow state'),
  getDescription: (req: Request) =>
    req.i18n('Perform a workflow transition on the triggering object'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Execute transition {transition}', {
      transition: params.transition || req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['transition'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      transition: {
        'description:i18n': 'Select the workflow transition to attempt',
        factory: 'Choice',
        'title:i18n': 'Transition',
        type: 'string',
        vocabulary: {
          '@id': 'workflowTransitions',
        },
      },
    },
    required: ['transition'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ) => {
    const modified = dayjs.utc().format();

    // Change workflow
    await document.changeWorkflow(
      params.transition,
      user,
      modified,
      false,
      trx,
    );
  },
};
