/**
 * DCWorkflow helper: load Plone workflow definitions (the GenericSetup
 * `workflows/<id>/definition.xml` files and `workflows.xml`) as Nick
 * workflows.
 * @module helpers/dcworkflow/dcworkflow
 */

// Type imports
import type { WorkflowGuard } from '../../types';

// Internal imports
import { checkExpression } from '../expression/expression';
import {
  mapPermission,
  mapRole,
  permissionMapping,
} from '../workflow/workflow';

export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string;
}

/**
 * Unescape xml entities.
 * @method unescapeXml
 * @param {string} value Escaped value.
 * @returns {string} Unescaped value.
 */
function unescapeXml(value: string): string {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (_match: string, entity: string) => {
      if (entity[0] === '#') {
        return String.fromCodePoint(
          entity[1].toLowerCase() === 'x'
            ? parseInt(entity.substring(2), 16)
            : parseInt(entity.substring(1), 10),
        );
      }
      return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as any)[
        entity.toLowerCase()
      ];
    },
  );
}

/**
 * Parse a (simple) xml document, like the GenericSetup workflow export.
 * @method parseXml
 * @param {string} xml Xml string.
 * @returns {XmlElement} Root element.
 */
export function parseXml(xml: string): XmlElement {
  const root: XmlElement = { name: '', attributes: {}, children: [], text: '' };
  const stack: XmlElement[] = [root];
  const tokens =
    /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let match;

  while ((match = tokens.exec(xml)) !== null) {
    const current = stack[stack.length - 1];
    if (match[1] !== undefined) {
      current.text += match[1];
    } else if (match[3] !== undefined) {
      if (match[2] === '/') {
        stack.pop();
      } else {
        const element: XmlElement = {
          name: match[3],
          attributes: {},
          children: [],
          text: '',
        };
        const attributes = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
        let attribute;
        while ((attribute = attributes.exec(match[4])) !== null) {
          element.attributes[attribute[1]] = unescapeXml(
            attribute[2] ?? attribute[3],
          );
        }
        current.children.push(element);
        if (match[5] !== '/') {
          stack.push(element);
        }
      }
    } else if (match[6] !== undefined) {
      current.text += unescapeXml(match[6]);
    }
  }
  return root.children[0];
}

/**
 * Get child elements by name.
 * @method children
 * @param {XmlElement} element Parent element.
 * @param {string} name Name of the children.
 * @returns {XmlElement[]} Child elements.
 */
function children(element: XmlElement | undefined, name: string) {
  return (element?.children || []).filter((child) => child.name === name);
}

/**
 * Get the text of the first child element.
 * @method childText
 * @param {XmlElement} element Parent element.
 * @param {string} name Name of the child.
 * @returns {string} Trimmed text, empty if there is no child.
 */
function childText(element: XmlElement | undefined, name: string): string {
  return children(element, name)[0]?.text.trim() || '';
}

/**
 * Map a role in a workflow definition. A permission for `Anonymous` is a
 * permission for everybody in Plone, logged in users in Nick only have the
 * `Authenticated` role.
 * @method mapWorkflowRole
 * @param {string} role Plone role.
 * @returns {string[]} Nick roles.
 */
export function mapWorkflowRole(role: string): string[] {
  return role === 'Anonymous'
    ? ['Anonymous', 'Authenticated']
    : [mapRole(role)];
}

/**
 * Convert a DCWorkflow guard.
 * @method convertGuard
 * @param {XmlElement} element Element containing the guard.
 * @param {string} where Description of the guard for warnings.
 * @param {string[]} warnings Warnings, added to.
 * @returns {WorkflowGuard | undefined} Guard, undefined if it has no parts.
 */
