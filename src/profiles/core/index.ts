/**
 * Profile configuration and setup.
 */

// Internal imports
import blocks from '../../blocks';
import { slate } from '../../blocks/slate/slate';
import { title } from '../../blocks/title/title';
import events from '../../events';
import { purge } from '../../events/cache/cache';
import { content_rules } from '../../events/content_rules/content_rules';
import { push } from '../../events/push/push';
import config from '../../helpers/config/config';
import middleware from '../../middleware';
import { accessLogger } from '../../middleware/access-logger/access-logger';
import { cors } from '../../middleware/cors/cors';
import { i18n } from '../../middleware/i18n/i18n';
import { removeZopeVhosting } from '../../middleware/volto/volto';
import vocabularies from '../../vocabularies';
import { actions } from '../../vocabularies/actions/actions';
import { availableLanguages } from '../../vocabularies/available-languages/available-languages';
import { behaviors } from '../../vocabularies/behaviors/behaviors';
import { captchaProviders } from '../../vocabularies/captcha-providers/captcha-providers';
import { fields } from '../../vocabularies/fields/fields';
import { groups } from '../../vocabularies/groups/groups';
import { imageScales } from '../../vocabularies/image-scales/image-scales';
import { permissions } from '../../vocabularies/permissions/permissions';
import { roles } from '../../vocabularies/roles/roles';
import { subjects } from '../../vocabularies/subjects/subjects';
import { supportedLanguages } from '../../vocabularies/supported-languages/supported-languages';
import { systemGroups } from '../../vocabularies/system-groups/system-groups';
import { systemUsers } from '../../vocabularies/system-users/system-users';
import { types } from '../../vocabularies/types/types';
import { users } from '../../vocabularies/users/users';
import { workflows } from '../../vocabularies/workflows/workflows';
import { workflowStates } from '../../vocabularies/workflow-states/workflow-states';
import { workflowTransitions } from '../../vocabularies/workflow-transitions/workflow-transitions';

export function init(): void {
  // Register blocks
  blocks.register('title', title);
  blocks.register('slate', slate);

  // Register events
  events.register(content_rules);

  // Add purge events if enabled
  if (config.settings.cache.enabled && config.settings.cache.purge) {
    events.register(purge);
  }

  // Add push events if enabled
  if (config.settings.push?.enabled) {
    events.register(push);
  }

  // Register vocabularies
  vocabularies.register('actions', actions);
  vocabularies.register('availableLanguages', availableLanguages);
  vocabularies.register('behaviors', behaviors);
  vocabularies.register('captchaProviders', captchaProviders);
  vocabularies.register('Fields', fields);
  vocabularies.register('groups', groups);
  vocabularies.register('imageScales', imageScales);
  vocabularies.register('permissions', permissions);
  vocabularies.register('roles', roles);
  vocabularies.register('subjects', subjects);
  vocabularies.register('supportedLanguages', supportedLanguages);
  vocabularies.register('systemGroups', systemGroups);
  vocabularies.register('systemUsers', systemUsers);
  vocabularies.register('types', types);
  vocabularies.register('users', users);
  vocabularies.register('workflows', workflows);
  vocabularies.register('workflowStates', workflowStates);
  vocabularies.register('workflowTransitions', workflowTransitions);

  // Register middleware
  middleware.register(accessLogger);
  middleware.register(cors);
  middleware.register(i18n);
  middleware.register(removeZopeVhosting);
}
