/**
 * Models.
 * @module models
 */

// Internal imports
import { Action } from './action/action';
import { Behavior } from './behavior/behavior';
import { Catalog } from './catalog/catalog';
import { ContentRule } from './content_rule/content_rule';
import { Controlpanel } from './controlpanel/controlpanel';
import { Document } from './document/document';
import { File } from './file/file';
import { Form } from './form/form';
import { Group } from './group/group';
import { Index } from './index/index';
import { Permission } from './permission/permission';
import { Profile } from './profile/profile';
import { Redirect } from './redirect/redirect';
import { Role } from './role/role';
import { Type } from './type/type';
import { User } from './user/user';
import { Version } from './version/version';
import { Vocabulary } from './vocabulary/vocabulary';
import { Workflow } from './workflow/workflow';

type Model =
  | typeof Action
  | typeof Behavior
  | typeof Catalog
  | typeof ContentRule
  | typeof Controlpanel
  | typeof Document
  | typeof File
  | typeof Form
  | typeof Group
  | typeof Index
  | typeof Permission
  | typeof Profile
  | typeof Redirect
  | typeof Role
  | typeof Type
  | typeof User
  | typeof Version
  | typeof Vocabulary
  | typeof Workflow;
type Handler = () => Model;

/**
 * A model registry.
 * @class Models
 */
class Models {
  public models: { [key: string]: Handler };
  static instance: Models;

  /**
   * Construct a Config.
   * @constructs Config
   */
  constructor() {
    this.models = {};

    if (!Models.instance) {
      Models.instance = this;
    }

    return Models.instance;
  }

  /**
   * Register a model.
   * @param {string} name The name of the model.
   * @param {Handler} model The model to register.
   */
  register(name: string, model: Handler) {
    this.models[name] = model;
  }

  /**
   * Get a model.
   * @param {string} name The name of the model.
   * @returns {ModelClass} The model.
   */
  get(name: 'Action'): typeof Action;
  get(name: 'Behavior'): typeof Behavior;
  get(name: 'Catalog'): typeof Catalog;
  get(name: 'ContentRule'): typeof ContentRule;
  get(name: 'Controlpanel'): typeof Controlpanel;
  get(name: 'Document'): typeof Document;
  get(name: 'File'): typeof File;
  get(name: 'Form'): typeof Form;
  get(name: 'Group'): typeof Group;
  get(name: 'Index'): typeof Index;
  get(name: 'Permission'): typeof Permission;
  get(name: 'Profile'): typeof Profile;
  get(name: 'Redirect'): typeof Redirect;
  get(name: 'Role'): typeof Role;
  get(name: 'Type'): typeof Type;
  get(name: 'User'): typeof User;
  get(name: 'Version'): typeof Version;
  get(name: 'Vocabulary'): typeof Vocabulary;
  get(name: 'Workflow'): typeof Workflow;
  get(name: string): Model {
    return this.models[name]();
  }
}

// Create an instance of the Models registry and register all models
const models = new Models();
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
models.register('Permission', () => Permission);
models.register('Profile', () => Profile);
models.register('Redirect', () => Redirect);
models.register('Role', () => Role);
models.register('Type', () => Type);
models.register('User', () => User);
models.register('Version', () => Version);
models.register('Vocabulary', () => Vocabulary);
models.register('Workflow', () => Workflow);

// Export the instance and all models
export default models;
