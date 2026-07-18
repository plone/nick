/**
 * Content helper.
 * @module helpers/content/content
 */

// Type imports
import type { Request, Schema } from '../../types';

// External imports
import { last } from 'es-toolkit/array';
import { isObject } from 'es-toolkit/compat';
import { Knex } from 'knex';
import mime from 'mime-types';
import { PDFParse } from 'pdf-parse';

// Internal imports
import { vision } from '../ai/ai';
import blocks from '../../blocks';
import config from '../config/config';
import { readProfileFile, writeFile, writeImage } from '../fs/fs';
import { getFactoryFields } from '../schema/schema';
import { mapAsync } from '../utils/utils';
import { getUrl } from '../../helpers/url/url';
import models from '../../models';
import { handler as actions } from '../../routes/actions/actions';
import { handler as breadcrumbs } from '../../routes/breadcrumbs/breadcrumbs';
import { handler as contextnavigation } from '../../routes/contextnavigation/contextnavigation';
import { handler as inherit } from '../../routes/inherit/inherit';
import { handler as navigation } from '../../routes/navigation/navigation';
import { handler as navroot } from '../../routes/navroot/navroot';
import { handler as related } from '../../routes/related/related';
import { handler as translations } from '../../routes/translations/translations';
import { handler as types } from '../../routes/types/types';
import { handler as workflow } from '../../routes/workflow/workflow';

interface BlockHref {
  '@id': string;
  image_field?: string;
  image_scales?: Record<string, any>;
}

interface Block {
  href?: BlockHref[];
  slides?: Array<{
    image?: BlockHref[];
  }>;
  blocks?: Record<string, Block>;
}

interface Json {
  blocks?: Record<string, Block>;
  [key: string]: any;
}

/**
 * Handle file uploads and updates
 * @method handleFiles
 * @param {Json} json Current json object.
 * @param {Schema} schema Schema object.
 * @param {Knex.Transaction} trx Transaction object.
 * @param {string} profile Path of the profile.
 * @returns {Json} Fields with uuid info.
 */
export async function handleFiles(
  json: Json,
  schema: Schema,
  trx: Knex.Transaction,
  profile?: string,
): Promise<Json> {
  // Make a copy of the json data
  const fields = { ...json };

  // Get file fields
  const fileFields = getFactoryFields(schema, 'File');

  await mapAsync(fileFields, async (field) => {
    // Check if filename is specified
    if (typeof fields[field] === 'string' && profile) {
      fields[field] = {
        data: await readProfileFile(profile, fields[field]),
        encoding: 'base64',
        'content-type':
          mime.lookup(`${profile}${fields[field]}`) ||
          'application/octet-stream',
        filename: last(fields[field].split('/')) || '',
      };
    }

    // Check if new data is uploaded
    if (
      fields[field] &&
      typeof fields[field] === 'object' &&
      'data' in fields[field]
    ) {
      // Create filestream
      const { uuid, size } = await writeFile(
        fields[field].data,
        fields[field].encoding,
        trx,
      );

      // Check if pdf
      let text = '';
      if (fields[field]['content-type'] === 'application/pdf') {
        const buffer = Buffer.from(fields[field].data, fields[field].encoding);
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        text = (result.text || '').replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
          '',
        );
      }

      // Set data
      fields[field] = {
        'content-type': fields[field]['content-type'],
        uuid,
        filename: fields[field].filename,
        size,
        text,
      };
    } else if (
      fields[field] &&
      typeof fields[field] === 'object' &&
      !('data' in fields[field])
    ) {
      delete fields[field];
    }
  });

  // Return new field data
  return fields;
}

/**
 * Handle image uploads and updates
 * @method handleImages
 * @param {Json} json Current json object.
 * @param {Schema} schema Schema object.
 * @param {Knex.Transaction} trx Transaction object.
 * @param {string} profile Path of the profile.
 * @returns {Json} Fields with uuid info.
 */
