/**
 * Plate helper.
 * @module helpers/plate/plate
 *
 * Plate documents are the value of the `__somersault__` block, the document
 * model of `@plone/plate`: a list of Slate nodes with the marks of Plate on the text nodes
 * (`bold`, `italic`, ...), links of type `a` with a `url`, lists as
 * paragraphs with `listStyleType` and `indent`, and other blocks wrapped in
 * nodes of type `ploneBlock` which carry the data of the block next to its
 * `@type`.
 */

export const PLONE_BLOCK_TYPE = 'ploneBlock';

export interface PlateNode {
  type?: string;
  text?: string;
  children?: PlateNode[];
  [key: string]: any;
}

/**
 * Callback which renders the block wrapped in a `ploneBlock` node.
 * @param {PlateNode} node The `ploneBlock` node.
 * @returns {string} The rendered block.
 */
export type PlateBlockRenderer = (node: PlateNode) => string;

/**
 * Check if a node is inline: a text node or a link.
 * @param {PlateNode} node Node to check.
 * @returns {boolean} True if the node is inline.
 */
function isInline(node: PlateNode): boolean {
  return typeof node.text === 'string' || node.type === 'a';
}

/**
 * Get the children of a node.
 * @param {PlateNode} node Node.
 * @returns {PlateNode[]} Children, empty if the node has none.
 */
function getChildren(node: PlateNode): PlateNode[] {
  return Array.isArray(node.children)
    ? node.children.filter((child) => child && typeof child === 'object')
    : [];
}

/**
 * Render a text node with its marks into Markdown.
 * @param {PlateNode} node Text node.
 * @returns {string} Markdown string.
 */
function renderText(node: PlateNode): string {
  let text = node.text ?? '';
  if (text === '') {
    return '';
  }
  if (node.code) {
    text = `\`${text}\``;
  }
  if (node.strikethrough) {
    text = `~~${text}~~`;
  }
  if (node.italic) {
    text = `*${text}*`;
  }
  if (node.bold) {
    text = `**${text}**`;
  }
  return text;
}

/**
 * Render the children of a node into Markdown.
 * @param {PlateNode} node Parent node.
 * @param {PlateBlockRenderer} renderBlock Renderer of wrapped blocks.
 * @returns {string} Markdown string.
 */
function renderChildren(node: PlateNode, renderBlock: PlateBlockRenderer) {
  return renderNodes(getChildren(node), renderBlock);
}

/**
 * Render a table into Markdown, the first row is the header.
 * @param {PlateNode} node Table node.
 * @param {PlateBlockRenderer} renderBlock Renderer of wrapped blocks.
 * @returns {string} Markdown string.
 */
function renderTable(node: PlateNode, renderBlock: PlateBlockRenderer) {
  const rows = getChildren(node).map((row) =>
    getChildren(row).map((cell) =>
      renderChildren(cell, renderBlock)
        .trim()
        .replace(/\s*\n\s*/g, ' ')
        .replaceAll('|', '\\|'),
    ),
  );
  if (rows.length === 0) {
    return '';
  }
  const line = (cells: string[]) => `| ${cells.join(' | ')} |\n`;
  return `${line(rows[0])}${line(rows[0].map(() => '---'))}${rows
    .slice(1)
    .map(line)
    .join('')}\n`;
}

/**
 * Render a single node into Markdown.
 * @param {PlateNode} node Node to render.
 * @param {PlateBlockRenderer} renderBlock Renderer of wrapped blocks.
 * @returns {string} Markdown string.
 */
function renderNode(node: PlateNode, renderBlock: PlateBlockRenderer): string {
  if (typeof node.text === 'string') {
    return renderText(node);
  }
  const children = () => renderChildren(node, renderBlock);

  switch (node.type) {
    case PLONE_BLOCK_TYPE:
      return renderBlock(node);
    case 'title':
    case 'h1':
      return `# ${children()}\n\n`;
    case 'h2':
      return `## ${children()}\n\n`;
    case 'h3':
      return `### ${children()}\n\n`;
    case 'h4':
      return `#### ${children()}\n\n`;
    case 'h5':
      return `##### ${children()}\n\n`;
    case 'h6':
      return `###### ${children()}\n\n`;
    case 'blockquote':
      return `> ${children().trim().replace(/\n/g, '\n> ')}\n\n`;
    case 'hr':
      return '---\n\n';
    case 'a':
      return `[${children()}](${node.url ?? ''})`;
    case 'code_block':
      return `\`\`\`${node.lang ?? ''}\n${getChildren(node)
        .map((line) => getChildren(line).map((leaf) => leaf.text ?? ''))
        .map((leaves) => leaves.join(''))
        .join('\n')}\n\`\`\`\n\n`;
    case 'table':
      return renderTable(node, renderBlock);
    case 'toc':
      return '';
    default:
      // Paragraphs, and elements without a Markdown equivalent
      return getChildren(node).every(isInline)
        ? `${children()}\n\n`
        : children();
  }
}

