/**
 * DCWorkflow helper tests.
 * @module helpers/dcworkflow/dcworkflow.test
 */

// External imports
import { readdirSync, readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

// Internal imports
import {
  convertDefinition,
  convertWorkflow,
  parseWorkflowBindings,
  parseXml,
} from './dcworkflow';

const xml = `<?xml version="1.0"?>
<dc-workflow workflow_id="intranet" title="Intranet" description=" - Only for - members." initial_state="internal" manager_bypass="True">
 <permission>View</permission>
 <permission>Modify portal content</permission>
 <permission>Access contents information</permission>
 <state state_id="internal" title="Internal draft">
  <description>Draft</description>
  <exit-transition transition_id="publish"/>
  <exit-transition transition_id="touch"/>
  <permission-map name="View" acquired="False">
   <permission-role>Manager</permission-role>
   <permission-role>Member</permission-role>
   <permission-role>Owner</permission-role>
  </permission-map>
  <permission-map name="Access contents information" acquired="False">
   <permission-role>Member</permission-role>
  </permission-map>
  <permission-map name="Modify portal content" acquired="False">
   <permission-role>Site Administrator</permission-role>
   <permission-role>Owner</permission-role>
  </permission-map>
 </state>
 <state state_id="external" title="Externally visible">
  <exit-transition transition_id="retract"/>
  <permission-map name="View" acquired="True">
   <permission-role>Anonymous</permission-role>
  </permission-map>
  <group-map name="staff"><group-role>Editor</group-role></group-map>
 </state>
 <transition transition_id="publish" title="Reviewer publishes" new_state="external" trigger="USER" after_script="notify">
  <action url="" category="workflow" icon="">Publish externally</action>
  <guard>
   <guard-permission>Review portal content</guard-permission>
   <guard-permission>Access contents information</guard-permission>
   <guard-role>Manager</guard-role>
   <guard-role>Owner</guard-role>
   <guard-group>staff</guard-group>
   <guard-expression>python:user.has_role('Owner', here)</guard-expression>
  </guard>
 </transition>
 <transition transition_id="retract" title="Retract" new_state="internal" trigger="USER">
  <guard><guard-expression>python:here.may_retract()</guard-expression></guard>
 </transition>
 <transition transition_id="touch" title="Touch" new_state="" trigger="USER">
  <action category="workflow">Touch</action>
 </transition>
 <transition transition_id="auto" title="Auto" new_state="external" trigger="AUTOMATIC">
  <guard><guard-permission>Access contents information</guard-permission></guard>
 </transition>
</dc-workflow>`;

describe('DCWorkflow', () => {
  describe('parseXml', () => {
    it('parses elements, attributes and text', () => {
      const root = parseXml(
        '<?xml version="1.0"?><a x="1 &amp; 2"><!-- c --><b>T &lt;b&gt;</b><c/></a>',
      );
      expect(root.name).toBe('a');
      expect(root.attributes.x).toBe('1 & 2');
      expect(root.children.map((child) => child.name)).toEqual(['b', 'c']);
      expect(root.children[0].text).toBe('T <b>');
    });
  });

  describe('convertDefinition', () => {
    it('converts the workflow and its states', () => {
      const { workflow } = convertDefinition(xml);
      expect(workflow.id).toBe('intranet');
      expect(workflow.description).toBe('Only for members.');
      expect(workflow.json.initial_state).toBe('internal');
      expect(workflow.json.manager_bypass).toBe(true);
      expect(workflow.json.managed_permissions).toEqual(['View', 'Modify']);
      expect(workflow.json.states.internal).toEqual({
        title: 'Internal draft',
        description: 'Draft',
        transitions: ['publish', 'touch'],
        permissions: {
          Administrator: ['View', 'Modify'],
          Authenticated: ['View'],
          Owner: ['View', 'Modify'],
        },
      });

      // Acquired permission maps and managed permissions without a map
      // are acquired
      expect(workflow.json.states.external).toEqual({
        title: 'Externally visible',
        description: '',
        transitions: ['retract'],
        permissions: { Anonymous: ['View'], Authenticated: ['View'] },
        acquire: ['View', 'Modify'],
      });
    });

    it('converts the transitions with their guards', () => {
      const { workflow } = convertDefinition(xml);
      expect(workflow.json.transitions.publish).toEqual({
        title: 'Publish externally',
        description: '',
        new_state: 'external',
        guard: {
          permissions: ['Review'],
          roles: ['Administrator', 'Owner'],
          groups: ['staff'],
          expr: "python:user.has_role('Owner', here)",
        },
      });

      // Unsupported expressions are kept and marked, transitions without
      // an action are hidden
      expect(workflow.json.transitions.retract).toEqual({
        title: 'Retract',
        description: '',
        new_state: 'internal',
        guard: {
          expr: 'python:here.may_retract()',
          unsupported:
            'Method "may_retract" of the content object is not registered.',
        },
        hidden: true,
      });

      // An empty new state stays, automatic transitions are kept
      expect(workflow.json.transitions.touch).toEqual({
        title: 'Touch',
        description: '',
        new_state: '',
      });
      expect(workflow.json.transitions.auto).toEqual({
        title: 'Auto',
        description: '',
        new_state: 'external',
        guard: { permissions: ['Manage Site'] },
        trigger: 'automatic',
      });
    });

    it('lists what is not converted', () => {
      const { warnings } = convertDefinition(xml, 'custom');
      expect(warnings).toEqual([
        'custom: permissions without a Nick equivalent are not managed: Access contents information',
        'custom, state external: group maps (local roles of groups by state) are not converted',
        'custom, transition publish: guard permissions without a Nick equivalent dropped: Access contents information',
        'custom, transition publish: the after script notify is not converted',
        'custom, transition retract: unsupported guard expression "python:here.may_retract()" (Method "may_retract" of the content object is not registered.), it denies',
        'custom, transition auto: guard permissions without a Nick equivalent dropped: Access contents information (Manage Site required instead)',
      ]);
      expect(convertWorkflow(xml, 'custom').id).toBe('custom');
    });

    it('converts the fixture workflows without unsupported parts', () => {
      const path = `${import.meta.dirname}/fixtures/workflows`;
      expect(readdirSync(path).sort()).toEqual([
        'editorial_workflow',
        'single_stage_workflow',
        'team_space_workflow',
      ]);
      readdirSync(path).map((id) => {
        const { workflow, warnings } = convertDefinition(
          readFileSync(`${path}/${id}/definition.xml`, 'utf8'),
          id,
        );
        expect(workflow.id).toBe(id);
        expect(
          warnings.filter(
            (warning) => !warning.includes('Access contents information'),
          ),
        ).toEqual([]);
      });
    });

    it('converts typed state values, triggers and acquired maps', () => {
      const { workflow } = convertDefinition(
        readFileSync(
          `${import.meta.dirname}/fixtures/workflows/editorial_workflow/definition.xml`,
          'utf8',
        ),
      );
      expect(workflow.title).toBe('Editorial Desk');
      expect(workflow.description).toBe(
        'Newsroom flow & archive. Authors write drafts, editors approve them for the live site. Old stories go to the archive.',
      );
      expect(workflow.json.managed_permissions).toEqual([
        'View',
        'Modify',
        'Delete',
      ]);

      // Typed assignments of the states
      expect(workflow.json.states.draft.variables).toEqual({
        stage: 'writing',
        priority: 3,
      });
      expect(workflow.json.states.in_review.variables).toEqual({
        stage: 'checking',
        flagged: true,
      });
      expect(workflow.json.states.live.variables).toEqual({
        weight: 0.5,
        embargo: null,
      });

      // An acquired map adds its roles, a managed permission without a
      // map is acquired, an empty map grants nothing
      expect(workflow.json.states.archived).toMatchObject({
        title: 'Archive',
        permissions: { Authenticated: ['View'] },
        acquire: ['View', 'Delete'],
      });
      expect(workflow.json.states.draft.acquire).toEqual(['Delete']);
      expect(workflow.json.states.live.permissions).toMatchObject({
        Anonymous: ['View'],
        Authenticated: ['View'],
        Administrator: ['Modify', 'Delete'],
      });

      // Guards: any of the permissions, roles, groups and expressions
      expect(workflow.json.transitions.approve.guard).toEqual({
        permissions: ['Review', 'Modify'],
      });
      expect(workflow.json.transitions.archive.guard).toEqual({
        roles: ['Administrator'],
        groups: ['archivists'],
      });
      expect(workflow.json.transitions.restore.guard.unsupported).toBe(
        undefined,
      );
      expect(workflow.json.transitions.propose.variables).toEqual({
        handed_in_by: 'python:user.getId()',
      });

      // Automatic transitions are kept, WORKFLOW triggers and actions
      // outside the workflow category are hidden, an empty guard is none
      expect(workflow.json.transitions.expire.trigger).toBe('automatic');
      expect(workflow.json.transitions.refresh_index).toEqual({
        title: 'Refresh',
        description: '',
        new_state: '',
        hidden: true,
      });
      expect(workflow.json.transitions.print_preview).toEqual({
        title: 'Print preview',
        description: '',
        new_state: '',
        hidden: true,
      });

      // Variables: defaults by value or expression, an empty value is none
      expect(workflow.json.variables.review_history.info_guard).toEqual({
        permissions: ['Review'],
        roles: ['Owner'],
      });
      expect(workflow.json.variables.priority.default_value).toBe(5);
      expect(workflow.json.variables.handed_in_by).toEqual({
        description: '',
        for_catalog: false,
        for_status: true,
        update_always: false,
      });
    });

    it('converts a single state workflow with an acquired view', () => {
      const { workflow } = convertDefinition(
        readFileSync(
          `${import.meta.dirname}/fixtures/workflows/single_stage_workflow/definition.xml`,
          'utf8',
        ),
      );
      expect(workflow.json).toEqual({
        initial_state: 'visible',
        managed_permissions: ['View', 'Modify', 'Add Comment'],
        states: {
          visible: {
            title: 'visible',
            description: '',
            transitions: [],
            permissions: {
              Owner: ['Modify'],
              Administrator: ['Modify'],
              Authenticated: ['Add Comment'],
            },
            acquire: ['View'],
          },
        },
        transitions: {},
      });
    });

    it('converts variables and their assignments', () => {
      const { workflow, warnings } = convertDefinition(
        `<dc-workflow workflow_id="w" initial_state="a">
 <state state_id="a">
  <exit-transition transition_id="go"/>
  <assignment name="stage" type="string">draft</assignment>
  <assignment name="level" type="int">2</assignment>
 </state>
 <transition transition_id="go" new_state="a" trigger="USER">
  <action category="workflow">Go</action>
  <assignment name="by">user/getId</assignment>
  <assignment name="bad">python:here.custom()</assignment>
 </transition>
 <variable variable_id="review_history" for_catalog="False" for_status="False" update_always="False">
  <description>History</description>
  <default><expression>state_change/getHistory</expression></default>
  <guard><guard-permission>Request review</guard-permission><guard-permission>Review portal content</guard-permission></guard>
 </variable>
 <variable variable_id="stage" for_catalog="True" for_status="True" update_always="False">
  <default><value type="string">new</value></default>
  <guard></guard>
 </variable>
</dc-workflow>`,
      );
      expect(workflow.json.variables).toEqual({
        review_history: {
          description: 'History',
          default_expr: 'state_change/getHistory',
          for_catalog: false,
          for_status: false,
          update_always: false,
          info_guard: { permissions: ['Submit', 'Review'] },
        },
        stage: {
          description: '',
          default_value: 'new',
          for_catalog: true,
          for_status: true,
          update_always: false,
        },
      });
      expect(workflow.json.states.a.variables).toEqual({
        stage: 'draft',
        level: 2,
      });
      expect(workflow.json.transitions.go.variables).toEqual({
        by: 'user/getId',
      });
      expect(warnings).toEqual([
        'w, transition go: unsupported expression "python:here.custom()" for bad (Method "custom" of the content object is not registered.), not converted',
      ]);
    });

    it('converts worklists', () => {
      const { workflow } = convertDefinition(
        readFileSync(
          `${import.meta.dirname}/fixtures/workflows/editorial_workflow/definition.xml`,
          'utf8',
        ),
      );
      expect(workflow.json.worklists).toEqual({
        desk_inbox: {
          title: '',
          description: 'Stories for the desk',
          match: { review_state: ['in_review'] },
          guard: { permissions: ['Review'] },
          action: {
            name: 'Desk (%(count)d)',
            url: '%(portal_url)s/search?review_state=in_review',
            category: 'global',
          },
        },
        urgent_drafts: {
          title: 'Urgent drafts',
          description: '',
          match: { review_state: ['draft'], stage: ['writing', 'checking'] },
        },
      });
    });

    it('refuses other xml', () => {
      expect(() => convertDefinition('<object name="x"/>')).toThrow(
        /Not a DCWorkflow definition/,
      );
    });
  });

  describe('parseWorkflowBindings', () => {
    it('reads the default chain and the chains by type', () => {
      expect(
        parseWorkflowBindings(`<object name="portal_workflow">
 <bindings>
  <default><bound-workflow workflow_id="simple_publication_workflow"/></default>
  <type type_id="Event"><bound-workflow workflow_id="intranet_workflow"/></type>
  <type type_id="File"/>
 </bindings>
</object>`),
      ).toEqual({
        default: ['simple_publication_workflow'],
        types: { Event: ['intranet_workflow'], File: [] },
      });
    });
  });
});
