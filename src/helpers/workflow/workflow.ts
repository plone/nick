/**
 * Workflow helper: guards and the names available to workflow expressions.
 * @module helpers/workflow/workflow
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, WorkflowGuard } from '../../types';

// External imports
import { uniq } from 'es-toolkit/array';

// Internal imports
import {
  type ExpressionObject,
  type ExpressionScope,
  TraversalError,
  compileExpression,
  getExpressionMethod,
  truthy,
} from '../expression/expression';
import { log } from '../log/log';
import models from '../../models';

/**
 * Plone permissions which map to Nick permissions, in workflow definitions
 * and expressions. Other permissions keep their name.
 */
export const permissionMapping: Record<string, string> = {
  View: 'View',
  'Modify portal content': 'Modify',
  'Add portal content': 'Add',
  'Review portal content': 'Review',
  'Request review': 'Submit',
  'Reply to item': 'Add Comment',
  'Review comments': 'Review Comments',
  'Delete objects': 'Delete',
  'CMFEditions: Access previous versions': 'View History',
  'CMFEditions: Revert to previous versions': 'Revert',
  'Manage portal': 'Manage Site',
};

/**
 * Plone roles which map to Nick roles.
 */
export const roleMapping: Record<string, string> = {
  Manager: 'Administrator',
  'Site Administrator': 'Administrator',
  Member: 'Authenticated',
};

/**
 * Map a Plone permission to a Nick permission.
 * @method mapPermission
 * @param {string} permission Permission.
 * @returns {string} Nick permission.
 */
export function mapPermission(permission: string): string {
  return Object.hasOwn(permissionMapping, permission)
    ? permissionMapping[permission]
    : permission;
}

/**
 * Map a Plone role to a Nick role.
 * @method mapRole
 * @param {string} role Role.
 * @returns {string} Nick role.
 */
export function mapRole(role: string): string {
  return Object.hasOwn(roleMapping, role) ? roleMapping[role] : role;
}

/**
 * Add the Plone names of Nick roles, so expressions written for Plone
 * (`'Manager' in user.getRolesInContext(here)`) keep working.
 * @method withPloneRoles
 * @param {string[]} roles Nick roles.
 * @returns {string[]} Roles with their Plone names.
 */
export function withPloneRoles(roles: string[]): string[] {
  return uniq([
    ...roles,
    ...Object.keys(roleMapping).filter((role) =>
      roles.includes(roleMapping[role]),
    ),
  ]);
}

/**
 * Context of a guard check or an expression.
 */
export interface WorkflowContext {
  document: any;
  user: any;
  trx: Knex.Transaction;
  req?: Request;
  workflow?: any;
  roles?: string[];
  permissions?: string[];
  transition?: string;
  oldState?: string;
  newState?: string;
  status?: Record<string, any>;
  kwargs?: Record<string, any>;
  // Time of the transition (getDateTime)
  date?: string;
}

/**
 * Convert the value of a workflow variable to json: dates become ISO
 * strings, objects of expressions their id.
 * @method toStatusValue
 * @param {any} value Value.
 * @returns {any} Json value.
 */
export function toStatusValue(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(toStatusValue);
  }
  if (value && typeof value === 'object' && 'expressionKind' in value) {
    return value.document?.uuid ?? value.attributes?.id ?? null;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toStatusValue(item)]),
    );
  }
  return value === undefined ? null : value;
}

/**
 * Cache of the roles and permissions of the user per document, shared by
 * the objects of one evaluation.
 */
class SecurityCache {
  context: WorkflowContext;
  roles: Map<string, Promise<string[]>> = new Map();
  permissions: Map<string, Promise<string[]>> = new Map();

  constructor(context: WorkflowContext) {
    this.context = context;
    if (context.roles) {
      this.roles.set(context.document.uuid, Promise.resolve(context.roles));
    }
    if (context.permissions) {
      this.permissions.set(
        context.document.uuid,
        Promise.resolve(context.permissions),
      );
    }
  }

  fetchRoles(document: any): Promise<string[]> {
    if (!this.roles.has(document.uuid)) {
      this.roles.set(
        document.uuid,
        document.fetchUserRoles(this.context.user, this.context.trx),
      );
    }
    return this.roles.get(document.uuid)!;
  }

  fetchPermissions(document: any): Promise<string[]> {
    if (!this.permissions.has(document.uuid)) {
      this.permissions.set(
        document.uuid,
        document.fetchUserPermissions(this.context.user, this.context.trx),
      );
    }
    return this.permissions.get(document.uuid)!;
  }
}

/**
 * The content object (`here`, `object`, `context`) in expressions.
 * @class ContentObject
 */
export class ContentObject implements ExpressionObject {
  readonly expressionKind = 'content';
  document: any;
  security: SecurityCache;

