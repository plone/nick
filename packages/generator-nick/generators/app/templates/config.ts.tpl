/**
 * Config
 * @module config
 */

// External imports
import path from 'path';
import { fileURLToPath } from 'url';

// Internal imports
import events from './src/events';
import userschema from './src/develop/nick/src/constants/userschema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  connection: {
    port: 5432,
    host: 'localhost',
    database: '<%= projectName %>',
    user: '<%= projectName %>',
    password: '<%= projectName %>',
  },
  blobs: 'file',
  blobsDir: `${__dirname}/var/blobstorage`,
  localesDir: `${__dirname}/src/develop/nick/locales`,
  port: 8080,
  secret: 'secret',
  systemUsers: ['admin', 'anonymous'],
  systemGroups: ['Owner'],
  cors: {
    allowOrigin: '*',
    allowMethods: '*',
    allowHeaders: '*',
    allowCredentials: true,
    exposeHeaders: '*',
    maxAge: 3660,
  },
  imageScales: {
    large: [768, 768],
    preview: [400, 400],
    mini: [200, 200],
    thumb: [128, 128],
    tile: [64, 64],
    icon: [32, 32],
    listing: [16, 16],
  },
  frontendUrl: 'http://localhost:3000',
  prefix: '',
  userRegistration: true,
  profiles: [
    `${__dirname}/src/develop/nick/src/profiles/core`,
    /* `${__dirname}/src/develop/nick/src/profiles/ai`, */
    `${__dirname}/src/profiles/default`,
  ],
  push: {
    enabled: false,
    user: 'admin',
    password: 'admin',
    url: 'https://somehost/push',
  },
  requestLimit: {
    api: '1mb',
    files: '10mb',
    chunk: '1mb',
  },
  rateLimit: {
    api: 100,
    auth: 5,
    trustProxy: 1,
  },
  events,
  routes: false,
  tasks: false,
  cache: {
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
  ai: {
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
  userschema,
};
