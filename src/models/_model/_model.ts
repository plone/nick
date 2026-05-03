/**
 * Objection Model.
 * @module helpers/base-model/base-model
 */

// Type imports
import type { Request, VocabularyTerm } from '../../types';

// External imports
import { difference } from 'es-toolkit/array';
import { isEmpty, isObject } from 'es-toolkit/compat';
import { mapKeys, omit } from 'es-toolkit/object';
import { snakeCase } from 'es-toolkit/string';
import type { Knex } from 'knex';
import { mixin, Model as ObjectionModel } from 'objection';
// @ts-expect-error Objection does not have types for this package
import TableName from 'objection-table-name';

// Internal imports
import { Collection } from '../../collections/_collection/_collection';
import { formatAttribute } from '../../helpers/format/format';
import { knex } from '../../helpers/knex/knex';
import { log } from '../../helpers/log/log';
import { removeUndefined } from '../../helpers/utils/utils';

// Give the knex instance to objection.
ObjectionModel.knex(knex);

interface WhereClause {
  [key: string]: any;
}

interface OrderOption {
  column?: string;
  reverse?: boolean;
  values?: string[];
}

interface QueryOptions {
  order?: string | OrderOption | string[];
  limit?: number;
  offset?: number;
  related?: string | string[];
  select?: string[];
  [key: string]: any;
}

/**
 * Base model used to extend models from.
 * @class Model
 * @extends Model
 */