export async function handleImages(
  json: Json,
  schema: Schema,
  trx: Knex.Transaction,
  profile?: string,
): Promise<Record<string, any>> {
  // Make a copy of the json data
  const fields = { ...json };

  // Get file fields
  const imageFields = getFactoryFields(schema, 'Image');

  await mapAsync(imageFields, async (field) => {
    // Check if filename is specified
    if (typeof fields[field] === 'string' && profile) {
      fields[field] = {
        data: await readProfileFile(profile, fields[field]),
        encoding: 'base64',
        'content-type':
          mime.lookup(`${profile}${fields[field]}`) ||
          'application/octet-stream',
        filename: last(fields[field].split('/')) || '',
      };
    }

    // Check if new data is uploaded
    if (
      fields[field] &&
      typeof fields[field] === 'object' &&
      'data' in fields[field]
    ) {
      // Create filestream
      const { uuid, size, width, height, scales } = await writeImage(
        fields[field].data,
        fields[field].encoding,
        trx,
      );

      // Check if vision is enabled
      let text = '';
      if (config.settings.ai?.models?.vision?.enabled) {
        // Add vision data
        const result = await vision(fields[field].data);
        text = result.response || '';
      }

      // Set data
      fields[field] = {
        'content-type': fields[field]['content-type'],
        uuid,
        width,
        height,
        scales,
        filename: fields[field].filename,
        size,
        text,
      };
    } else if (
      fields[field] &&
      typeof fields[field] === 'object' &&
      !('data' in fields[field])
    ) {
      delete fields[field];
    }
  });

  // Return new field data
  return fields;
}

/**
 * Handle relation lists
 * @method handleRelationLists
 * @param {Json} json Current json object.
 * @param {Schema} schema Schema object.
 * @returns {Json} Fields with uuid info.
 */
export async function handleRelationLists(
  json: Json,
  schema: Schema,
): Promise<Record<string, any>> {
  // Make a copy of the json data
  const fields = { ...json };

  // Get file fields
  const relationListFields = getFactoryFields(schema, 'Relation List');

  // Strip all but the UID from the document data
  await mapAsync(relationListFields, async (field) => {
    if (fields[field]) {
      fields[field] = fields[field].map((document: { UID: string } | string) =>
        typeof document === 'object' ? document.UID : document,
      );
    }
  });

  // Return new field data
  return fields;
}

/**
 * Handle blocks
 * @method handleBlocks
 * @param {Json} json Current json object.
 * @returns {Json} Json with blocks processed.
 */
export async function handleBlocks(json: Json): Promise<Json> {
  // Make a copy of the json data
  const output = { ...json };

  if (output.blocks && isObject(output.blocks)) {
    await Promise.all(
      Object.keys(output.blocks).map(async (blockId) => {
        const blockData: any = output.blocks?.[blockId];
        const block = blocks.get(blockData['@type']);
        output.blocks![blockId] = await block.process(blockData);
      }),
    );
  }

  // Return new json data
  return output;
}

/**
 * Handle block references
 * @method handleBlockReferences
 * @param {Json} json Current json object.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Json} Json with references expanded.
 */