  constructor(document: any, security: SecurityCache) {
    this.document = document;
    this.security = security;
  }

  get user() {
    return this.security.context.user;
  }

  get trx() {
    return this.security.context.trx;
  }

  get req() {
    return this.security.context.req;
  }

  async parent(): Promise<ContentObject | null> {
    const Document = models.get('Document');
    if (!this.document.parent) {
      return null;
    }
    const parent =
      this.document._parent ||
      (await Document.fetchById(this.document.parent, {}, this.trx));
    return parent ? new ContentObject(parent, this.security) : null;
  }

  getAttribute(name: string): any {
    const document = this.document;
    switch (name) {
      case 'id':
        return document.id;
      case 'portal_type':
        return document.type;
      case 'review_state':
        return document.workflow_state;
      case 'aq_parent':
        return this.parent();
      case 'aq_inner':
      case 'aq_base':
        return this;
      case 'REQUEST':
        return new RequestObject(this.req);
      case 'portal_membership':
        return new MembershipObject(this.security);
      case 'portal_workflow':
        return new WorkflowToolObject(this.security);
    }
    if (getExpressionMethod(name)) {
      return this.callMethod(name, []);
    }
    if (Object.hasOwn(document.json || {}, name)) {
      return document.json[name] ?? null;
    }
    if (
      Object.hasOwn(document._type?._schema?.properties || {}, name) ||
      Object.hasOwn(document._type?.schema?.properties || {}, name)
    ) {
      return null;
    }
    return getattrMissing(name);
  }

  async callMethod(name: string, args: any[]): Promise<any> {
    const document = this.document;
    const date = (value: string | undefined) =>
      value ? new Date(value) : null;
    switch (name) {
      case 'getId':
        return document.id;
      case 'Title':
        return document.json?.title || '';
      case 'Description':
        return document.json?.description || '';
      case 'UID':
        return document.uuid;
      case 'Creator':
        return document.owner;
      case 'listCreators':
        return (
          document.json?.creators || (document.owner ? [document.owner] : [])
        );
      case 'Subject':
        return document.json?.subjects || [];
      case 'Language':
        return document.language || '';
      case 'getPortalTypeName':
        return document.type;
      case 'getParentNode':
        return await this.parent();
      case 'absolute_url_path':
        return document.path;
      case 'absolute_url':
        return document.path;
      case 'getPhysicalPath':
        return ['', ...document.path.split('/').filter((part: string) => part)];
      case 'effective':
        return date(document.json?.effective);
      case 'expires':
        return date(document.json?.expires);
      case 'created':
        return date(document.created);
      case 'modified':
        return date(document.modified);
      case 'isExpired':
        return document.json?.expires
          ? new Date(document.json.expires).getTime() < Date.now()
          : false;
    }
    const method = getExpressionMethod(name);
    if (method) {
      return await method(this, ...args);
    }
    throw new Error(`Method "${name}" is not registered.`);
  }
}

/**
 * Raise the error of a missing attribute.
 * @method getattrMissing
 * @param {string} name Name of the attribute.
 */
function getattrMissing(name: string): never {
  throw new TraversalError(`No attribute "${name}".`);
}

/**
 * The user (`user`, `member`) in expressions.
 * @class UserObject
 */
export class UserObject implements ExpressionObject {
  readonly expressionKind = 'user';
  security: SecurityCache;

  constructor(security: SecurityCache) {
    this.security = security;
  }

  get user() {
    return this.security.context.user;
  }

  getAttribute(name: string): any {
    if (name === 'id') {
      return this.user.id;
    }
    return getattrMissing(name);
  }

  async rolesIn(content: any): Promise<string[]> {
    if (content instanceof ContentObject) {
      return withPloneRoles(await this.security.fetchRoles(content.document));
    }
    return withPloneRoles(this.user.getRoles());
  }

  async hasPermission(permission: string, content: any): Promise<boolean> {
    if (!(content instanceof ContentObject)) {
      throw new Error('A permission is checked on a content object.');
    }
    return (await this.security.fetchPermissions(content.document)).includes(
      mapPermission(permission),
    );
  }

  async callMethod(name: string, args: any[]): Promise<any> {
    switch (name) {
      case 'getId':
      case 'getUserId':
      case 'getUserName':
        return this.user.id === 'anonymous' ? null : this.user.id;
      case 'getRoles':
        return withPloneRoles(this.user.getRoles());
      case 'getRolesInContext':
        return await this.rolesIn(args[0]);
      case 'getGroups':
        return this.user.getGroups ? this.user.getGroups() : [];
      case 'has_role': {
        const wanted = (Array.isArray(args[0]) ? args[0] : [args[0]]).map(
          String,
        );
        const roles = await this.rolesIn(args[1]);
        return wanted.some((role) => roles.includes(role));
      }
      case 'allowed': {
        const roles = await this.rolesIn(args[0]);
        return (args[1] || []).some((role: string) => roles.includes(role));
      }
      case 'has_permission':
      case 'checkPermission':
        return await this.hasPermission(args[0], args[1]);
    }
    throw new Error(`Unknown method "${name}" of user.`);
  }
}

