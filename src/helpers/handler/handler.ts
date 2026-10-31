/**
 * Handler helper.
 * @module helpers/handler/handler
 */

// Type imports
import type { Callback, Request, Route, View } from '../../types';

// External imports
import { compact, uniq } from 'es-toolkit/array';
import type { Knex } from 'knex';

// Internal imports
import { getUserId, hasPermission } from '../auth/auth';
import { RequestException } from '../error/error';
import models from '../../models';
import { getPath } from '../url/url';

/**
 * Resolve and call handler
 * @method callHandler
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object.
 * @param {Object} route Route object.
 * @param {Function} callback Callback function.
 * @returns {Promise<View>} Response
 */
export async function callHandler(
  req: Request,
  trx: Knex.Transaction,
  route: Route,
  callback: Callback,
): Promise<View> {
  const User = models.get('User');
  const Document = models.get('Document');
  const Redirect = models.get('Redirect');
  const Role = models.get('Role');
  const Type = models.get('Type');

  // Fetch a user with its roles and groups in one query
  const fetchUser = async (id: string) =>
    await User.query(trx)
      .withGraphJoined('[_roles, _groups._roles]')
      .findById(id);

  // Get user
  req.user = await fetchUser(getUserId(req) || 'anonymous');

  // If user not found (e.g. deleted) or token not in user model
  if (
    !req.user ||
    (req.user.id !== 'anonymous' &&
      (!req.token || !(req.user.tokens || []).includes(req.token)))
  ) {
    // Set anonymous user
    req.user = await fetchUser('anonymous');
  }

  // Traverse to document, the root and the documents along the path are
  // fetched with one query
  const result = await Document.traverseFromRoot(
    compact(getPath(req).split('/')), // Slugs
    req.user,
    trx,
  );

  // If result not found
  if (!result) {
    // Find redirect
    const redirect = await Redirect.fetchByPath(getPath(req), trx);

    // If no redirect found
    if (!redirect) {
      throw new RequestException(404, {
        error: req.i18n('Not found: {url}', { url: getPath(req) }),
      });
    }

    // Send redirect
    throw new RequestException(301, `${redirect._document.path}${route.view}`);
  }

  // Get results
  const { document, localRoles } = result;
  const mergedRoles = uniq([...localRoles, ...req.user.getRoles()]);
  const permissions = await Role.fetchPermissions(mergedRoles, trx);

  // Find type, traverse already fetched it for documents below the root
  const type = document._type || (await Type.fetchById(document.type, {}, trx));

  // Check if type found
  if (!type) {
    throw new RequestException(500, {
      message: req.i18n('Type of the current document is not found.'),
    });
  }

  // Get workflow
  if (!type._workflow) {
    await type.fetchRelated('_workflow', trx);
  }

  // Apply behaviors
  await document.applyBehaviors(trx);

  // Call handler
  req.document = document;
  req.navroot = result.navroot;
  req.type = type;
  req.roles = mergedRoles;
  document._type = type;
  req.permissions = await document.applyWorkflowPermissions(
    mergedRoles,
    permissions,
    trx,
  );

  // Check permission, like plone.restapi a missing permission is
  // 401 Unauthorized for anonymous and authenticated users
  if (!hasPermission(req.permissions, route.permission)) {
    throw new RequestException(401, {
      message: req.i18n('You are not authorized to access this resource.'),
    });
  }

  // Call view
  return route.handler(req, trx, callback);
}
