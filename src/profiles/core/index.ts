/**
 * Profile configuration and setup.
 */

// Internal imports
import config from '../../helpers/config/config';

// Models
import models from '../../models';
import { Action } from '../../models/action/action';
import { Behavior } from '../../models/behavior/behavior';
import { Catalog } from '../../models/catalog/catalog';
import { ContentRule } from '../../models/content_rule/content_rule';
import { Controlpanel } from '../../models/controlpanel/controlpanel';
import { Document } from '../../models/document/document';
import { File } from '../../models/file/file';
import { Form } from '../../models/form/form';
import { Group } from '../../models/group/group';
import { Index } from '../../models/index/index';
import { Job } from '../../models/job/job';
import { Permission } from '../../models/permission/permission';
import { Profile } from '../../models/profile/profile';
import { Redirect } from '../../models/redirect/redirect';
import { Role } from '../../models/role/role';
import { ScheduledJob } from '../../models/scheduled_job/scheduled_job';
import { Type } from '../../models/type/type';
import { User } from '../../models/user/user';
import { Version } from '../../models/version/version';
import { Vocabulary } from '../../models/vocabulary/vocabulary';
import { Workflow } from '../../models/workflow/workflow';

// Blobs
import blobs from '../../blobs';
import { db } from '../../blobs/db/db';
import { file } from '../../blobs/file/file';
import { s3 } from '../../blobs/s3/s3';

// Blocks
import blocks from '../../blocks';
import { html } from '../../blocks/html/html';
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
import { seedScheduledJob } from '../../seeds/scheduled_job/scheduled_job';
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

// Scheduled jobs
import scheduledJobs from '../../scheduled_jobs';
import { reindex } from '../../scheduled_jobs/actions/reindex';

// Routes
import routes from '../../routes';
import actionsRoutes from '../../routes/actions/actions';
import aiRoutes from '../../routes/ai/ai';
import aliasesRoutes from '../../routes/aliases/aliases';
import authenticationRoutes from '../../routes/authentication/authentication';
import breadcrumbsRoutes from '../../routes/breadcrumbs/breadcrumbs';
import catalogRoutes from '../../routes/catalog/catalog';
import commentsRoutes from '../../routes/comments/comments';
import contentRoutes from '../../routes/content/content';
import contentRulesRoutes from '../../routes/content_rules/content_rules';
import contextnavigationRoutes from '../../routes/contextnavigation/contextnavigation';
import controlpanelsRoutes from '../../routes/controlpanels/controlpanels';
import databaseRoutes from '../../routes/database/database';
import emailRoutes from '../../routes/email/email';
import formRoutes from '../../routes/form/form';
import groupsRoutes from '../../routes/groups/groups';
import healthRoutes from '../../routes/health/health';
import historyRoutes from '../../routes/history/history';
import inheritRoutes from '../../routes/inherit/inherit';
import jobsRoutes from '../../routes/jobs/jobs';
import linkintegrityRoutes from '../../routes/linkintegrity/linkintegrity';
import lockRoutes from '../../routes/lock/lock';
import navigationRoutes from '../../routes/navigation/navigation';
import navrootRoutes from '../../routes/navroot/navroot';
import nickRoutes from '../../routes/nick/nick';
import principalsRoutes from '../../routes/principals/principals';
import querystringRoutes from '../../routes/querystring/querystring';
import recyclebinRoutes from '../../routes/recyclebin/recyclebin';
import relatedRoutes from '../../routes/related/related';
import replaceRoutes from '../../routes/replace/replace';
import rolesRoutes from '../../routes/roles/roles';
import scheduledJobsRoutes from '../../routes/scheduled_jobs/scheduled_jobs';
import searchRoutes from '../../routes/search/search';
import sharingRoutes from '../../routes/sharing/sharing';
import siteRoutes from '../../routes/site/site';
import systemRoutes from '../../routes/system/system';
import translationsRoutes from '../../routes/translations/translations';
import typesRoutes from '../../routes/types/types';
import usersRoutes from '../../routes/users/users';
import userschemaRoutes from '../../routes/userschema/userschema';
import vocabulariesRoutes from '../../routes/vocabularies/vocabularies';
import workflowRoutes from '../../routes/workflow/workflow';

