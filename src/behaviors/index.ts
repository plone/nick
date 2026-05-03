/**
 * Point of contact for behaviors.
 * @module behaviors
 * @example import behaviors from './behaviors';
 */

// Internal imports
import { children_from_query } from './children_from_query/children_from_query';
import { id_from_title } from './id_from_title/id_from_title';

import config from '../helpers/config/config';

const behaviors = {
  children_from_query,
  id_from_title,
  ...('behaviors' in config.settings ? config.settings.behaviors : {}),
};

export default behaviors;