export async function handleBlockReferences(
  json: Json,
  trx: Knex.Transaction,
): Promise<Json> {
  const Catalog = models.get('Catalog');
  // Make a copy of the json data
  const output = { ...json };

  const extendHref = async (
    href: BlockHref,
    trx: Knex.Transaction,
  ): Promise<BlockHref> => {
    const target: InstanceType<typeof Catalog> = await Catalog.fetchOne(
      { _path: href['@id'] },
      {},
      trx,
    );
    if (target) {
      return {
        ...href,
        image_field: target.image_field,
        image_scales: target.image_scales,
      };
    }
    return href;
  };

  if (output.blocks && isObject(output.blocks)) {
    await Promise.all(
      Object.keys(output.blocks).map(async (block) => {
        if (isObject(output.blocks?.[block].href)) {
          output.blocks[block].href[0] = await extendHref(
            output.blocks[block].href[0],
            trx,
          );
        }
        if (isObject(output.blocks?.[block].slides)) {
          await Promise.all(
            Object.keys(output.blocks[block].slides).map(
              async (slide, index) => {
                if (isObject(output.blocks?.[block].slides?.[index].image)) {
                  output.blocks[block].slides[index].image[0] =
                    await extendHref(
                      output.blocks[block].slides[index].image[0],
                      trx,
                    );
                }
              },
            ),
          );
        }
        if (isObject(output.blocks?.[block].blocks)) {
          await Promise.all(
            Object.keys(output.blocks[block].blocks).map(async (subblock) => {
              if (isObject(output.blocks?.[block].blocks?.[subblock].href)) {
                output.blocks[block].blocks[subblock].href[0] =
                  await extendHref(
                    output.blocks[block].blocks[subblock].href[0],
                    trx,
                  );
              }
            }),
          );
        }
      }),
    );
  }

  // Return new json data
  return output;
}

export async function getComponents(
  req: Request,
  trx: Knex.Transaction,
  expand: string[],
): Promise<Record<string, any>> {
  const components: { [key: string]: any } = {};

  // Get base url
  const baseUrl = getUrl(req);

  // Include catalog expander
  if (expand.includes('catalog')) {
    await req.document.fetchRelated('_catalog', trx);

    if (req.document._children) {
      await mapAsync(req.document._children, async (child: any) => {
        await child.fetchRelated('_catalog', trx);
        await child.fetchRelationLists(trx);
      });
    }
    components.catalog = {
      ...req.document._catalog.toJson(req),
      '@id': `${baseUrl}/@catalog`,
    };
  } else {
    components.catalog = { '@id': `${baseUrl}/@catalog` };
  }

  // Include actions expander
  if (expand.includes('actions')) {
    components.actions = (await actions(req, trx)).json;
  } else {
    components.actions = { '@id': `${baseUrl}/@actions` };
  }

  // Include breadcrumbs expander
  if (expand.includes('breadcrumbs')) {
    components.breadcrumbs = (await breadcrumbs(req, trx)).json;
  } else {
    components.breadcrumbs = { '@id': `${baseUrl}/@breadcrumbs` };
  }

  // Include contextnavigation expander
  if (expand.includes('contextnavigation')) {
    components.contextnavigation = (await contextnavigation(req, trx)).json;
  } else {
    components.contextnavigation = { '@id': `${baseUrl}/@contextnavigation` };
  }

  // Include navigation expander
  if (expand.includes('navigation')) {
    components.navigation = (await navigation(req, trx)).json;
  } else {
    components.navigation = { '@id': `${baseUrl}/@navigation` };
  }

  // Include navroot expander
  if (expand.includes('navroot')) {
    components.navroot = (await navroot(req, trx)).json;
  } else {
    components.navroot = { '@id': `${baseUrl}/@navroot` };
  }

  // Include related expander
  if (expand.includes('related')) {
    components.related = (await related(req, trx)).json;
  } else {
    components.related = { '@id': `${baseUrl}/@related` };
  }

  // Include types expander
  if (expand.includes('types')) {
    components.types = (await types(req, trx)).json;
  } else {
    components.types = { '@id': `${baseUrl}/@types` };
  }

  // Include workflow expander
  if (expand.includes('workflow')) {
    components.workflow = (await workflow(req, trx)).json;
  } else {
    components.workflow = { '@id': `${baseUrl}/@workflow` };
  }

  // Include translations expander
  if (expand.includes('translations')) {
    components.translations = (await translations(req, trx)).json;
  } else {
    components.translations = { '@id': `${baseUrl}/@translations` };
  }

  // Include inherit expander
  if (expand.includes('inherit')) {
    components.inherit = (await inherit(req, trx)).json;
  } else {
    components.inherit = { '@id': `${baseUrl}/@inherit` };
  }

  // Return components
  return components;
}
