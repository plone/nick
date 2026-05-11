/**
 * Query.
 * @module helpers/query/query
 */

// Type imports
import type { Knex } from 'knex';
import type {
  QueryOptions,
  QueryParam,
  QueryResult,
  QueryString,
  Request,
  WhereClause,
} from '../../types';

// External imports
import dayjs from 'dayjs';
import { normalize } from 'path';

// Internal imports
import { embed } from '../../helpers/ai/ai';
import config from '../../helpers/config/config';
import { getUrlByPath } from '../../helpers/url/url';
import models from '../../models';

/**
 * Convert querystring to query.
 * @method querystringToQuery
 * @param {Object} querystring Querystring
 * @param {String} path Path to search
 * @param {Object} req Request object
 * @param {Object} trx Transaction object.
 * @returns {Object} Query.
 */
export const querystringToQuery = async (
  querystring = {} as QueryString,
  path = '/',
  req: Request,
  trx: Knex.Transaction,
): Promise<QueryResult> => {
  // Get root url
  const root = path.endsWith('/') ? path : `${path}/`;

  // Models
  const Index = models.get('Index');
  type IndexMap = Record<string, InstanceType<typeof Index>>;

  // Get indexes
  const indexes: IndexMap = {} as IndexMap;
  (await Index.fetchAll({ metadata: false }, {}, trx)).map(
    (index: InstanceType<typeof Index>) => {
      indexes[index.name] = index;
    },
  );

  const where: WhereClause = {};

  // Default options
  const options: QueryOptions = {
    offset: 0,
    limit: 100,
    order: {
      column: 'UID',
      reverse: false,
    },
    select: undefined,
  };

  // Add query
  await Promise.all(
    querystring.query.map(async (query: any) => {
      // Check if key is SearchableText and AI is enabled
      if (
        query.i === 'SearchableText' &&
        config.settings.ai?.models?.embed?.enabled
      ) {
        // Get embedding vector
        const embedding = await embed(query.v.replace(/\*/g, ''));

        where['_embedding'] = [
          'raw',
          `1 - (_embedding <=> '${embedding}') > ${config.settings.ai.models.embed.minSimilarity}`,
        ];
        options.select = [
          '*',
          trx.raw(`1 - (_embedding <=> ?) AS similarity`, [embedding]),
        ];
        options.order.column = 'similarity';
        options.order.reverse = true;
      } else {
        switch (query.o) {
          case 'selection.any':
            where[`_${query.i}`] = ['=', query.v];
            break;
          case 'selection.all':
            where[`_${query.i}`] = ['all', query.v];
            break;
          case 'date.today':
            where[`_${query.i}`] = [
              '>=',
              `${dayjs().format('MM-DD-YYYY')} 00:00:00`,
            ];
            where[`_${query.i}`] = [
              '<=',
              `${dayjs().format('MM-DD-YYYY')} 23:59:59`,
            ];
            break;
          case 'date.between':
            where[`_${query.i}`] = ['>', query.v[0]];
            where[`_${query.i}`] = ['<', query.v[1]];
            break;
          case 'date.lessThen':
            where[`_${query.i}`] = ['<', query.v];
            break;
          case 'date.afterToday':
            where[`_${query.i}`] = [
              '>',
              `${dayjs().format('MM-DD-YYYY')} 23:59:59`,
            ];
            break;
          case 'date.largerThan':
            where[`_${query.i}`] = ['>', query.v];
            break;
          case 'date.beforeToday':
            where[`_${query.i}`] = [
              '<',
              `${dayjs().format('MM-DD-YYYY')} 00:00:00`,
            ];
            break;
          case 'date.afterRelativeDate':
            where[`_${query.i}`] = ['>', query.v];
            break;
          case 'date.beforeRelativeDate':
            where[`_${query.i}`] = ['<', query.v];
            break;
          case 'date.lessThanRelativeDate':
            where[`_${query.i}`] = ['<', query.v];
            break;
          case 'date.largerThanRelativeDate':
            where[`_${query.i}`] = ['>', query.v];
            break;
          case 'string.is':
            where[`_${query.i}`] = query.v;
            break;
          case 'string.path':
            where[`_${query.i}`] = query.v;
            break;
          case 'string.absolutePath':
            where[`_${query.i}`] = query.v.replace(getUrlByPath(req, '/'), '/');
            break;
          case 'string.relativePath':
            where[`_${query.i}`] = ['~', normalize(`${root}${query.v}`)];
            break;
          case 'string.currentUser':
            where[`_${query.i}`] = req.user.id;
            break;
          case 'string.contains':
            if (indexes[query.i].type === 'text') {
              where[`_${query.i}`] = ['@@', query.v];
            } else if (query.v.length >= 2) {
              where[`_${query.i}`] = ['like', `%${query.v}%`];
            }
            break;
          default:
            break;
        }
      }
    }),
  );

  // Check sort
  if (querystring.sort_on) {
    if (Object.keys(indexes).includes(querystring.sort_on)) {
      options.order.column = `_${querystring.sort_on}`;
    }
  }

  // Check sort order
  if (querystring.sort_order) {
    options.order.reverse = querystring.sort_order !== 'ascending';
  }

  // Check path depth
  if (querystring['path.depth']) {
    where['_path'] = [
      '~',
      `^${root}[^/]+${'(/[^/]+)?'.repeat(Math.min(querystring['path.depth'] - 1, 20))}$`,
    ];
  }

  // Check batch size
  if (querystring.b_size) {
    options.limit = Math.min(
      1000,
      Math.max(1, parseInt(querystring.b_size, 10) || 1),
    );
  }

  // Check batch start
  if (querystring.b_start) {
    options.offset = parseInt(querystring.b_start, 10) || 0;
  }

  // Check metafields
  if (querystring.meta_fields === '_all') {
    // select column_name from information_schema.columns where table_name = 'catalog' and column_name ~ '^[^_]';
  }

  return [where, options];
};

