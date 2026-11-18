/**
 * Plate block, the regions of the `@plone/plate` document model.
 * @module blocks/plate/plate
 *
 * Editors built on `@plone/plate`, like the default editor of Plone Aurora
 * and the `@kitconcept/volto-plate` add-on for Volto, store content in
 * regions: entries of `blocks` keyed by the name of the region, whose `@type`
 * is `plate` and whose `value` is a Plate document. The page body is the
 * `main` region, and slots use their own name, like `aboveContent`. Regions
 * are found by their `@type`, never by their key. Once a page has a `main`
 * region, `blocks_layout` and the other blocks are not used.
 *
 * Content saved before regions existed has one region with the key and the
 * type `__somersault__`, which is read as the `main` region.
 */

// External imports
import { isEqual } from 'es-toolkit/predicate';

// Internal imports
import blocks from '..';
import {
  mapPlateBlocks,
  plateToMarkdown,
  plateToText,
} from '../../helpers/plate/plate';
import type {
  PlateNode,
  PlateValue,
  PlateRegion,
} from '../../helpers/plate/plate';
import { slateReplace } from '../../helpers/slate/slate';

/**
 * Type of a Plate region, which names the format of its value.
 * @constant PLATE
 */
export const PLATE = 'plate';

/**
 * Key of the region of the page body.
 * @constant MAIN_REGION
 */
export const MAIN_REGION = 'main';

/**
 * Key and type of the single region of content saved before regions existed.
 * @deprecated Read as the `main` region. Use `MAIN_REGION` and `PLATE`.
 * @constant LEGACY_PLATE
 */
export const LEGACY_PLATE = '__somersault__';

/**
 * Types of Plate regions, the current one and the legacy one.
 * @constant PLATE_TYPES
 */
export const PLATE_TYPES: string[] = [PLATE, LEGACY_PLATE];

/**
 * Check if a block is a Plate region.
 * @function isPlateRegion
 * @param {any} block Block to check.
 * @returns {boolean} True if the block is a Plate region.
 */
export const isPlateRegion = (block: any): block is PlateRegion =>
  typeof block === 'object' &&
  block !== null &&
  PLATE_TYPES.includes(block['@type']);

/**
 * Get the region of the page body: the `main` region, or the legacy
 * `__somersault__` region of content saved before regions existed.
 * @function getMainRegion
 * @param {any} blocks The `blocks` of the content.
 * @returns {PlateRegion | undefined} The region, if there is one.
 */
export const getMainRegion = (blocks: any): PlateRegion | undefined => {
  if (typeof blocks !== 'object' || blocks === null) {
    return undefined;
  }
  return [blocks[MAIN_REGION], blocks[LEGACY_PLATE]].find(isPlateRegion);
};

/**
 * Get all the Plate regions, the region of the page body first, then the
 * regions of the slots.
 * @function getPlateRegions
 * @param {any} blocks The `blocks` of the content.
 * @returns {PlateRegion[]} The regions.
 */
export const getPlateRegions = (blocks: any): PlateRegion[] => {
  const main = getMainRegion(blocks);
  if (typeof blocks !== 'object' || blocks === null) {
    return [];
  }
  return [
    ...(main ? [main] : []),
    // The legacy region is only ever the page body
    ...Object.values(blocks).filter(
      (block: any) => block !== main && block?.['@type'] === PLATE,
    ),
  ] as PlateRegion[];
};

export const plate = {
  /**
   * Convert to markdown, wrapped blocks use the markdown of their type.
   * @param {PlateRegion} self The block instance.
   * @param {any} document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (self: PlateRegion, document: any): string =>
    plateToMarkdown(self.value, (node) =>
      PLATE_TYPES.includes(node['@type'] as string)
        ? ''
        : blocks.get(node['@type']).toMarkdown(node, document),
    ),

  /**
   * Get the searchable text, the title is left out since it is indexed from
   * the title field.
   * @param {PlateRegion} self The block instance.
   * @returns {string} The searchable text.
   */
  searchableText: (self: PlateRegion): string =>
    plateToText(
      self.value,
      (node) =>
        PLATE_TYPES.includes(node['@type'] as string)
          ? ''
          : blocks.get(node['@type']).searchableText(node),
      ['title'],
    ),

  /**
   * Replace text.
   * @param {PlateRegion} self The block instance.
   * @param {RegExp} pattern Pattern to search for.
   * @param {string} replacement Replacement text.
   * @returns {PlateValue | false} New value or false if nothing found.
   */
  replace: (
    self: PlateRegion,
    pattern: RegExp,
    replacement: string,
  ): PlateValue | false => {
    if (!Array.isArray(self.value)) {
      return false;
    }

    // Get new value
    const newValue = slateReplace(self.value, pattern, replacement);

    // Check if nothing changed
    if (isEqual(newValue, self.value)) {
      return false;
    }

    // Return new value, only the text of the text nodes changed
    return newValue as PlateValue;
  },

  /**
   * Process block, the wrapped blocks are processed by their type.
   * @param {PlateRegion} self The block instance.
   * @returns {PlateRegion} Processed block
   */
  process: async (self: PlateRegion): Promise<PlateRegion> =>
    Array.isArray(self.value)
      ? {
          ...self,
          // Only the wrapped blocks are replaced, by their processed data
          value: (await mapPlateBlocks(self.value, (node) =>
            PLATE_TYPES.includes(node['@type'] as string)
              ? Promise.resolve<PlateNode>(node)
              : blocks.get(node['@type']).process(node),
          )) as PlateValue,
        }
      : self,
};
