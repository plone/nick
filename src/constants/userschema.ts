/**
 * User Schema.
 * @module constants/userschema
 */

// Type imports
import type { Request } from '../types';

const userschema = (req: Request) => ({
  fieldsets: [
    {
      id: 'default',
      title: req.i18n('Default'),
      fields: ['description', 'home_page', 'location', 'portrait'],
    },
  ],
  properties: {
    description: {
      description: req.i18n(
        'A short overview of who you are and what you do. Will be displayed on your author page, linked from the items you create.',
      ),
      title: req.i18n('Biography'),
      type: 'string',
      widget: 'textarea',
    },
    home_page: {
      description: req.i18n(
        'The URL for your external home page, if you have one.',
      ),
      title: req.i18n('Home Page'),
      type: 'string',
      widget: 'url',
    },
    location: {
      description: req.i18n(
        'Your location - either city and country - or in a company setting, where your office is located.',
      ),
      title: req.i18n('Location'),
      type: 'string',
    },
    portrait: {
      description: req.i18n('Your portrait photo.'),
      title: req.i18n('Portrait'),
      type: 'object',
      widget: 'file',
      factory: 'Image',
    },
  },
  required: [],
});

export default userschema;