/**
 * The request (`request`, `here.REQUEST`) in expressions: the query
 * parameters and the body of the request.
 * @class RequestObject
 */
export class RequestObject implements ExpressionObject {
  readonly expressionKind = 'request';
  form: Record<string, any>;

  constructor(req?: Request) {
    this.form = {
      ...(req?.query || {}),
      ...(req?.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {}),
    };
  }

  getAttribute(name: string): any {
    if (name === 'form') {
      return this.form;
    }
    return Object.hasOwn(this.form, name)
      ? this.form[name]
      : getattrMissing(name);
  }

  callMethod(name: string, args: any[]): any {
    switch (name) {
      case 'get':
        return Object.hasOwn(this.form, args[0])
          ? this.form[args[0]]
          : (args[1] ?? null);
      case 'has_key':
        return Object.hasOwn(this.form, args[0]);
    }
    throw new Error(`Unknown method "${name}" of request.`);
  }
}

/**
 * `portal_membership` in expressions.
 * @class MembershipObject
 */
export class MembershipObject implements ExpressionObject {
  readonly expressionKind = 'membership';
  security: SecurityCache;

  constructor(security: SecurityCache) {
    this.security = security;
  }

  getAttribute(name: string): any {
    return getattrMissing(name);
  }

  async callMethod(name: string, args: any[]): Promise<any> {
    const user = new UserObject(this.security);
    switch (name) {
      case 'getAuthenticatedMember':
        return user;
      case 'isAnonymousUser':
        return this.security.context.user.id === 'anonymous';
      case 'checkPermission':
        return await user.hasPermission(args[0], args[1]);
    }
    throw new Error(`Unknown method "${name}" of portal_membership.`);
  }
}

/**
 * `portal_workflow` in expressions.
 * @class WorkflowToolObject
 */
export class WorkflowToolObject implements ExpressionObject {
  readonly expressionKind = 'workflowtool';
  security: SecurityCache;

  constructor(security: SecurityCache) {
    this.security = security;
  }

  getAttribute(name: string): any {
    return getattrMissing(name);
  }

  async callMethod(name: string, args: any[]): Promise<any> {
    if (name !== 'getInfoFor') {
      throw new Error(`Unknown method "${name}" of portal_workflow.`);
    }
    const [content, variable, ...rest] = args;
    if (!(content instanceof ContentObject)) {
      throw new Error('getInfoFor needs a content object.');
    }
    const value = await content.document.getWorkflowInfo(
      variable,
      this.security.context.trx,
      this.security.context.user,
    );
    if (value === undefined) {
      if (rest.length > 0) {
        return rest[0];
      }
      throw new Error(`No workflow provides "${variable}".`);
    }
    return value;
  }
}

/**
 * A simple object with an id and a title (transition, state, workflow).
 * @class NamedObject
 */
export class NamedObject implements ExpressionObject {
  readonly expressionKind: string;
  attributes: Record<string, any>;

  constructor(kind: string, attributes: Record<string, any>) {
    this.expressionKind = kind;
    this.attributes = attributes;
  }

  getAttribute(name: string): any {
    return Object.hasOwn(this.attributes, name)
      ? this.attributes[name]
      : getattrMissing(name);
  }

  callMethod(name: string): any {
    if (name === 'getId') {
      return this.attributes.id;
    }
    throw new Error(`Unknown method "${name}".`);
  }
}

/**
 * `state_change` in expressions.
 * @class StateChangeObject
 */
export class StateChangeObject implements ExpressionObject {
  readonly expressionKind = 'statechange';
  scope: ExpressionScope;
  context: WorkflowContext;
  date: Date;

  constructor(scope: ExpressionScope, context: WorkflowContext) {
    this.scope = scope;
    this.context = context;
    this.date = context.date ? new Date(context.date) : new Date();
  }

  getAttribute(name: string): any {
    switch (name) {
      case 'object':
        return this.scope.here;
      case 'workflow':
        return this.scope.workflow;
      case 'transition':
        return this.scope.transition;
      case 'old_state':
      case 'new_state': {
        const id =
          name === 'old_state' ? this.context.oldState : this.context.newState;
        return id ? stateObject(this.context.workflow, id) : null;
      }
      case 'status':
        return this.scope.status;
      case 'kwargs':
        return this.scope.kwargs;
    }
    return getattrMissing(name);
  }

