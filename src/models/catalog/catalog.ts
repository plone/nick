/**
 * Catalog Model.
 * @module models/catalog/catalog
 */

// Type imports
import type { Json, Request, VocabularyTerm } from '../../types';
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { uniq } from 'es-toolkit/array';
import { pick } from 'es-toolkit/object';

// Internal imports
import { Model } from '../_model/_model';
import config from '../../helpers/config/config';
import { getRootUrl } from '../../helpers/url/url';

dayjs.extend(utc);

/**
 * A model for Catalog.
 * @class Catalog
 * @extends Model
 */
export class Catalog extends Model {
  static idColumn: string = 'document';

  // Declare properties
  declare similarity: number;
  declare path: string;
  declare Type: string;
  declare Title: string;
  declare start: string;
  declare UID: string;
  declare created: string;
  declare modified: string;
  declare end: string;
  declare recurrence: string;

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Json} JSON object.
   */
  toJson(req: Request): Json {
    const self: InstanceType<typeof Catalog> = this;
    const metadata = req.indexes.models.filter(
      (index: any) => index.metadata === true && index.enabled !== false,
    );

    if (
      config.settings.ai?.models?.embed?.enabled &&
      typeof self.similarity === 'number'
    ) {
      metadata.push({
        name: 'similarity',
      });
    }

    return {
      '@id': `${getRootUrl(req)}${self.path}`,
      '@type': self.Type,
      title: self.Title,
      ...pick(
        self,
        metadata.map((field: any) => field.name),
      ),
    } as Json;
  }

  /**
   * Fetch all items but take permissions into account.
   * @method fetchAllRestricted
   * @static
   * @param {Object} where Where clause.
   * @param {Object} options Options for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Request} req Request object.
   * @returns {Promise<any>} JSON object.
   */
  static async fetchAllRestricted(
    where: any = {},
    options: any = {},
    trx?: Knex.Transaction,
    req?: Request,
  ): Promise<any> {
    if (!req) return this.fetchAll(where, options, trx);

    // Find user, groups and roles
    const userGroupsRoles = uniq([
      ...[req.user.id],
      ...req.user._groups.map((groups: any) => groups.id),
      ...req.user.getRoles(),
    ]);

    // Fetch data
    return this.fetchAll(
      { ...where, _allowedUsersGroupsRoles: ['&&', userGroupsRoles] },
      options,
      trx,
    );
  }

  /**
   * Fetch all items closest by embedding but take permissions into account.
   * @method fetchClosestEmbeddingRestricted
   * @static
   * @param {any} embedding Embedding vector to compare.
   * @param {number} limit Limit for the query.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Request} req Request object.
   * @returns {Promise<any>} JSON object.
   */
  static async fetchClosestEmbeddingRestricted(
    embedding: any,
    limit: number,
    trx?: Knex.Transaction,
    req?: Request,
  ): Promise<any> {
    // Fetch data
    return this.fetchAllRestricted(
      {},
      {
        select: [
          '*',
          (this as any)
            .knex()
            .raw(`1 - (_embedding <=> '${embedding}') AS similarity`),
        ],
        order: { column: 'similarity', reverse: true },
        limit,
      },
      trx,
      req,
    );
  }

  /**
   * Returns a vocabulary term.
   * @method getVocabularyTerm
   * @param {Request} req Request object.
   * @returns {VocabularyTerm} Vocabulary term.
   */
  getVocabularyTerm(req: Request): VocabularyTerm {
    const self: InstanceType<typeof Catalog> = this;
    return {
      title: req.i18n(self.Title),
      token: self.Title,
    };
  }

  /**
   * Convert document to ICS event format
   * @method toICSEvent
   * @return {string | null} ICS string or null if start or end date is missing
   */
  toICSEvent(): string | null {
    const self: InstanceType<typeof Catalog> = this;

    // Check if start date is available
    if (!self.start) {
      return null;
    }

    // Set event data
    const event = {
      SUMMARY: self.Title,
      DTSTART: dayjs(self.start).utc().format('YYYYMMDDTHHmmss[Z]'),
      DTSTAMP: dayjs().utc().format('YYYYMMDDTHHmmss[Z]'),
      UID: `${self.UID}@${config.settings.frontendUrl}`,
      CREATED: dayjs(self.created).utc().format('YYYYMMDDTHHmmss[Z]'),
      'LAST-MODIFIED': dayjs(self.modified).utc().format('YYYYMMDDTHHmmss[Z]'),
      URL: `${config.settings.frontendUrl}${self.path === '/' ? '' : self.path}`,
    } as any;

    // Add end date if available
    if (self.end) {
      event.DTEND = dayjs(self.end).utc().format('YYYYMMDDTHHmmss[Z]');
    }

    // Add recurrence rule if available
    if (self.recurrence) {
      self.recurrence.split('\n').forEach((rule: string) => {
        const [key, value] = rule.split(':');
        event[key] = value;
      });
    }

    return `BEGIN:VEVENT
${Object.keys(event)
  .map((key) => `${key}:${event[key]}`)
  .join('\n')}
END:VEVENT`;
  }
}
