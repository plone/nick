/**
 * Default block.
 * @module blocks/_block/_block
 */

export const block = {
  /**
   * Convert to markdown.
   * @param {any} _self The block instance.
   * @param {any} _document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (_self: any, _document: any): string => {
    return '';
  },

  /**
   * Replace text.
   * @param {RegExp} _pattern Pattern to search for.
   * @param {string} _replacement Replacement text.
   * @returns New object or false if nothing found.
   */
  replace: (_pattern: RegExp, _replacement: string): any => false,

  /**
   * Process block.
   * @param {any} self The block instance.
   * @returns {any} Processed block
   */
  process: async (self: any): Promise<any> => self,
};