function convertGuard(
  element: XmlElement | undefined,
  where: string,
  warnings: string[],
): WorkflowGuard | undefined {
  const guard = children(element, 'guard')[0];
  if (!guard) {
    return undefined;
  }
  const result: WorkflowGuard = {};

  // Any of the permissions; Plone permissions without a Nick equivalent
  // are dropped, a guard with only those is limited to Manage Site
  const permissions = children(guard, 'guard-permission').map((item) =>
    item.text.trim(),
  );
  if (permissions.length > 0) {
    const mapped = [
      ...new Set(
        permissions
          .filter((permission) => Object.hasOwn(permissionMapping, permission))
          .map(mapPermission),
      ),
    ];
    const dropped = permissions.filter(
      (permission) => !Object.hasOwn(permissionMapping, permission),
    );
    if (dropped.length > 0) {
      warnings.push(
        `${where}: guard permissions without a Nick equivalent dropped: ${dropped.join(', ')}${mapped.length === 0 ? ' (Manage Site required instead)' : ''}`,
      );
    }
    result.permissions = mapped.length > 0 ? mapped : ['Manage Site'];
  }
  const roles = children(guard, 'guard-role').map((item) =>
    mapRole(item.text.trim()),
  );
  if (roles.length > 0) {
    result.roles = [...new Set(roles)];
  }
  const groups = children(guard, 'guard-group').map((item) => item.text.trim());
  if (groups.length > 0) {
    result.groups = groups;
  }
  const expr = childText(guard, 'guard-expression');
  if (expr) {
    result.expr = expr;
    const reason = checkExpression(expr);
    if (reason) {
      result.unsupported = reason;
      warnings.push(
        `${where}: unsupported guard expression "${expr}" (${reason}), it denies`,
      );
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Convert a typed value of a DCWorkflow variable or state assignment.
 * @method convertValue
 * @param {string} value Value.
 * @param {string} type Type (`string`, `int`, `float`, `bool`, ...).
 * @returns {any} Value.
 */
function convertValue(value: string, type?: string): any {
  switch (type) {
    case 'int':
    case 'long':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value);
    case 'bool':
      return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
    case 'none':
      return null;
    default:
      return value;
  }
}

/**
 * Convert the variables of a DCWorkflow definition.
 * @method convertVariables
 * @param {XmlElement} definition Definition.
 * @param {string} workflowId Id of the workflow.
 * @param {string[]} warnings Warnings, added to.
 * @returns {Object} Variables by id.
 */
function convertVariables(
  definition: XmlElement,
  workflowId: string,
  warnings: string[],
): Record<string, any> {
  const variables: Record<string, any> = {};
  children(definition, 'variable').map((element) => {
    const id = element.attributes.variable_id;
    const fallback = children(element, 'default')[0];
    const value = children(fallback, 'value')[0];
    const expr = childText(fallback, 'expression');
    const infoGuard = convertGuard(
      element,
      `${workflowId}, variable ${id}`,
      warnings,
    );
    const reason = expr ? checkExpression(expr) : undefined;
    if (reason) {
      warnings.push(
        `${workflowId}, variable ${id}: unsupported expression "${expr}" (${reason}), it is null`,
      );
    }
    variables[id] = {
      description: childText(element, 'description'),
      ...(value && value.text.trim() !== ''
        ? { default_value: convertValue(value.text, value.attributes.type) }
        : {}),
      ...(expr ? { default_expr: expr } : {}),
      for_catalog: element.attributes.for_catalog === 'True',
      for_status: element.attributes.for_status === 'True',
      update_always: element.attributes.update_always === 'True',
      ...(infoGuard ? { info_guard: infoGuard } : {}),
      ...(reason ? { unsupported: reason } : {}),
    };
  });
  return variables;
}

/**
 * Convert the worklists of a DCWorkflow definition.
 * @method convertWorklists
 * @param {XmlElement} definition Definition.
 * @param {string} workflowId Id of the workflow.
 * @param {string[]} warnings Warnings, added to.
 * @returns {Object} Worklists by id.
 */
function convertWorklists(
  definition: XmlElement,
  workflowId: string,
  warnings: string[],
): Record<string, any> {
  const worklists: Record<string, any> = {};
  children(definition, 'worklist').map((element) => {
    const id = element.attributes.worklist_id;
    const action = children(element, 'action')[0];
    const guard = convertGuard(
      element,
      `${workflowId}, worklist ${id}`,
      warnings,
    );
    worklists[id] = {
      title: element.attributes.title || '',
      description: childText(element, 'description'),
      match: Object.fromEntries(
        children(element, 'match').map((match) => [
          match.attributes.name,
          (match.attributes.values || '').split(/;\s*/),
        ]),
      ),
      ...(guard ? { guard } : {}),
      ...(action
        ? {
            action: {
              name: action.text.trim(),
              url: action.attributes.url || '',
              category: action.attributes.category || 'global',
            },
          }
        : {}),
    };
  });
  return worklists;
}

/**
 * Convert a DCWorkflow definition (GenericSetup `definition.xml`). The
 * permission maps of the states become Nick's role to permissions mapping
 * (only permissions with a Nick equivalent, see `permissionMapping`),
 * `acquired` permission maps the state's `acquire` list, and the guards of
 * the transitions Nick guards, the variables and their assignments Nick
 * variables, and the worklists Nick worklists. Scripts and group maps are not converted, they are listed in
 * the warnings.
 * @method convertDefinition
 * @param {string} xml Workflow definition.
 * @param {string} id Id of the workflow, defaults to the `workflow_id`.
 * @returns {Object} Nick workflow and warnings.
 */
export function convertDefinition(
  xml: string,
  id?: string,
): { workflow: any; warnings: string[] } {
  const definition = parseXml(xml);
  if (!definition || definition.name !== 'dc-workflow') {
    throw new Error('Not a DCWorkflow definition (dc-workflow).');
  }
  const workflowId = id || definition.attributes.workflow_id;
  const warnings: string[] = [];
  const states: Record<string, any> = {};
  const transitions: Record<string, any> = {};

  // Permissions managed by the workflow
  const managed = children(definition, 'permission').map((item) =>
    item.text.trim(),
  );
  const unmapped = managed.filter(
    (permission) => !Object.hasOwn(permissionMapping, permission),
  );
  if (unmapped.length > 0) {
    warnings.push(
      `${workflowId}: permissions without a Nick equivalent are not managed: ${unmapped.join(', ')}`,
    );
  }
  const stateVariable = definition.attributes.state_variable;
  if (stateVariable && stateVariable !== 'review_state') {
    warnings.push(
      `${workflowId}: the state variable ${stateVariable} is stored as the review state`,
    );
  }

  children(definition, 'state').map((state) => {
    const stateId = state.attributes.state_id;
    const permissions: Record<string, string[]> = {};
    const acquire: string[] = [];
    children(state, 'permission-map').map((map) => {
      if (!Object.hasOwn(permissionMapping, map.attributes.name)) {
        return;
      }
      const permission = mapPermission(map.attributes.name);
      if (map.attributes.acquired === 'True') {
        acquire.push(permission);
      }
      children(map, 'permission-role').map((role) =>
        mapWorkflowRole(role.text.trim()).map((nickRole) => {
          permissions[nickRole] = [
            ...new Set([...(permissions[nickRole] || []), permission]),
          ];
        }),
      );
    });
    // A managed permission without a map in the state is acquired
    // (DCWorkflow updateRoleMappingsFor sets an empty, acquiring list)
    const mapped = children(state, 'permission-map').map(
      (map) => map.attributes.name,
    );
    managed
      .filter(
        (permission) =>
          Object.hasOwn(permissionMapping, permission) &&
          !mapped.includes(permission),
      )
      .map((permission) => acquire.push(mapPermission(permission)));
    if (children(state, 'group-map').length > 0) {
      warnings.push(
        `${workflowId}, state ${stateId}: group maps (local roles of groups by state) are not converted`,
      );
    }
    const assignments = Object.fromEntries(
      children(state, 'assignment').map((assignment) => [
        assignment.attributes.name,
        convertValue(assignment.text, assignment.attributes.type),
      ]),
    );
    states[stateId] = {
      title: state.attributes.title || stateId,
      description: childText(state, 'description'),
      transitions: children(state, 'exit-transition').map(
        (transition) => transition.attributes.transition_id,
      ),
      permissions,
      ...(acquire.length > 0 ? { acquire: [...new Set(acquire)] } : {}),
      ...(Object.keys(assignments).length > 0
        ? { variables: assignments }
        : {}),
    };
  });

  children(definition, 'transition').map((transition) => {
    const transitionId = transition.attributes.transition_id;
    const action = children(transition, 'action')[0];
    const actionName = action?.text.trim() || '';
    const trigger = transition.attributes.trigger || 'USER';
    const guard = convertGuard(
      transition,
      `${workflowId}, transition ${transitionId}`,
      warnings,
    );
    ['before_script', 'after_script'].map((script) => {
      if (transition.attributes[script]) {
        warnings.push(
          `${workflowId}, transition ${transitionId}: the ${script.replace('_', ' ')} ${transition.attributes[script]} is not converted`,
        );
      }
    });
    // Unsupported expressions are left out, the variable gets its default
    const assignments = Object.fromEntries(
      children(transition, 'assignment')
        .map((assignment) => [
          assignment.attributes.name,
          assignment.text.trim(),
        ])
        .filter(([name, expr]) => {
          const reason = checkExpression(expr);
          if (reason) {
            warnings.push(
              `${workflowId}, transition ${transitionId}: unsupported expression "${expr}" for ${name} (${reason}), not converted`,
            );
          }
          return !reason;
        }),
    );
    transitions[transitionId] = {
      ...(Object.keys(assignments).length > 0
        ? { variables: assignments }
        : {}),
      title: actionName || transition.attributes.title || transitionId,
      description: childText(transition, 'description'),
      new_state: transition.attributes.new_state || '',
      ...(guard ? { guard } : {}),
      ...(trigger === 'AUTOMATIC' ? { trigger: 'automatic' } : {}),
      // Plone offers only transitions with an action in the workflow
      // category, WORKFLOW triggers are called by code
      ...(trigger === 'WORKFLOW' ||
      (trigger === 'USER' &&
        (!actionName || (action?.attributes.category || '') !== 'workflow'))
        ? { hidden: true }
        : {}),
    };
  });

  return {
    workflow: {
      id: workflowId,
      title: definition.attributes.title || workflowId,
      description: (definition.attributes.description || '')
        .replace(/\s+-\s+/g, ' ')
        .replace(/^\s*-\s+/, '')
        .trim(),
      json: {
        initial_state: definition.attributes.initial_state,
        ...(definition.attributes.manager_bypass === 'True'
          ? { manager_bypass: true }
          : {}),
        managed_permissions: [
          ...new Set(
            managed
              .filter((permission) =>
                Object.hasOwn(permissionMapping, permission),
              )
              .map(mapPermission),
          ),
        ],
        ...(children(definition, 'variable').length > 0
          ? { variables: convertVariables(definition, workflowId, warnings) }
          : {}),
        ...(children(definition, 'worklist').length > 0
          ? { worklists: convertWorklists(definition, workflowId, warnings) }
          : {}),
        states,
        transitions,
      },
    },
    warnings,
  };
}

/**
 * Convert a DCWorkflow definition, without the warnings.
 * @method convertWorkflow
 * @param {string} xml Workflow definition.
 * @param {string} id Id of the workflow, defaults to the `workflow_id`.
 * @returns {Object} Nick workflow.
 */
export function convertWorkflow(xml: string, id?: string): any {
  return convertDefinition(xml, id).workflow;
}

/**
 * Get the workflow chains of the types from the GenericSetup
 * `workflows.xml`.
 * @method parseWorkflowBindings
 * @param {string} xml Workflow tool export.
 * @returns {Object} Default chain and chains by type, an empty chain means no workflow.
 */
export function parseWorkflowBindings(xml: string): {
  default: string[];
  types: Record<string, string[]>;
} {
  const bindings = children(parseXml(xml), 'bindings')[0];
  const chain = (element: XmlElement | undefined) =>
    children(element, 'bound-workflow').map(
      (workflow) => workflow.attributes.workflow_id,
    );
  return {
    default: chain(children(bindings, 'default')[0]),
    types: Object.fromEntries(
      children(bindings, 'type').map((type) => [
        type.attributes.type_id,
        chain(type),
      ]),
    ),
  };
}
