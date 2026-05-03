/**
 * Content type condition for content rules
 * @module content_rules/conditions/content_type
 */

// Type imports
import type { Params, Request } from '../../types';

export const content_type = {
  getTitle: (req: Request) => req.i18n('Content type'),
  getDescription: (req: Request) =>
    req.i18n(
      'Apply only when the current content object is of a particular type',
    ),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Content type: {types}', {
      types:
        params.check_types && params.check_types.length > 0
          ? params.check_types.join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['check_types'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      check_types: {
        additionalItems: true,
        'description:i18n': 'The content type to check for.',
        factory: 'Multiple Choice',
        items: {
          description: '',
          factory: 'Choice',
          title: '',
          type: 'string',
          vocabulary: {
            '@id': 'types',
          },
        },
        'title:i18n': 'Content type',
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['check_types'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    _user: any,
    _contentRule: any,
  ) => params.check_types.includes(document.type),
};