  callMethod(name: string): any {
    switch (name) {
      case 'getHistory':
        return (this.context.document.workflow_history || []).filter(
          (item: any) =>
            (!item.type || item.type === 'workflow') &&
            (item.workflow || this.context.workflow?.id) ===
              this.context.workflow?.id,
        );
      case 'getDateTime':
        return this.date;
      case 'getPortal':
        return this.scope.portal;
    }
    throw new Error(`Unknown method "${name}" of state_change.`);
  }
}

/**
 * Get the state object of a workflow.
 * @method stateObject
 * @param {Object} workflow Workflow.
 * @param {string} id Id of the state.
 * @returns {NamedObject} State.
 */
function stateObject(workflow: any, id: string): NamedObject {
  return new NamedObject('state', {
    id,
    title: workflow?.json?.states?.[id]?.title || id,
  });
}

/**
 * Get the names available to an expression.
 * @method getExpressionScope
 * @param {WorkflowContext} context Context.
 * @returns {Promise<ExpressionScope>} Names.
 */
export async function getExpressionScope(
  context: WorkflowContext,
): Promise<ExpressionScope> {
  const Document = models.get('Document');
  const security = new SecurityCache(context);
  const here = new ContentObject(context.document, security);
  const user = new UserObject(security);
  const container = await here.parent();
  const root = context.document.parent
    ? await Document.fetchOne({ path: '/' }, {}, context.trx)
    : context.document;
  const transition = context.transition
    ? new NamedObject('transition', {
        id: context.transition,
        title:
          context.workflow?.json?.transitions?.[context.transition]?.title ||
          context.transition,
        new_state_id:
          context.workflow?.json?.transitions?.[context.transition]
            ?.new_state || '',
      })
    : null;
  const scope: ExpressionScope = {
    here,
    object: here,
    context: here,
    container,
    folder: container,
    portal: root ? new ContentObject(root, security) : null,
    user,
    member: user,
    request: new RequestObject(context.req),
    REQUEST: new RequestObject(context.req),
    transition,
    status: context.status || {},
    kwargs: context.kwargs || {},
    workflow: context.workflow
      ? new NamedObject('workflow', {
          id: context.workflow.id,
          title: context.workflow.title,
        })
      : null,
  };
  scope.state_change = new StateChangeObject(scope, context);
  return scope;
}

/**
 * Evaluate an expression in a workflow context.
 * @method evaluateWorkflowExpression
 * @param {string} expression Expression.
 * @param {WorkflowContext} context Context.
 * @returns {Promise<any>} Value.
 */
export async function evaluateWorkflowExpression(
  expression: string,
  context: WorkflowContext,
): Promise<any> {
  return await compileExpression(expression).evaluate(
    await getExpressionScope(context),
  );
}

/**
 * Check a guard like DCWorkflow: the user needs one of the permissions,
 * one of the roles and one of the groups (each when given), and the
 * expression has to be true. With `manager_bypass` on the workflow an
 * Administrator passes every guard. An expression that is not supported or
 * fails denies, it is logged.
 * @method checkGuard
 * @param {WorkflowGuard} guard Guard.
 * @param {WorkflowContext} context Context.
 * @returns {Promise<boolean>} True if the guard passes.
 */
export async function checkGuard(
  guard: WorkflowGuard | undefined,
  context: WorkflowContext,
): Promise<boolean> {
  if (!guard) {
    return true;
  }
  const roles =
    context.roles ||
    (await context.document.fetchUserRoles(context.user, context.trx));
  if (
    context.workflow?.json?.manager_bypass &&
    roles.includes('Administrator')
  ) {
    return true;
  }
  if (guard.permissions && guard.permissions.length > 0) {
    const permissions =
      context.permissions ||
      (await context.document.fetchUserPermissions(context.user, context.trx));
    if (
      !guard.permissions.some((permission) => permissions.includes(permission))
    ) {
      return false;
    }
  }
  if (guard.roles && guard.roles.length > 0) {
    if (!guard.roles.some((role) => roles.includes(role))) {
      return false;
    }
  }
  if (guard.groups && guard.groups.length > 0) {
    const groups = context.user.getGroups ? context.user.getGroups() : [];
    if (!guard.groups.some((group) => groups.includes(group))) {
      return false;
    }
  }
  if (guard.expr) {
    try {
      return truthy(
        await evaluateWorkflowExpression(guard.expr, { ...context, roles }),
      );
    } catch (err: any) {
      log.warn(
        `Guard expression "${guard.expr}" of workflow ${context.workflow?.id} denied: ${err.message}`,
      );
      return false;
    }
  }
  return true;
}
