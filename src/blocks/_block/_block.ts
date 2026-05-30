/**
 * Default block.
 * @module blocks/_block/_block
 */

export const block = {
  /**
   * Convert to markdown.
   * @param self The block instance.
   * @param document The document instance.
   * @returns The markdown string.
   */
  toMarkdown: (_self: any, _document: any) => {
    return '';
  },

  /**
   * Replace text.
   * @param patern Pattern to search for.
   * @param replacement Replacement text.
   * @returns New object or false if nothing found.
   */
  replace: (_pattern: string, _replacement: string): any => false,
};
