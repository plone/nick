/**
 * Config helper.
 * @module helpers/config/config
 */

// Type imports
import type { ConfigSettings } from '../../types';

// External imports
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Internal imports
import userschema from '../../constants/userschema';

// Exports
export type ConfigType = InstanceType<typeof Config>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  ALLOWED_ORIGINS,
  API_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  SECRET,
  TRUST_PROXY,
  BLOBS_DIR,
  LOCALES_DIR,
} = process.env;

let config: any = {};
if (fs.existsSync(`${process.cwd()}/config.ts`)) {
  config = (await import(`${process.cwd()}/config`)).config;
}
const packageEntry = fileURLToPath(import.meta.resolve('@plone/nick'));
const packageRoot = path.dirname(packageEntry);

/**
 * A model for the config.
 * @class Config
 */
class Config {
  public settings: ConfigSettings;
  static instance: ConfigType;

  /**
   * Construct a Config.
   * @constructs Config
   */
  constructor() {
    this.settings = {
      packageRoot,
      connection: {
        port: parseInt(DB_PORT || config.connection?.port || '5432'),
        host: DB_HOST || config.connection?.host || 'localhost',
        database: DB_NAME || config.connection?.database || 'nick',
        user: DB_USER || config.connection?.user || 'nick',
        password: DB_PASSWORD || config.connection?.password || 'nick',
      },
      blobs: config.blobs || 'file',
      blobsDir:
        BLOBS_DIR || config.blobsDir || `${__dirname}/../../../var/blobstorage`,
      s3: config.s3 || {
        bucket: 'my-bucket',
        region: 'my-region',
        accessKeyId: 'my-access-key-id',
        secretAccessKey: 'my-secret-access-key',
      },
      localesDir:
        LOCALES_DIR || config.localesDir || `${__dirname}/../../../locales`,
      port: config.port || 8080,
      secret: SECRET || config.secret || 'secret',
      systemUsers: config.systemUsers || ['admin', 'anonymous'],
      systemGroups: config.systemGroups || ['Owner'],
      cors: {
        allowOrigin:
          ALLOWED_ORIGINS ||
          config.cors?.allowOrigin ||
          'http://localhost:3000',
        allowMethods:
          config.cors?.allowMethods || 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        allowHeaders:
          config.cors?.allowHeaders || 'Content-Type,Authorization,Accept',
        allowCredentials: config.cors?.allowCredentials ?? true,
        exposeHeaders:
          config.cors?.exposeHeaders || 'Content-Length,Content-Type',
        maxAge: config.cors?.maxAge || 3600,
      },
      xss: config.xss || { stripIgnoreTagBody: ['script'] },
      imageScales: config.imageScales || {
        large: [768, 768],
        preview: [400, 400],
        mini: [200, 200],
        thumb: [128, 128],
        tile: [64, 64],
        icon: [32, 32],
        listing: [16, 16],
      },
      health: config.health || {
        long_running: 3,
        stalled: 30,
      },
      frontendUrl: config.frontendUrl || 'http://localhost:3000',
      prefix: config.prefix || '',
      userRegistration: config.userRegistration || false,
      profiles: config.profiles || ['@plone/nick:core', '@plone/nick:default'],
      requestLimit: config.requestLimit || {
        api: '1mb',
        files: '10mb',
        chunk: '1mb',
      },
      push: {
        enabled: config.push?.enabled || false,
        user: config.push?.user || 'admin',
        password: config.push?.password || 'admin',
        url: config.push?.url || 'https://somehost/push',
      },
      rateLimit: {
        api: parseInt(API_RATE_LIMIT || config.rateLimit?.api || '100'),
        auth: parseInt(AUTH_RATE_LIMIT || config.rateLimit?.auth || '5'),
        trustProxy: parseInt(
          TRUST_PROXY || config.rateLimit?.trustProxy || '1',
        ),
      },
      recyclebin: config.recyclebin || false,
      cache: config.cache || {
        enabled: false,
        anonymousOnly: true,
        etag: false,
        xkeys: false,
        purge: {
          enabled: false,
          urls: [],
        },
        policies: {
          alter: {
            method: 'no-cache',
          },
          manage: {
            method: 'no-cache',
          },
          content: {
            method: 'no-cache',
          },
          dynamic: {
            method: 'public',
            maxAge: 10,
            sMaxAge: 0,
          },
          resource: {
            method: 'public',
            maxAge: 86400,
            sMaxAge: 0,
          },
          stable: {
            method: 'public',
            maxAge: 31536000,
            sMaxAge: 0,
          },
          static: {
            method: 'public',
            maxAge: 31536000,
            sMaxAge: 0,
          },
        },
      },
      ai: config.ai || {
        models: {
          embed: {
            name: 'nomic-embed-text-v2-moe',
            api: 'http://localhost:11434/api/embed',
            dimensions: 768,
            minSimilarity: 0.3,
            enabled: false,
          },
          llm: {
            name: 'qwen3',
            api: 'http://localhost:11434/api/chat',
            contextSize: 10,
            enabled: false,
          },
          vision: {
            name: 'llava',
            api: 'http://localhost:11434/api/generate',
            enabled: false,
          },
        },
      },
      userschema: config.userschema || userschema,
    };
    if (!Config.instance) {
      Config.instance = this;
    }

    return Config.instance;
  }
}

const instance = new Config();
export default instance;