/**
 * Convert queryparam to query.
 * @method queryparamToQuery
 * @param {Object} queryparam Querystring
 * @param {String} path Path to search
 * @param {Object} req Request object
 * @param {Object} trx Transaction object.
 * @returns {Object} Query.
 */
export const queryparamToQuery = async (
  queryparam: QueryParam,
  path = '/',
  req: Request,
  trx: Knex.Transaction,
): Promise<QueryResult> => {
  const Index = models.get('Index');
  type IndexMap = Record<string, InstanceType<typeof Index>>;

  // Get root url
  const root = path.endsWith('/') ? path : `${path}/`;

  // Get indexes
  const indexes: IndexMap = {} as IndexMap;
  (await Index.fetchAll({ metadata: false }, {}, trx)).map(
    (index: InstanceType<typeof Index>) => {
      indexes[index.name] = index;
    },
  );

  // Set path search
  const where: WhereClause = {
    _path: ['~', `^${path}`],
  };

  // Default option
  const options: QueryOptions = {
    offset: 0,
    limit: 100,
    order: {
      column: 'UID',
      reverse: false,
    },
    select: undefined,
  };

  // Loop through query params
  await Promise.all(
    Object.keys(queryparam).map(async (key) => {
      const value = queryparam[key];

      // Check if key in indexes
      if (indexes[key]) {
        // Check if key is SearchableText and AI is enabled
        if (
          key === 'SearchableText' &&
          config.settings.ai?.models?.embed?.enabled
        ) {
          // Get embedding vector
          const embedding = await embed(value.replace(/\*/g, ''));

          where['_embedding'] = [
            'raw',
            `1 - (_embedding <=> '${embedding}') > ${config.settings.ai.models.embed.minSimilarity}`,
          ];
          options.select = [
            '*',
            trx.raw(`1 - (_embedding <=> ?) AS similarity`, [embedding]),
          ];
          options.order.column = 'similarity';
          options.order.reverse = true;
        } else {
          const field = `_${key}`;
          switch (indexes[key].type) {
            case 'string':
            case 'integer':
            case 'path':
            case 'uuid':
            case 'boolean':
            case 'date':
              where[field] = value;
              break;
            case 'string[]':
            case 'uuid[]':
              break;
            case 'text':
              where[field] = ['@@', value.replace(/\*/g, '')];
              break;
            default:
              break;
          }
        }
      }

      // Check other query params
      switch (key) {
        case 'sort_on':
          if (Object.keys(indexes).includes(value)) {
            options.order.column = `_${value}`;
          }
          break;
        case 'sort_order':
          options.order.reverse = value !== 'ascending';
          break;
        case 'path.depth':
          where['_path'] = [
            '~',
            `^${root}[^/]+${'(/[^/]+)?'.repeat(parseInt(value, 10) - 1)}$`,
          ];
          break;
        case 'b_size':
          options.limit = Math.min(1000, Math.max(1, parseInt(value, 10) || 1));
          break;
        case 'b_start':
          options.offset = parseInt(value, 10) || 0;
          break;
        default:
          break;
      }
    }),
  );
  return [where, options];
};
