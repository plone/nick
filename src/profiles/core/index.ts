/**
 * Profile configuration and setup.
 */

// Internal imports
import config from '../../helpers/config/config';

// Blocks
import blocks from '../../blocks';
import { slate } from '../../blocks/slate/slate';
import { title } from '../../blocks/title/title';

// Events
import events from '../../events';
import { purge } from '../../events/cache/cache';
import { content_rules } from '../../events/content_rules/content_rules';
import { push } from '../../events/push/push';

// Middleware
import middleware from '../../middleware';
import { accessLogger } from '../../middleware/access-logger/access-logger';
import { cors } from '../../middleware/cors/cors';
import { i18n } from '../../middleware/i18n/i18n';
import { removeZopeVhosting } from '../../middleware/volto/volto';

// Seeds
import seeds from '../../seeds';
import { seedAction } from '../../seeds/action/action';
import { seedCatalog } from '../../seeds/catalog/catalog';
import { seedContentRule } from '../../seeds/content_rule/content_rule';
import { seedControlpanel } from '../../seeds/controlpanel/controlpanel';
import { seedDocument } from '../../seeds/document/document';
import { seedGroup } from '../../seeds/group/group';
import { seedPermission } from '../../seeds/permission/permission';
import { seedProfile } from '../../seeds/profile/profile';
import { seedRole } from '../../seeds/role/role';
import { seedRedirect } from '../../seeds/redirect/redirect';
import { seedType } from '../../seeds/type/type';
import { seedUser } from '../../seeds/user/user';
import { seedVocabulary } from '../../seeds/vocabulary/vocabulary';
import { seedWorkflow } from '../../seeds/workflow/workflow';

// Vocabularies
import vocabularies from '../../vocabularies';
import { actions } from '../../vocabularies/actions/actions';
import { availableLanguages } from '../../vocabularies/available-languages/available-languages';
import { behaviors as behaviorVocab } from '../../vocabularies/behaviors/behaviors';
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

// Behaviors
import behaviors from '../../behaviors';
import { children_from_query } from '../../behaviors/children_from_query/children_from_query';
import { id_from_title } from '../../behaviors/id_from_title/id_from_title';

// Content rules
import contentRules from '../../content_rules';
import { copy_item } from '../../content_rules/actions/copy_item';
import { delete_item } from '../../content_rules/actions/delete_item';
import { logger } from '../../content_rules/actions/logger';
import { move_item } from '../../content_rules/actions/move_item';
import { send_email } from '../../content_rules/actions/send_email';
import { transition_workflow } from '../../content_rules/actions/transition_workflow';
import { version_item } from '../../content_rules/actions/version_item';
import { content_type } from '../../content_rules/conditions/content_type';
import { file_extension } from '../../content_rules/conditions/file_extension';
import { user_group } from '../../content_rules/conditions/user_group';
import { user_role } from '../../content_rules/conditions/user_role';
import { workflow_state } from '../../content_rules/conditions/workflow_state';

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
  vocabularies.register('behaviors', behaviorVocab);
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

  // Register seeds
  seeds.register(seedProfile);
  seeds.register(seedPermission);
  seeds.register(seedRole);
  seeds.register(seedGroup);
  seeds.register(seedUser);
  seeds.register(seedWorkflow);
  seeds.register(seedType);
  seeds.register(seedCatalog);
  seeds.register(seedContentRule);
  seeds.register(seedDocument);
  seeds.register(seedRedirect);
  seeds.register(seedAction);
  seeds.register(seedControlpanel);
  seeds.register(seedVocabulary);

  // Register behaviors
  behaviors.register('children_from_query', children_from_query);
  behaviors.register('id_from_title', id_from_title);

  // Register content rules
  contentRules.registerAction('copy_item', copy_item);
  contentRules.registerAction('delete_item', delete_item);
  contentRules.registerAction('logger', logger);
  contentRules.registerAction('move_item', move_item);
  contentRules.registerAction('send_email', send_email);
  contentRules.registerAction('transition_workflow', transition_workflow);
  contentRules.registerAction('version_item', version_item);

  contentRules.registerCondition('content_type', content_type);
  contentRules.registerCondition('file_extension', file_extension);
  contentRules.registerCondition('user_group', user_group);
  contentRules.registerCondition('user_role', user_role);
  contentRules.registerCondition('workflow_state', workflow_state);
}
