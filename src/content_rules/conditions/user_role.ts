/**
 * User role condition for content rules
 * @module content_rules/conditions/user_role
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import { intersection } from 'es-toolkit/array';

export const user_role = {
  getTitle: (req: Request) => req.i18n('User’s role'),
  getDescription: (req: Request) =>
    req.i18n('Apply only when the current user has the given role'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Roles are: {roles}', {
      roles:
        params.role_names && params.role_names.length > 0
          ? params.role_names.join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['role_names'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      role_names: {
        additionalItems: true,
        'description:i18n': 'The roles to check for.',
        factory: 'Multiple Choice',
        items: {
          description: '',
          factory: 'Choice',
          title: '',
          type: 'string',
          vocabulary: {
            '@id': 'roles',
          },
        },
        'title:i18n': 'Roles',
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['role_names'],
    type: 'object',
  },
  handler: async (params: Params, document: any, user: any, contentRule: any) =>
    intersection(
      params.role_names,
      user._roles.map((role: any) => role.id),
    ).length > 0,
};