export class Model extends mixin(ObjectionModel, [
  TableName({ caseMapper: snakeCase }),
]) {
  static collection = Collection;

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Json} JSON object.
   */
  toJson(req?: Request): any {
    return this.toJSON();
  }

  /**
   * Build a query
   * @method buildQuery
   * @static
   * @param {WhereClause} where Where clause.
   * @param {QueryOptions} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Knex.QueryBuilder} Query builder.
   */
  static buildQuery(
    where: WhereClause = {},
    options: QueryOptions = {},
    trx?: Knex.Transaction,
  ): any {
    let query = this.query(trx);

    /**
     * Add where
     * Possible options are:
     * { id: 0 }                                // Search by field
     * { "json->>'title'": 'News'}              // Search in json field
     * { title: ['like', 'News'] }              // Override operator
     * { title: ['raw', 'similarity > 0.75'] }  // Use raw SQL
     * { roles: ['=', ['Reader', 'Editor']] }   // Search by values
     */
    if (where) {
      mapKeys(where, (value: any, key: string | number) => {
        // user and group are reserved words so need to be wrapper in quotes
        const attribute = formatAttribute(`${key}`);
        let operator = Array.isArray(value) ? value[0] : '=';
        const values = Array.isArray(value) ? value[1] : value;
        let valueWrapper =
          Array.isArray(values) && operator !== '&&' ? 'any(?)' : '?';
        if (Array.isArray(values) && operator === 'all') {
          operator = '=';
          valueWrapper = 'all(?)';
        }
        if (operator === '@@') {
          valueWrapper = 'to_tsquery(?)';
        }
        if (values === null) {
          query =
            operator === 'is not'
              ? query.whereNotNull(`${key}`)
              : query.whereNull(`${key}`);
        } else if (operator === 'raw') {
          query = query.whereRaw(values);
        } else {
          query = query.whereRaw(`${attribute} ${operator} ${valueWrapper}`, [
            values,
          ]);
        }
        return key;
      });
    }

    /**
     * Add order by
     * Possible options are:
     * 'title'                            // Sort by title column
     * { column: 'title' }                // Sort by title column
     * { column: 'title', reverse: true } // Reverse sort
     * { column: 'title', values: [...] } // Sort by fixed values
     */
    if (options.order) {
      // Check if default order
      if (typeof options.order === 'string') {
        query = query.orderByRaw(formatAttribute(options.order));
      } else if (Array.isArray(options.order)) {
        query = query.orderBy(
          (options.order as string[]).map((order: string) => ({
            column: order,
          })),
        );
      } else {
        let order = '';
        const orderOption = options.order as OrderOption;
        // Check if values are defined
        if (orderOption.values) {
          order = `case ${orderOption.values
            .map(
              (value: string, index: number) =>
                `when ${orderOption.column} = '${value}' then ${index}`,
            )
            .join(' ')} end`;
        } else {
          // Order by column
          order = formatAttribute(orderOption.column || '');
        }
        query = query.orderByRaw(
          `${order}${orderOption.reverse ? ' DESC' : ''}`,
        );
      }
    }

    // Add paging options
    if (options.limit) {
      query = query.limit(
        Math.min(1000, Math.max(1, parseInt(String(options.limit), 10) || 1)),
      );
    }
    if (options.offset) {
      query = query.offset(parseInt(String(options.offset), 10) || 0);
    }

    // Add related
    if (options.related) {
      query = query.withGraphFetched(options.related);
    }

    // Add select
    if (options.select) {
      query = query.select(...options.select);
    }

    // Return query
    return query;
  }

  /**
   * Add related items to the model.
   * @method fetchRelated
   * @param {string} graph Related graph.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async fetchRelated(graph: string, trx?: Knex.Transaction): Promise<void> {
    // Get current keys
    const curKeys = Object.keys(this);

    // Fetch related
    const related = await this.$fetchGraph(graph, { transaction: trx });

    // Get new keys
    const newKeys = difference(Object.keys(related), curKeys);

    // Assign new props
    newKeys.map((key: string) => ((this as any)[key] = (related as any)[key]));
  }

  /**
   * Fetch all items.
   * @method fetchAll
   * @static
   * @param {WhereClause} where Where clause.
   * @param {QueryOptions} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<any>} Collection of models.
   */
  static async fetchAll(
    where: WhereClause = {},
    options: QueryOptions = {},
    trx?: Knex.Transaction,
  ): Promise<any> {
    const models = await this.buildQuery(where, options, trx);
    return new (this as any).collection(models);
  }

  /**
   * Fetch one item.
   * @method fetchOne
   * @static
   * @param {WhereClause} where Where clause.
   * @param {QueryOptions} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the item.
   */
  static async fetchOne(
    where: WhereClause = {},
    options: QueryOptions = {},
    trx?: Knex.Transaction,
  ): Promise<any> {
    return await this.buildQuery(where, options, trx).first();
  }

  /**
   * Fetch by id.
   * @method fetchById
   * @static
   * @param {string} id Id to be searched for
   * @param {QueryOptions} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the item.
   */
  static async fetchById(
    id: string,
    options: QueryOptions = {},
    trx?: Knex.Transaction,
  ): Promise<any> {
    return await this.buildQuery({}, options, trx).findById(id);
  }

  /**
   * Delete model
   * @method delete
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<void>} Promise resolved when model deleted.
   */
  async delete(trx?: Knex.Transaction): Promise<void> {
    await this.$query(trx).delete();
  }

  /**
   * Delete by where.
   * @method delete
   * @static
   * @param {WhereClause} where Where clause.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<number>} Amount deleted
   */
  static async delete(
    where: WhereClause,
    trx?: Knex.Transaction,
  ): Promise<number> {
    return await this.query(trx).delete().where(where);
  }

  /**
   * Delete by id.
   * @method deleteById
   * @static
   * @param {string} id Id to be deleted
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<boolean>} True if model deleted.
   */
  static async deleteById(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const numDeleted = await this.query(trx).deleteById(id);
    return numDeleted > 0;
  }

  /**
   * Create new model.
   * @method create
   * @static
   * @param {any} data Model data.
   * @param {QueryOptions} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the inserted record
   */
  static async create(
    data: any,
    options: QueryOptions = {},
    trx?: Knex.Transaction,
  ): Promise<any> {
    const relations = Object.keys((this as any).getRelations());
    const own = omit(data, relations);
    const model = await this.query(trx).insertAndFetch(own);
    await Promise.all(
      relations.map(async (related: string) => {
        if (data[related] && Array.isArray(data[related])) {
          await Promise.all(
            data[related].map(
              async (item: any) =>
                await (model as any).$relatedQuery(related, trx).relate(item),
            ),
          );
        }
      }),
    );
    return model;
  }

  /**
   * Create related in model.
   * @method createRelated
   * @param {string} related Related field.
   * @param {any} data Model data.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the inserted record
   */
  async createRelated(
    related: string,
    data: any,
    trx?: Knex.Transaction,
  ): Promise<any> {
    return await this.$relatedQuery(related, trx).insertGraph(data);
  }

  /**
   * Create related in model and fetch it.
   * @method createRelatedAndFetch
   * @param {string} related Related field.
   * @param {any} data Model data.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the inserted record
   */
  async createRelatedAndFetch(
    related: string,
    data: any,
    trx?: Knex.Transaction,
  ): Promise<any> {
    return await this.$relatedQuery(related, trx).insertGraphAndFetch(data);
  }

  /**
   * Update model.
   * @method update
   * @param {any} data Model data.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async update(data: any, trx?: Knex.Transaction): Promise<void> {
    await this.$query(trx).patch(data);
  }

  /**
   * Update and fetch model.
   * @method updateAndFetch
   * @param {any} data Model data.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async updateAndFetch(data: any, trx?: Knex.Transaction): Promise<void> {
    await this.$query(trx).patchAndFetch(data);
  }

  /**
   * Update model.
   * @method update
   * @static
   * @param {string} id Id of the model.
   * @param {any} data Model data.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Model>} Model of the updated record
   */
  static async update(
    id: string,
    data: any,
    trx?: Knex.Transaction,
  ): Promise<any> {
    const relationObjects = (this as any).getRelations();
    const relations = Object.keys(relationObjects);
    const own = removeUndefined(omit(data, relations));
    let model;
    if (isEmpty(own)) {
      model = await this.fetchById(id, {}, trx);
    } else {
      model = await this.query(trx).updateAndFetchById(id, own);
    }
    await Promise.all(
      relations.map(async (related: string) => {
        if (Array.isArray(data[related])) {
          await (model as any).$relatedQuery(related, trx).unrelate();
          await Promise.all(
            data[related].map(async (item: any) => {
              // Ignore insert related errors
              try {
                await (model as any).$relatedQuery(related, trx).relate(item);
              } catch (e) {
                log.warn(`Can not relate ${item} to ${id}`);
              }
            }),
          );
        } else if (isObject(data[related])) {
          await Promise.all(
            Object.keys(data[related]).map(async (key: string) => {
              if (data[related][key]) {
                // Ignore insert related errors
                try {
                  await (model as any).$relatedQuery(related, trx).relate(key);
                } catch (e) {
                  log.warn(`Can not relate ${key} to ${id}`);
                }
              } else {
                await (model as any)
                  .$relatedQuery(related, trx)
                  .unrelate()
                  .where({
                    [`${relationObjects[related].relatedModelClass.tableName}.${relationObjects[related].relatedProp.cols[0]}`]:
                      key,
                  });
              }
            }),
          );
        }
      }),
    );
    return model;
  }

  /**
   * Return a vocabulary term.
   * @method getVocabularyTerm
   * @param {Request} req Request object.
   * @returns {VocabularyTerm} Vocabulary term.
   */
  getVocabularyTerm(req: Request): VocabularyTerm {
    return {
      title: req.i18n((this as any).title),
      token: (this as any).id,
    };
  }
}
