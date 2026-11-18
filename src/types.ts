/**
 * Types.
 * @module types
 */

// Type imports
import type { IFilterXSSOptions } from 'xss';

// External imports
import express from 'express';
import { Knex } from 'knex';
import { NextFunction } from 'express';

export type JsonPrimative = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimative | JsonComposite;

export interface Model {
  toJson: (req: Request) => any | Promise<any>;
  toRecyclebinJson: (req: Request) => any | Promise<any>;
  getVocabularyTerm: (req: Request) => VocabularyTerm;
}

export type Params = { [key: string]: any };

export type Callback = (...args: any[]) => any;

export type SeedHandler = (
  trx: Knex.Transaction,
  profilePath: string,
) => Promise<void>;

export type MiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type Block = {
  toMarkdown?: (self: any, document: any) => string;
  searchableText?: (self: any) => string;
  replace?: (self: any, pattern: RegExp, replacement: string) => any;
  process?: (self: any) => Promise<any>;
};

export interface DeleteInfo {
  actor: string;
  time: string;
}

export interface View {
  status: number;
  etag?: string;
  xkeys?: string[];
  json?: Json;
  html?: string;
  headers?: { [key: string]: string };
  binary?: Buffer;
}

export interface User extends Model {
  id: string;
  fullname: string;
  tokens: string[];
  update: (data: any, trx: Knex.Transaction) => Promise<void>;
  lockTokens: (trx: Knex.Transaction) => Promise<void>;
  _groups: string[];
  getRoles: () => string[];
  fetchUserGroupRolesByDocument: (
    uuid: string,
    trx?: Knex.Transaction,
  ) => Promise<string[]>;
  fetchUserGroupRolesByDocuments: (
    uuids: string[],
    trx?: Knex.Transaction,
  ) => Promise<Record<string, string[]>>;
}

export interface Request extends express.Request {
  permissions: string[];
  apiPath: string;
  document: any;
  documentPath: string;
  i18n: (key: string, params?: any) => string;
  indexes: {
    models: any[];
  };
  user: User;
  navroot: any;
  type: any;
  token?: string;
  timestamp: string;
  params: Params;
  query: { [key: string]: string };
}

export interface Reference {
  path: string;
  UID?: string;
}

export interface IndexOperator {
  title: string;
  description: string;
  operation: string;
  widget?: string;
}

export interface WorkflowState {
  title: string;
  description: string;
  permissions: { [key: string]: WorkflowPermission };
  acquire?: string[];
  transitions: string[];
}

export type WorkflowPermission = string[];

export interface WorkflowTransition {
  [key: string]: {
    title: string;
    new_state: string;
    permission: string;
  };
}

export type PermissionModel = 'additive' | 'acquire';

export interface WorkflowType {
  permission_model?: PermissionModel;
  managed_permissions?: string[];
  initial_state?: string;
  states: { [key: string]: WorkflowState };
  transitions: { [key: string]: WorkflowTransition };
}

export interface ScheduledJobAction {
  getTitle(req: Request): string;
  getDescription(req: Request): string;
  getSummary(req: Request, params: Params): string;
  schema: Json;
  handler(
    params: Params,
    actor: any,
    trx: Knex.Transaction,
    context?: ScheduledJobContext,
  ): Promise<any>;
}

export interface ScheduledJobContext {
  job: string;
  signal: AbortSignal;
}

