/**
 * Global routes.
 * @module routes
 */

// Internal imports
import actions from './actions/actions';
import ai from './ai/ai';
import aliases from './aliases/aliases';
import authentication from './authentication/authentication';
import breadcrumbs from './breadcrumbs/breadcrumbs';
import catalog from './catalog/catalog';
import comments from './comments/comments';
import content from './content/content';
import content_rules from './content_rules/content_rules';
import contextnavigation from './contextnavigation/contextnavigation';
import controlpanels from './controlpanels/controlpanels';
import database from './database/database';
import email from './email/email';
import form from './form/form';
import groups from './groups/groups';
import history from './history/history';
import inherit from './inherit/inherit';
import linkintegrity from './linkintegrity/linkintegrity';
import lock from './lock/lock';
import navigation from './navigation/navigation';
import navroot from './navroot/navroot';
import nick from './nick/nick';
import principals from './principals/principals';
import querystring from './querystring/querystring';
import related from './related/related';
import roles from './roles/roles';
import search from './search/search';
import sharing from './sharing/sharing';
import site from './site/site';
import system from './system/system';
import translations from './translations/translations';
import types from './types/types';
import users from './users/users';
import userschema from './userschema/userschema';
import vocabularies from './vocabularies/vocabularies';
import workflow from './workflow/workflow';

export default [
  ...actions,
  ...ai,
  ...aliases,
  ...authentication,
  ...breadcrumbs,
  ...catalog,
  ...comments,
  ...content_rules,
  ...contextnavigation,
  ...controlpanels,
  ...database,
  ...email,
  ...form,
  ...groups,
  ...history,
  ...inherit,
  ...linkintegrity,
  ...lock,
  ...navigation,
  ...navroot,
  ...nick,
  ...principals,
  ...querystring,
  ...related,
  ...roles,
  ...search,
  ...sharing,
  ...site,
  ...system,
  ...translations,
  ...types,
  ...users,
  ...userschema,
  ...vocabularies,
  ...workflow,
  ...content, // Always keep the content routes last since this is the fallback
];
