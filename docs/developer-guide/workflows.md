---
title: Workflows
parent: Developer guide
permalink: /developer-guide/workflows
---

# Workflows

Workflows define the review and publication states that content can move through. They are defined in a `workflows.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "workflows": []
}
```

| Field       | Type      | Description                                                                      |
| ----------- | --------- | -------------------------------------------------------------------------------- |
| `purge`     | `boolean` | When `true`, all existing workflows are deleted before importing from this file. |
| `workflows` | `array`   | List of workflow definitions to create or update.                                |

### Workflow items

Each item in the `workflows` array has:

| Field              | Type     | Description                                                                |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `id`               | `string` | Unique identifier for the workflow (e.g. `"simple_publication_workflow"`). |
| `title:i18n`       | `string` | Display title.                                                             |
| `description:i18n` | `string` | Description of the workflow.                                               |
| `json`             | `object` | The workflow definition containing states and transitions.                 |

### The `json` object

| Field                 | Type      | Description                                                                                                    |
| --------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `initial_state`       | `string`  | The state ID that content starts in when first created.                                                        |
| `states`              | `object`  | A map of state IDs to their definitions.                                                                       |
| `transitions`         | `object`  | A map of transition IDs to their definitions.                                                                  |
| `permission_model`    | `string`  | `additive` or `acquire`, see [Permission models](#permission-models).                                          |
| `managed_permissions` | `array`   | Permissions managed by the workflow with the `acquire` model. Defaults to every permission used in the states. |
| `variables`           | `object`  | Workflow variables by id, see [Variables](#variables).                                                         |
| `worklists`           | `object`  | Worklists by id, see [Worklists](#worklists).                                                                  |
| `manager_bypass`      | `boolean` | Administrators pass every guard.                                                                               |

#### State definition

| Field              | Type     | Description                                                                                       |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `title:i18n`       | `string` | Display label for the state.                                                                      |
| `description:i18n` | `string` | Description of the state.                                                                         |
| `transitions`      | `array`  | Transition IDs available from this state.                                                         |
| `permissions`      | `object` | A map of role IDs to arrays of permission IDs granted in this state.                              |
| `acquire`          | `array`  | Managed permissions that also keep their global role grants in this state (`acquire` model only). |
| `variables`        | `object` | Values of workflow variables set when the state is entered.                                       |

#### Transition definition

| Field        | Type      | Description                                                                                                  |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------ |
| `title:i18n` | `string`  | Display label for the transition.                                                                            |
| `new_state`  | `string`  | The state ID the content moves to when this transition is executed. An empty string stays in the same state. |
| `permission` | `string`  | Shorthand for a guard with one permission: `"guard": { "permissions": ["Review"] }`.                         |
| `guard`      | `object`  | Who may take the transition, see [Guards](#guards).                                                          |
| `trigger`    | `string`  | `user` (default) or `automatic`. Automatic transitions are not offered in `@workflow`.                       |
| `hidden`     | `boolean` | Not offered in `@workflow` (a DCWorkflow transition without an action), it can still be posted.              |
| `variables`  | `object`  | Expressions setting workflow variables, by variable id.                                                      |

The workflow json can also set `manager_bypass: true`: users with the `Administrator` role then pass every guard, like DCWorkflow's "Manager role bypasses guards".

If a workflow with the same `id` already exists, it is updated (merged) with the new definition.

## Workflow chains

A type can have more than one workflow, like a chain of the Plone workflow tool. Set `workflows` in the type profile (or bind several workflows in a `workflows.xml`):

```json
{
  "id": "Page",
  "workflows": ["simple_publication_workflow", "flag_workflow"]
}
```

- The first workflow is the type's `workflow`. Its state is the review state of the content (`review_state`, `document.workflow_state`).
- Every further workflow has its own state, stored in the workflow status of the document (`document_workflow_status`); new content starts in the initial state of each workflow.
- `GET @workflow` offers the available transitions of all workflows, `state` is the review state and `history` the history of the first workflow which defines `review_history` (or the first workflow without variables).
- `POST @workflow/<transition>` takes the transition in the first workflow where it is available, like `doActionFor`. History entries of further workflows have a `workflow` key.
- Permissions: every workflow applies the permissions of its state in turn, so the last workflow of the chain that manages a permission decides, like the role mappings DCWorkflow sets per workflow. This holds for requests and for the permissions in the catalog.

The chains are in the `type_workflow` table (position 0 is the type's workflow).

## Guards

A guard decides if a user may take a transition, like a DCWorkflow guard. Every part that is set must pass; an empty or missing part is not checked:

| Field         | Type     | Description                                                                                                   |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `permissions` | `array`  | The user needs one of these permissions on the content (in its current state).                                |
| `roles`       | `array`  | The user needs one of these roles on the content: global, local (from `@sharing`, also inherited) or `Owner`. |
| `groups`      | `array`  | The user must be in one of these groups. Every logged in user is in `AuthenticatedUsers`.                     |
| `expr`        | `string` | An expression that must be true, see [Expressions](#expressions).                                             |

```json
"publish": {
  "title:i18n": "Publish",
  "new_state": "published",
  "guard": {
    "permissions": ["Review", "Modify"],
    "expr": "python:user.has_role('Owner', here) or checkPermission('Review portal content', here)"
  }
}
```

`GET @workflow` offers the exit transitions of the current state whose guard passes, `POST @workflow/<transition>` answers `401 Unauthorized` when the guard doesn't.

## Variables

Workflow variables work like DCWorkflow's. A variable with `for_status` is computed on every transition (and on creation) and stored with the history entry and in the workflow status of the document (`document_workflow_status`): the value the new state sets, else the expression the transition sets, else the former value (unless `update_always`), else `default_expr`, else `default_value`.

| Field           | Type      | Description                                                                           |
| --------------- | --------- | ------------------------------------------------------------------------------------- |
| `description`   | `string`  | Description.                                                                          |
| `default_value` | `any`     | Value when nothing else sets it.                                                      |
| `default_expr`  | `string`  | [Expression](#expressions) for the value when nothing else sets it.                   |
| `for_status`    | `boolean` | Stored with every transition.                                                         |
| `update_always` | `boolean` | Computed again on every transition instead of keeping the former value.               |
| `info_guard`    | `object`  | [Guard](#guards) for reading the variable (`getInfoFor`, the history of `@workflow`). |
| `for_catalog`   | `boolean` | Kept from DCWorkflow definitions; Nick doesn't index variables yet.                   |

```json
"variables": {
  "reviewed_by": { "for_status": true, "default_value": "" },
  "review_history": {
    "default_expr": "state_change/getHistory",
    "info_guard": { "permissions": ["Submit", "Review"] }
  }
},
"transitions": {
  "publish": { "title": "Publish", "new_state": "published", "variables": { "reviewed_by": "user/getId" } }
}
```

`action`, `actor`, `comments`, `time` and `review_state` are always in a history entry. Other variables are added to the entries of the `history` of `@workflow`. When the workflow defines `review_history` with an `info_guard`, users who don't pass it get an empty `history`, like in Plone (the standard Plone workflows require `Request review` or `Review portal content`). Expressions read variables with `here.portal_workflow.getInfoFor(here, 'reviewed_by', '')`.

## Worklists

A worklist lists content waiting for a user, like a DCWorkflow worklist. The REST API serves them at [`@worklists`](/rest-api/endpoints/worklists).

| Field         | Type     | Description                                                                                                                                                          |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string` | Title.                                                                                                                                                               |
| `description` | `string` | Description.                                                                                                                                                         |
| `match`       | `object` | Values by variable: `review_state` matches the state, other ids the stored [variables](#variables). A value can be an expression, for example `python:user.getId()`. |
| `guard`       | `object` | [Guard](#guards), checked on the site root.                                                                                                                          |
| `action`      | `object` | `name`, `url` and `category`, like in DCWorkflow; `%(count)d` and `%(portal_url)s` are replaced.                                                                     |

```json
"worklists": {
  "desk_inbox": {
    "description": "Stories for the desk",
    "match": { "review_state": ["in_review"] },
    "guard": { "permissions": ["Review"] },
    "action": { "name": "Desk (%(count)d)", "url": "%(portal_url)s/search?review_state=in_review", "category": "global" }
  }
}
```

## Expressions

Guards (and workflow variables) can use expressions in the subset of TALES that DCWorkflow definitions use. They are parsed and checked by Nick's own evaluator, nothing is passed to `eval`: an expression can only use the names, attributes and methods listed here.

| Expression type | Example                                                 |
| --------------- | ------------------------------------------------------- |
| path            | `here/title`, `user/getId`, `transition/getId\|nothing` |
| `python:`       | `python:getattr(here, 'old_state', None) == 'pending'`  |
| `not:`          | `not:here/subjects`                                     |
| `exists:`       | `exists:here/expires`                                   |
| `string:`       | `string:${here/title} by ${user/getId}`                 |

`python:` supports literals (strings, numbers, lists, tuples, dicts, `None`, `True`, `False`), `and`, `or`, `not`, comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`, `in`, `not in`, `is`, `is not`), `+ - * / %`, `a if b else c`, indexing, attribute access and calls of the methods below, and the functions `checkPermission(permission, object)`, `getattr`, `hasattr` (with a literal name), `len`, `str`, `int`, `float`, `bool`, `test`, `same_type`, `DateTime`, `list`, `tuple`, `min` and `max`. Lambdas, comprehensions, slices, imports, `modules` and names or attributes starting with `_` are not supported. `checkPermission` is a Nick extension: Plone's DCWorkflow guards don't have it (a `NameError` there), use `here.portal_membership.checkPermission(permission, here)` or `user.has_permission(permission, here)` in definitions that must also run on Plone.

| Name                                                                | Attributes and methods                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `here`, `object`, `context`, `container`, `folder`, `portal`        | Any field as an attribute (`here.title`, a missing field is an `AttributeError`, so use `getattr(here, 'field', None)`), `id`, `portal_type`, `review_state`, `aq_parent`, `aq_inner`, `REQUEST`, `portal_membership`, `portal_workflow`, `getId()`, `Title()`, `Description()`, `UID()`, `Creator()`, `listCreators()`, `Subject()`, `Language()`, `getPortalTypeName()`, `getParentNode()`, `absolute_url()`, `getPhysicalPath()`, `effective()`, `expires()`, `created()`, `modified()`, `isExpired()`. In a path only the standard fields (`title`, `description`, `subjects`, `effective`, `expires`, `language`, ...) can be traversed, other names are ambiguous between a field and a method. |
| `user`, `member`, `here.portal_membership.getAuthenticatedMember()` | `getId()`, `getUserName()`, `getRoles()`, `getRolesInContext(object)`, `getGroups()`, `has_role(role, object)`, `has_permission(permission, object)`, `checkPermission(permission, object)`, `allowed(object, roles)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `here.portal_membership`                                            | `getAuthenticatedMember()`, `isAnonymousUser()`, `checkPermission(permission, object)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `here.portal_workflow`                                              | `getInfoFor(object, name, default)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `request`, `REQUEST`, `here.REQUEST`                                | `get(name, default)`, `form`: the query parameters and the body of the request                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `state_change`                                                      | `kwargs` (the request body, `comment`), `status`, `transition`, `old_state`, `new_state`, `object`, `workflow`, `getHistory()`, `getDateTime()`, `getPortal()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `transition`, `workflow`                                            | `id`, `title`, `getId()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `nothing`, `None`                                                   | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Plone names are accepted: the permissions `Modify portal content`, `Review portal content`, `Request review`, `Add portal content`, `Delete objects`, `Reply to item` and `Review comments` are checked as `Modify`, `Review`, `Submit`, `Add`, `Delete`, `Add Comment` and `Review Comments`, and roles include `Manager` and `Site Administrator` for `Administrator` and `Member` for `Authenticated`.

### Methods of add-ons

Many add-on workflows call Python methods of their content classes, for example `python:here.guard_handler('submit')` or `here/isValid`. Such expressions are unsupported until an add-on registers the method in TypeScript:

```ts
import { registerExpressionMethod } from '@plone/nick';

registerExpressionMethod('isValid', (content) => !!content.document.json.title);
registerExpressionMethod('@@can-be-closed', async (content) => {
  // content.document, content.user, content.trx, content.req
  return content.document.workflow_state === 'open';
});
```

### Unsupported expressions

Unsupported expressions are refused, never ignored:

- Seeding a `workflows.json` with an unsupported expression fails with an error naming the workflow, the transition and the reason.
- The definition.xml loader keeps an unsupported expression and adds `"unsupported": "<reason>"` to the guard. Such a guard is accepted with a warning and denies at runtime, so the transition is offered to nobody until the method is registered (or the guard is rewritten).
- An expression that fails at runtime (a missing method, a type error) denies and is logged.

## DCWorkflow definitions

A profile can also contain Plone workflow definitions in the GenericSetup layout: `workflows/<id>/definition.xml`, and optionally a `workflows.xml` binding workflows to types. They are loaded after `workflows.json` and replace existing workflows with the same id. The id of a workflow is the name of its directory.

```
src/profiles/default/
  workflows/
    intranet_workflow/definition.xml
  workflows.xml      <object name="portal_workflow"><bindings><type type_id="Page"><bound-workflow workflow_id="intranet_workflow"/></type></bindings></object>
```

`pnpm workflows:import <definition.xml or directory>...` imports definitions into the database directly (`--type=<type>` binds the first one to a type), `--json` prints them as a `workflows.json` instead. The export from Plone (`pnpm export`) uses the same loader.

| DCWorkflow                                                          | Nick                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<permission>` (managed permissions)                                | `managed_permissions`, for the permissions with a Nick equivalent (see [Expressions](#expressions))                                              |
| `permission-map`, `permission-role`                                 | the state's `permissions`; `Manager` and `Site Administrator` become `Administrator`, `Member` `Authenticated`, `Anonymous` also `Authenticated` |
| `acquired="True"`, a managed permission without a map               | the state's `acquire` (from the global role permissions)                                                                                         |
| `exit-transition`                                                   | the state's `transitions`                                                                                                                        |
| `transition`, `action`                                              | `title` (the action name), `new_state` (empty stays), `hidden` without an action in the `workflow` category                                      |
| `trigger="AUTOMATIC"`, `"WORKFLOW"`                                 | `trigger: automatic`, `hidden`                                                                                                                   |
| `guard-permission`, `guard-role`, `guard-group`, `guard-expression` | the transition's `guard`                                                                                                                         |
| `manager_bypass="True"`                                             | `manager_bypass`                                                                                                                                 |

Variables (`variable`, `assignment` of states and transitions) and worklists are converted too. Scripts, group maps and permissions without a Nick equivalent are not converted; the loader prints a warning for each. Unsupported guard expressions are kept with `"unsupported": "<reason>"` and deny.

### Conformance

`src/helpers/dcworkflow/conformance.test.ts` loads the standard Plone 6.2 workflows (`simple_publication_workflow`, `one_state_workflow`, `intranet_workflow`, `intranet_folder_workflow`, `folder_workflow`, `plone_workflow`) from their definition.xml and checks, for every state, transition and role (Anonymous, Member, Owner, Reader, Contributor, Editor, Reviewer, Site Administrator, Manager), that `GET @workflow` offers the transition exactly when Plone 6.2 does. The reference matrix in `src/helpers/dcworkflow/fixtures/workflow_matrix_plone62.json` holds only the answers (which role is offered which transition and can view the item in each state); it was captured from Plone over HTTP with the restapi-suite's `tests/test_workflow_matrix.py`. The comment workflows of plone.app.discussion are generated from DCWorkflow semantics; in their states which acquire `View` from the commented item Nick differs, because it acquires from the global role permissions.

The definition.xml files belong to Products.CMFPlone and plone.app.discussion, which are GPL-2.0 licensed, so they are not part of Nick. Without them the test is skipped. To run it, clone both packages outside the Nick checkout and set `PLONE_WORKFLOWS_DIR` to their workflows directories, separated by `:`:

```sh
git clone --depth 1 https://github.com/plone/Products.CMFPlone.git /tmp/Products.CMFPlone
git clone --depth 1 https://github.com/plone/plone.app.discussion.git /tmp/plone.app.discussion
PLONE_WORKFLOWS_DIR=/tmp/Products.CMFPlone/src/Products/CMFPlone/profiles/default/workflows:/tmp/plone.app.discussion/src/plone/app/discussion/profiles/default/workflows \
  pnpm test src/helpers/dcworkflow/conformance.test.ts
```

A workflow whose definition isn't found in these directories is skipped with a note. The matrix was captured with the 6.2 branch of Products.CMFPlone (3d13c6c) and plone.app.discussion (1365af4).

The loader's own tests (`dcworkflow.test.ts`, the workflow seed and the `@worklists` tests) use workflows written for Nick in `src/helpers/dcworkflow/fixtures/workflows`.

## Permission models

The permissions of a user on a content object combine the permissions of the user's roles (global roles, local roles from `@sharing` and `Owner`) from `roles.json` with the permissions the workflow state gives those roles.

- `additive`: the state's permissions are added to the global role permissions. A state can't take a permission away from a role that has it globally, for example a user with the global `Reader` role can view content in every state. This was the only model before Nick 2.9.
- `acquire` (default): works like Plone's DCWorkflow. For every managed permission the roles listed in the state replace the global role permissions, unless the state lists the permission in `acquire` (the "acquire" checkbox in Plone). Permissions the workflow doesn't manage keep their global role permissions.

```json
{
  "permission_model": "acquire",
  "managed_permissions": ["View", "Modify"],
  "states": {
    "internal": {
      "permissions": { "Editor": ["View", "Modify"], "Reader": ["View"] },
      "acquire": ["Modify"]
    }
  }
}
```

In the `internal` state only `Editor` and `Reader` can view the content, whatever roles have `View` globally, while `Modify` is still given to roles that have it globally.

The permissions are stored in the catalog for search, so after changing the permission model or the permissions of a workflow, run a `reindex_security` job on `/` to rebuild them.

## Example

Place a file like `src/profiles/default/workflows.json`:

```json
{
  "workflows": [
    {
      "id": "my_workflow",
      "title:i18n": "My Workflow",
      "description:i18n": "Description of the workflow.",
      "json": {
        "initial_state": "draft",
        "states": {
          "draft": {
            "title:i18n": "Draft",
            "description:i18n": "Content is not yet visible.",
            "transitions": ["publish"],
            "permissions": {
              "Editor": ["View", "Modify"],
              "Administrator": ["View", "Modify"]
            }
          },
          "published": {
            "title:i18n": "Published",
            "description:i18n": "Visible to everyone.",
            "transitions": ["retract"],
            "permissions": {
              "Anonymous": ["View"],
              "Editor": ["Modify"],
              "Administrator": ["Modify"]
            }
          }
        },
        "transitions": {
          "publish": {
            "title:i18n": "Publish",
            "new_state": "published",
            "permission": "Review"
          },
          "retract": {
            "title:i18n": "Retract",
            "new_state": "draft",
            "permission": "Submit"
          }
        }
      }
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, new workflows are added and existing ones are merged.

Upgrade `1014` gives `Owner` `View` and `Modify` in the `private` state, `View` in the `pending` state and `Modify` in the `published` state of `simple_publication_workflow`, like Plone's: the creator of an item can view and edit it while it is private, also without another local role.

### Upgrading from the additive model

Workflows that don't set `permission_model` use the `acquire` model since Nick 2.9. Before upgrading, run the dry run on the existing database to list the content whose permissions would change; it changes nothing:

```
pnpm permissions:dry-run
role Reader loses View on 12 items (simple_publication_workflow/private: 9, simple_publication_workflow/pending: 3)
```

`--json` prints the same as JSON. For every line, either add the role to the state's `permissions` (or the permission to the state's `acquire`), or set `"permission_model": "additive"` on the workflow to keep the old behaviour. Then run `pnpm seed:upgrade`: upgrade `1018` of the core profile gives `Reader` `View` in the `private` and `pending` states of `simple_publication_workflow`, as in Plone, so the core workflow keeps its permissions and the permissions in the catalog stay the same. After changing the permissions of other workflows, run a `reindex_security` job on `/` to rebuild the permissions in the catalog.
