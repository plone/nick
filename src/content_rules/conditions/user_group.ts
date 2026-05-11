/**
 * User group condition for content rules
 * @module content_rules/conditions/user_group
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import { intersection } from 'es-toolkit/array';

export const user_group = {
  getTitle: (req: Request) => req.i18n('User’s group'),
  getDescription: (req: Request) =>
    req.i18n('Apply only when the current user is in the given group'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Groups are: {groups}', {
      groups:
        params.group_names && params.group_names.length > 0
          ? params.group_names.join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['group_names'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      group_names: {
        additionalItems: true,
        'description:i18n': 'The name of the group.',
        factory: 'Multiple Choice',
        items: {
          description: '',
          factory: 'Choice',
          title: '',
          type: 'string',
          vocabulary: {
            '@id': 'groups',
          },
        },
        'title:i18n': 'Group name',
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['group_names'],
    type: 'object',
  },
  handler: async (
    params: Params,
    _document: any,
    user: any,
    _contentRule: any,
  ) =>
    intersection(
      params.group_names,
      user._groups.map((group: any) => group.id),
    ).length > 0,
};
