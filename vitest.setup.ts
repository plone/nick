/**
 * Vitest Setup
 * @module vitest.setup
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import jwt from 'jsonwebtoken';
import { transaction } from 'objection';
import { v4 as uuid } from 'uuid';
import { beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';

// Internal imports
import { addToken } from './src/helpers/auth/auth';
import { knex } from './src/helpers/knex/knex';
import { logger } from './src/helpers/log/log';
import * as mail from './src/helpers/mail/mail';
import * as url from './src/helpers/url/url';
import { Model } from './src/models/_model/_model';
import { User } from './src/models/user/user';

dayjs.extend(utc);

declare global {
  var knex: Knex;
  var txn: Knex.Transaction | null;
}

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxuYW1lIjoiQWRtaW4iLCJpYXQiOjE2NDkzMTI0NDl9.RS1Ny_r0v7vIylFfK6q0JVJrkiDuTOh9iG9IL8xbzAk';

// Mock get url
vi.spyOn(url, 'getUrl').mockImplementation(
  (req) =>
    `http://localhost:8080${
      req.document.path === '/' ? '' : req.document.path
    }`,
);

// Mock get url by path
vi.spyOn(url, 'getUrlByPath').mockImplementation(
  (req, path) => `http://localhost:8080${path === '/' ? '' : path}`,
);

// Mock get root url
vi.spyOn(url, 'getRootUrl').mockImplementation(
  (req) => 'http://localhost:8080',
);

// Mock send mail
vi.spyOn(mail, 'sendMail').mockImplementation(() => Promise.resolve(undefined));

// Mock JWT sign
vi.spyOn(jwt, 'sign').mockReturnValue(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxuYW1lIjoiQWRtaW4iLCJpYXQiOjE2NDkzNjE3NDIsImV4cCI6MTY0OTQwNDk0Mn0.SBqYCkWsHNHqzTUPIGC1c1Zd9iDARmqDecb3k7Ok7vE' as any,
);

// Mock uuid
vi.mock('uuid');
vi.mocked(uuid).mockReturnValue('a95388f2-e4b3-4292-98aa-62656cbd5b9c' as any);

// Mock dayjs
vi.spyOn(dayjs, 'utc').mockReturnValue({
  format: () => '2022-04-08T16:00:00.000Z',
  unix: () => 1649433600000,
} as any);

beforeAll(async () => {
  global.knex = knex;
  global.txn = null;
  logger.configure({
    appenders: {
      error_stdout: {
        type: 'stdout',
        layout: { type: 'pattern', pattern: '%[%d %p%] [%f{1}:%l] %m' },
      },
    },
    categories: {
      default: {
        appenders: ['error_stdout'],
        level: 'fatal',
        enableCallStack: true,
      },
    },
  });
});

beforeEach(async () => {
  global.txn = await transaction.start(knex);
  Model.knex(global.txn);

  // Add admin token
  const admin = await User.fetchById('admin', {}, global.txn);
  await addToken(admin, token, global.txn);
});

afterEach(async () => {
  if (global.txn) {
    await global.txn.rollback();
  }
  Model.knex(knex);
});

afterAll(async () => {
  global.knex.destroy();
});
