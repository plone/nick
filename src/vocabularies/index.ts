/**
 * Vocabularies.
 * @module vocabularies
 */

// Internal imports
import { actions } from './actions/actions';
import { availableLanguages } from './available-languages/available-languages';
import { behaviors } from './behaviors/behaviors';
import { captchaProviders } from './captcha-providers/captcha-providers';
import { groups } from './groups/groups';
import { imageScales } from './image-scales/image-scales';
import { permissions } from './permissions/permissions';
import { roles } from './roles/roles';
import { subjects } from './subjects/subjects';
import { supportedLanguages } from './supported-languages/supported-languages';
import { systemGroups } from './system-groups/system-groups';
import { systemUsers } from './system-users/system-users';
import { types } from './types/types';
import { users } from './users/users';
import { workflows } from './workflows/workflows';
import { workflowStates } from './workflow-states/workflow-states';
import { workflowTransitions } from './workflow-transitions/workflow-transitions';

import config from '../helpers/config/config';

export const vocabularies = {
  actions,
  availableLanguages,
  behaviors,
  captchaProviders,
  groups,
  imageScales,
  permissions,
  roles,
  subjects,
  supportedLanguages,
  systemGroups,
  systemUsers,
  types,
  users,
  workflows,
  workflowStates,
  workflowTransitions,
  ...('vocabularies' in config.settings ? config.settings.vocabularies : {}),
} as any;
