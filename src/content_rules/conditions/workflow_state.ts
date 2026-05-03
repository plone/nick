/**
 * Workflow state condition for content rules
 * @module content_rules/conditions/workflow_state
 */

// Type imports
import type { Params, Request } from '../../types';

export const workflow_state = {
  getTitle: (req: Request) => req.i18n('Workflow state'),
  getDescription: (req: Request) =>
    req.i18n('Apply only to a objects in a particular workflow state'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Workflow states are: {states}', {
      states:
        params.wf_states && params.wf_states.length > 0
          ? params.wf_states.join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['wf_states'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      wf_states: {
        additionalItems: true,
        'description:i18n': 'The workflow states to check for.',
        factory: 'Multiple Choice',
        items: {
          description: '',
          factory: 'Choice',
          title: '',
          type: 'string',
          vocabulary: {
            '@id': 'workflowStates',
          },
        },
        'title:i18n': 'Workflow state',
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['wf_states'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    _user: any,
    _contentRule: any,
  ) => params.wf_states.includes(document.workflow_state),
};