export interface ContentRuleAction {
  getTitle(req: Request): string;
  getDescription(req: Request): string;
  getSummary(req: Request, params: Params): string;
  schema: Json;
  handler(
    params: Params,
    context: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<void>;
}

export interface ScheduledJobActionJson {
  addview: string;
  title: string;
  description: string;
  '@schema': Schema;
}

export interface ContentRuleActionJson {
  addview: string;
  title: string;
  description: string;
  '@schema': Schema;
}

export interface ContentRuleCondition {
  getTitle(req: Request): string;
  getDescription(req: Request): string;
  getSummary(req: Request, params: Params): string;
  schema: Json;
  handler(
    params: Params,
    context: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<boolean>;
}

export interface ContentRuleConditionJson {
  addview: string;
  title: string;
  description: string;
  '@schema': Schema;
}

export type ScheduledJobActions = {
  [key: string]: ScheduledJobAction;
};

export type ContentRuleActions = {
  [key: string]: ContentRuleAction;
};

export type ContentRuleConditions = {
  [key: string]: ContentRuleCondition;
};

export type Fieldset = {
  id: string;
  title: string;
  behavior?: string;
  fields: string[];
};

export interface Property {
  title: string;
  description?: string;
  behavior?: string;
  [key: string]: any;
}

export interface Schema {
  behavior?: string;
  fieldsets: Fieldset[];
  properties?: { [key: string]: Property };
  required?: string[];
  behaviors?: string[];
  layouts?: string[];
}

export interface VocabularyTerm {
  title: string;
  token: string;
}

export type Vocabulary = VocabularyTerm[];

export type VocabularyHandler = (
  req: Request,
  trx: Knex.Transaction,
) => Promise<Vocabulary>;

export interface Route {
  view: string;
  op: 'get' | 'post' | 'put' | 'delete' | 'patch';
  permission: string;
  client?: string;
  cache:
    | 'alter'
    | 'manage'
    | 'dynamic'
    | 'content'
    | 'resource'
    | 'stable'
    | 'static';
  etag?: string;
  // Parser of the request body, by default json with the `api` request limit
  bodyParser?: any;
  middleware?: any;
  handler?: any;
}

export interface QueryFilter {
  i: string; // index name
  o: string; // operator
  v: string | [string, string]; // value
}

export interface QueryOrder {
  column: string;
  reverse: boolean;
}

export interface QueryOptions {
  offset: number;
  limit: number;
  order: QueryOrder;
  select: (string | Knex.Raw)[] | undefined;
}

export type WhereClause = Record<string, string | any[]>;

export interface QueryString {
  query: QueryFilter[];
  sort_on?: string;
  sort_order?: string;
  'path.depth'?: number;
  b_size?: string;
  b_start?: string;
  meta_fields?: string;
}

export interface QueryParam {
  [key: string]: string;
}

/**
 * Contents of a profile's metadata.json.
 */
export interface ProfileMetadata {
  /** Profile id, `<package>:<profile>`. */
  id: string;
  title?: string;
  description?: string;
  /** Version of the profile; upgrade steps live in `upgrades/<version>`. */
  version: number;
  /** Profiles which have to be installed first, like `@plone/nick:core`. */
  dependencies?: string[];
  /** Description of an upgrade step (in `upgrades/<version>/metadata.json`). */
  upgrade?: string;
}

/**
 * The `nick` field in the package.json of Nick, an add-on or a project.
 */
export interface NickPackageConfig {
  /** Directory of the profiles (default: `profiles` next to the entry point). */
  profiles?: string;
  /** Directory of the knex migrations of the package. */
  migrations?: string;
  /** Postgres schema of the tables of the package, created before migrating. */
  schema?: string;
  /** Name of the migration ledger (default: `knex_migrations_<package>`). */
  migrationsTable?: string;
}

export type Task = {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
};

export type QueryResult = [WhereClause, QueryOptions];

export interface CachePolicy {
  method: 'public' | 'private' | 'no-cache';
  maxAge?: number;
  sMaxAge?: number;
}

export type ConfigSettings = {
  packageRoot: string;
  connection: {
    port: number;
    host: string;
    database: string;
    user: string;
    password: string;
  };
  blobs: 'file' | 'db' | 's3';
  blobsDir: string;
  s3: {
    bucket: string;
    region: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  localesDir: string;
  // Address the api listens on, all interfaces if undefined
  host?: string;
  port: number;
  secret: string;
  systemUsers: string[];
  systemGroups: string[];
  cors: {
    allowOrigin: string;
    allowMethods: string;
    allowHeaders: string;
    allowCredentials: boolean;
    exposeHeaders: string;
    maxAge: number;
  };
  xss: IFilterXSSOptions;
  imageScales: Record<string, [number, number]>;
  health: {
    long_running: number;
    stalled: number;
  };
  frontendUrl: string;
  prefix: string;
  userRegistration: boolean;
  profiles: string[];
  push: {
    enabled: boolean;
    user: string;
    password: string;
    url: string;
  };
  rateLimit: {
    api: number;
    auth: number;
    trustProxy: number;
    store?: 'memory' | 'postgres';
  };
  recyclebin: boolean;
  cache: {
    enabled: boolean;
    anonymousOnly: boolean;
    etag: boolean;
    xkeys: boolean;
    purge: {
      enabled: boolean;
      urls: string[];
    };
    policies: {
      alter: CachePolicy;
      manage: CachePolicy;
      dynamic: CachePolicy;
      content: CachePolicy;
      resource: CachePolicy;
      stable: CachePolicy;
      static: CachePolicy;
    };
  };
  ai: {
    models: {
      embed: {
        name: string;
        api: string;
        dimensions: number;
        minSimilarity: number;
        enabled: boolean;
      };
      llm: {
        name: string;
        api: string;
        contextSize: number;
        enabled: boolean;
      };
      vision: {
        name: string;
        api: string;
        enabled: boolean;
      };
    };
  };
  requestLimit?: {
    files: string;
    api: string;
    chunk: string;
    batch: number;
  };
  reindexSecurityLimit?: number;
  jobs: {
    isolation: 'inline' | 'process';
    lease: number;
    maxAttempts: number;
    backoff: number;
    maxBackoff: number;
    pollInterval: number;
    refreshInterval: number;
    apiPath: string;
  };
  userschema: (req: Request) => Schema;
  [key: string]: unknown;
};