/**
 * Render a list of sibling nodes into Markdown. Consecutive paragraphs with
 * a `listStyleType` are rendered as one list.
 * @param {PlateNode[]} nodes Nodes to render.
 * @param {PlateBlockRenderer} renderBlock Renderer of wrapped blocks.
 * @returns {string} Markdown string.
 */
function renderNodes(
  nodes: PlateNode[],
  renderBlock: PlateBlockRenderer,
): string {
  let output = '';
  let counters: number[] = [];
  let inList = false;

  nodes.forEach((node) => {
    if (node.listStyleType && typeof node.text !== 'string') {
      const indent = Math.max(1, Number(node.indent) || 1);
      counters = counters.slice(0, indent);
      let marker = '-';
      if (node.listStyleType === 'decimal') {
        counters[indent - 1] =
          node.listStart ?? (counters[indent - 1] ?? 0) + 1;
        marker = `${counters[indent - 1]}.`;
      } else if (node.listStyleType === 'todo') {
        marker = node.checked ? '- [x]' : '- [ ]';
      }
      output += `${'    '.repeat(indent - 1)}${marker} ${renderChildren(
        node,
        renderBlock,
      )}\n`;
      inList = true;
      return;
    }

    // End a list with an empty line
    if (inList) {
      output += '\n';
      counters = [];
      inList = false;
    }
    output += renderNode(node, renderBlock);
  });

  if (inList) {
    output += '\n';
  }
  return output;
}

/**
 * Convert a Plate document to Markdown.
 * @param {PlateNode[]} nodes Top-level nodes of the document.
 * @param {PlateBlockRenderer} renderBlock Renderer of the wrapped blocks.
 * @returns {string} Markdown string.
 */
export function plateToMarkdown(
  nodes: PlateNode[],
  renderBlock: PlateBlockRenderer = () => '',
): string {
  return Array.isArray(nodes)
    ? renderNodes(
        nodes.filter((node) => node && typeof node === 'object'),
        renderBlock,
      )
    : '';
}

/**
 * Get the plain text of a Plate document. The text of each element is
 * separated by a space, the text of inline nodes is joined.
 * @param {PlateNode[]} nodes Nodes of the document.
 * @param {PlateBlockRenderer} blockText Text of the wrapped blocks.
 * @param {string[]} skip Types of the elements to leave out.
 * @returns {string} Plain text.
 */
export function plateToText(
  nodes: PlateNode[],
  blockText: PlateBlockRenderer = () => '',
  skip: string[] = [],
): string {
  if (!Array.isArray(nodes)) {
    return '';
  }
  const text = (node: PlateNode): string => {
    if (typeof node.text === 'string') {
      return node.text;
    }
    if (node.type && skip.includes(node.type)) {
      return '';
    }
    if (node.type === PLONE_BLOCK_TYPE) {
      return blockText(node);
    }
    const children = getChildren(node);
    return children
      .map(text)
      .filter((value) => value !== '')
      .join(children.every(isInline) ? '' : ' ');
  };
  return nodes
    .filter((node) => node && typeof node === 'object')
    .map(text)
    .map((value) => value.trim())
    .filter((value) => value !== '')
    .join(' ');
}

/**
 * Get the blocks wrapped in `ploneBlock` nodes of a Plate document, also
 * those nested in other elements (for example in columns).
 * @param {PlateNode[]} nodes Nodes of the document.
 * @returns {PlateNode[]} The `ploneBlock` nodes.
 */
export function plateBlocks(nodes: PlateNode[]): PlateNode[] {
  if (!Array.isArray(nodes)) {
    return [];
  }
  return nodes
    .filter((node) => node && typeof node === 'object')
    .flatMap((node) =>
      node.type === PLONE_BLOCK_TYPE ? [node] : plateBlocks(getChildren(node)),
    );
}

/**
 * Map the blocks wrapped in `ploneBlock` nodes of a Plate document, also
 * those nested in other elements.
 * @param {PlateNode[]} nodes Nodes of the document.
 * @param {Function} callback Async function returning the new block node.
 * @returns {Promise<PlateNode[]>} Nodes with the blocks replaced.
 */
export async function mapPlateBlocks(
  nodes: PlateNode[],
  callback: (node: PlateNode) => Promise<PlateNode>,
): Promise<PlateNode[]> {
  if (!Array.isArray(nodes)) {
    return nodes;
  }
  return Promise.all(
    nodes.map(async (node) => {
      if (!node || typeof node !== 'object') {
        return node;
      }
      if (node.type === PLONE_BLOCK_TYPE) {
        return callback(node);
      }
      if (Array.isArray(node.children)) {
        return {
          ...node,
          children: await mapPlateBlocks(node.children, callback),
        };
      }
      return node;
    }),
  );
}
