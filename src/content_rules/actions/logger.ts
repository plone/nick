/**
 * Logger action for content rules
 * @module content_rules/actions/logger
 */

// Type imports
import type { Params, Request } from '../../types';

// Internal imports
import { log } from '../../helpers/log/log';

export const logger = {
  getTitle: (req: Request) => req.i18n('Logger'),
  getDescription: (req: Request) => req.i18n('Log a particular event'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Log message {message}', {
      message: params.message || req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['message'],
        id: 'default',
        title: 'Default',
      },
    ],
    properties: {
      message: {
        default: '',
        'description:i18n':
          '&e = the triggering event, &c = the context, &u = the user',
        factory: 'Text line (String)',
        'title:i18n': 'Message',
        type: 'string',
      },
    },
    required: ['message'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    user: any,
    contentRule: any,
  ) => {
    log.info(
      params.message
        .replace(/\&e/g, contentRule.event)
        .replace(/\&c/g, document.path)
        .replace(/\&u/g, user.id) || '',
    );
  },
};
