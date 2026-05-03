/**
 * Type Model.
 * @module models/type/type
 */

// Type imports
import type { Knex } from 'knex';
import type { Json, Request, Schema } from '../../types';

// External imports
import { compact } from 'es-toolkit/array';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import { mergeSchemas } from '../../helpers/schema/schema';
import { TypeCollection } from '../../collections/type/type';
import { getRootUrl } from '../../helpers/url/url';

/**
 * A model for Type.
 * @class Type
 * @extends Model
 */
export class Type extends Model {
  static collection: (typeof Model)['collection'] =
    TypeCollection as unknown as (typeof Model)['collection'];

  // Set relation mappings
  static get relationMappings() {
    const Workflow = models.get('Workflow');
    return {
      _workflow: {
        relation: (Model as any).BelongsToOneRelation,
        modelClass: Workflow,
        join: {
          from: 'type.workflow',
          to: 'workflow.id',
        },
      },
    };
  }

  /**
   * Cache schema.
   * @method cacheSchema
   * @param {Knex.Transaction} trx Transaction object.
   */
  async cacheSchema(trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
    const Behavior = models.get('Behavior');
    let schema: any;
    if (self.schema?.behaviors && self.schema.behaviors.length > 0) {
      const behaviors = await Behavior.fetchAll(
        {
          id: ['=', self.schema.behaviors],
        },
        {
          order: {
            column: 'id',
            values: self.schema.behaviors,
          },
        },
        trx,
      );
      schema = mergeSchemas(
        {
          name: 'default',
          data: {
            fieldsets: [
              {
                fields: [],
                id: 'default',
                title: 'Default',
                behavior: 'default',
              },
            ],
          },
        },
        {
          name: 'behaviors',
          data: await behaviors.fetchSchema(trx),
        },
        {
          name: 'generated',
          data: self.schema,
        },
      );
    } else {
      schema = self.schema;
    }
    await this.update({ _schema: schema }, trx);
  }

  /**
   * Returns the control panel JSON data.
   * @method toControlPanelJSON
   * @param {Request} req Request object
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Json>} JSON object.
   */
  async toControlPanelJSON(
    req: Request,
    trx?: Knex.Transaction,
  ): Promise<Json> {
    const self: any = this;
    const Behavior = models.get('Behavior');
    const behaviors = await Behavior.fetchAll({}, {}, trx);

    // Get basic data
    const json: any = {
      '@id': `${getRootUrl(req)}/@controlpanels/dexterity-types/${self.id}`,
      title: self.title,
      description: self.description,
      schema: {
        fieldsets: [
          {
            fields: [
              'title',
              'description',
              'allowed_content_types',
              'filter_content_types',
            ],
            id: 'default',
            title: 'Default',
          },
          {
            fields: behaviors.map((behavior: any) => behavior.id),
            id: 'behaviors',
            title: req.i18n('Behaviors'),
          },
        ],
        properties: {
          allowed_content_types: {
            additionalItems: true,
            description: '',
            factory: 'Multiple Choice',
            items: {
              description: '',
              factory: 'Choice',
              title: '',
              type: 'string',
              vocabulary: {
                '@id': `${getRootUrl(req)}/@vocabularies/types`,
              },
            },
            title: req.i18n('Allowed Content Types'),
            type: 'array',
            uniqueItems: true,
          },
          description: {
            description: '',
            factory: 'Text',
            title: req.i18n('Description'),
            type: 'string',
            widget: 'textarea',
          },
          filter_content_types: {
            factory: 'Yes/No',
            title: req.i18n('Filter Contained Types'),
            description: req.i18n(
              'Items of this type can act as a folder containing other items. What content types should be allowed inside?',
            ),
            type: 'boolean',
          },
          title: {
            description: '',
            factory: 'Text line (String)',
            title: req.i18n('Type Name'),
            type: 'string',
          },
        },
        required: ['title', 'filter_content_types'],
      },
      data: {
        title: self.title,
        description: self.description,
        allowed_content_types: self.allowed_content_types,
        filter_content_types: self.filter_content_types,
      },
    };

    // Loop through behaviors
    behaviors.map((behavior: any) => {
      // Set behavior data
      json.data[behavior.id] = self.schema.behaviors
        ? self.schema.behaviors.includes(behavior.id)
        : false;

      // Set behavior schema
      json.schema.properties[behavior.id] = {
        description: req.i18n(behavior.description),
        factory: 'Yes/No',
        title: req.i18n(behavior.title),
        type: 'boolean',
      };
    });

    // Return data
    return json as Json;
  }

  /**
   * Get factory fields.
   * @method getFactoryFields
   * @param {string} factory Factory field.
   * @returns {string[]} Array of fields with given factory.
   */
  getFactoryFields(factory: string): string[] {
    const self: any = this;
    const properties = (self._schema && self._schema.properties) || {};

    // Get factory fields
    const factoryFields = Object.keys(properties).map((property) =>
      properties[property].factory === factory ? property : false,
    );
    return compact(factoryFields) as string[];
  }
}
