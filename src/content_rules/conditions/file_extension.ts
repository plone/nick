/**
 * File extension condition for content rules
 * @module content_rules/conditions/file_extension
 */

// Type imports
import type { Params, Request } from '../../types';

export const file_extension = {
  getTitle: (req: Request) => req.i18n('File Extension'),
  getDescription: (req: Request) =>
    req.i18n('Apply only to a particular file extension'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('File extension is {extension}', {
      extension: params.file_extension || req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['file_extension'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      file_extension: {
        'description:i18n': 'The file extension to check for',
        factory: 'Text line (String)',
        'title:i18n': 'File extension',
        type: 'string',
      },
    },
    required: ['file_extension'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    _user: any,
    _contentRule: any,
  ) => {
    await document.fetchRelated('_type');

    const fileFields = await document._type.getFactoryFields('File');
    const imageFields = await document._type.getFactoryFields('Image');
    const checks = [...fileFields, ...imageFields].map((field) => {
      const value = document.json[field];
      if (value && typeof value === 'object' && 'filename' in value) {
        const extension = value.filename.split('.').pop();
        if (extension === params.file_extension) {
          return true;
        }
      }
      return false;
    });
    return checks.indexOf(true) !== -1;
  },
};