export function init(): void {
  // Register models
  models.register('Action', () => Action);
  models.register('Behavior', () => Behavior);
  models.register('Catalog', () => Catalog);
  models.register('ContentRule', () => ContentRule);
  models.register('Controlpanel', () => Controlpanel);
  models.register('Document', () => Document);
  models.register('File', () => File);
  models.register('Form', () => Form);
  models.register('Group', () => Group);
  models.register('Index', () => Index);
  models.register('Job', () => Job);
  models.register('Permission', () => Permission);
  models.register('Profile', () => Profile);
  models.register('Redirect', () => Redirect);
  models.register('Role', () => Role);
  models.register('ScheduledJob', () => ScheduledJob);
  models.register('Type', () => Type);
  models.register('User', () => User);
  models.register('Version', () => Version);
  models.register('Vocabulary', () => Vocabulary);
  models.register('Workflow', () => Workflow);

  // Register blobs
  blobs.register('db', db);
  blobs.register('file', file);
  blobs.register('s3', s3);

  // Register blocks
  blocks.register('html', html);
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
  seeds.register(seedScheduledJob);
  seeds.register(seedDocument);
  seeds.register(seedRedirect);
  seeds.register(seedAction);
  seeds.register(seedControlpanel);
  seeds.register(seedVocabulary);

  // Register behaviors
  behaviors.register('children_from_query', children_from_query);
  behaviors.register('id_from_title', id_from_title);

  // Register content rules actions
  contentRules.registerAction('copy_item', copy_item);
  contentRules.registerAction('delete_item', delete_item);
  contentRules.registerAction('logger', logger);
  contentRules.registerAction('move_item', move_item);
  contentRules.registerAction('send_email', send_email);
  contentRules.registerAction('transition_workflow', transition_workflow);
  contentRules.registerAction('version_item', version_item);

  // Register content rules actions
  contentRules.registerCondition('content_type', content_type);
  contentRules.registerCondition('file_extension', file_extension);
  contentRules.registerCondition('user_group', user_group);
  contentRules.registerCondition('user_role', user_role);
  contentRules.registerCondition('workflow_state', workflow_state);

  // Register scheduled job actions
  scheduledJobs.registerAction('reindex', reindex);

  // Routes
  routes.register(contentRoutes); // Register content routes first as they are the fallback
  routes.register(actionsRoutes);
  routes.register(aiRoutes);
  routes.register(aliasesRoutes);
  routes.register(authenticationRoutes);
  routes.register(breadcrumbsRoutes);
  routes.register(catalogRoutes);
  routes.register(commentsRoutes);
  routes.register(contentRulesRoutes);
  routes.register(contextnavigationRoutes);
  routes.register(controlpanelsRoutes);
  routes.register(databaseRoutes);
  routes.register(emailRoutes);
  routes.register(formRoutes);
  routes.register(groupsRoutes);
  routes.register(healthRoutes);
  routes.register(historyRoutes);
  routes.register(inheritRoutes);
  routes.register(jobsRoutes);
  routes.register(linkintegrityRoutes);
  routes.register(lockRoutes);
  routes.register(navigationRoutes);
  routes.register(navrootRoutes);
  routes.register(nickRoutes);
  routes.register(principalsRoutes);
  routes.register(querystringRoutes);
  routes.register(recyclebinRoutes);
  routes.register(relatedRoutes);
  routes.register(replaceRoutes);
  routes.register(rolesRoutes);
  routes.register(searchRoutes);
  routes.register(scheduledJobsRoutes);
  routes.register(sharingRoutes);
  routes.register(siteRoutes);
  routes.register(systemRoutes);
  routes.register(translationsRoutes);
  routes.register(typesRoutes);
  routes.register(usersRoutes);
  routes.register(userschemaRoutes);
  routes.register(vocabulariesRoutes);
  routes.register(workflowRoutes);
}
