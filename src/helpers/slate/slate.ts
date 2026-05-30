/**
 * Markdown helper.
 * @module helpers/markdown/markdown
 */

interface SlateTextNode {
  text: string;
}

interface SlateParentNode {
  type: string;
  children: SlateNode[];
  data?: Record<string, unknown>;
}

export type SlateNode = SlateParentNode | SlateTextNode;

/**
 * Render a Slate node into Markdown.
 * @param {SlateNode} node The Slate node to render.
 * @param {number} depth The current depth of the node in the tree (used for lists).
 * @param {number} index The index of the node among its siblings (used for ordered lists).
 * @param {string | null} parent The type of the parent node (used to determine list item formatting).
 * @returns {string} A Markdown string representing the node.
 */
function renderMarkdownNode(
  node: SlateNode,
  depth: number,
  index: number,
  parent: string | null,
): string {
  if ('text' in node && !('type' in node)) {
    return (node as SlateTextNode).text ?? '';
  }

  let count = 0;
  const children =
    'children' in node
      ? node.children
          .map((child) => {
            if ('type' in child && child.type === 'li') {
              count = count += 1;
            }
            return renderMarkdownNode(child, depth + 1, count, node.type);
          })
          .join('')
      : '';

  switch (node.type) {
    case 'p':
      return `${children}\n\n`;
    case 'blockquote':
      return `> ${children}\n\n`;
    case 'h1':
      return `# ${children}\n\n`;
    case 'h2':
      return `## ${children}\n\n`;
    case 'h3':
      return `### ${children}\n\n`;
    case 'h4':
      return `#### ${children}\n\n`;
    case 'h5':
      return `##### ${children}\n\n`;
    case 'h6':
      return `###### ${children}\n\n`;
    case 'hr':
      return `---\n\n`;
    case 'strong':
      return `**${children}**`;
    case 'em':
      return `*${children}*`;
    case 'del':
      return `~~${children}~~`;
    case 'sub':
      return `~${children}~`;
    case 'sup':
      return `^${children}^`;
    case 'link':
      const url = 'data' in node ? (node.data?.url ?? '') : '';
      return `[${children}](${url})`;
    case 'li':
      const indent = '    '.repeat(depth - 1);
      if (parent === 'ol') {
        return `${indent}${index}. ${children}\n`;
      }
      return `${indent}- ${children}\n`;
    case 'ul':
    case 'ol':
      return `${children}${depth === 0 ? '\n' : ''}`;
    default:
      return `${children}`;
  }
}

/**
 * Convert Slate nodes to Markdown.
 * @param {SlateNode[]} nodes A Slate array of top-level Slate block nodes.
 * @returns A Markdown string.
 */
export function slateToMarkdown(nodes: SlateNode[]): string {
  return nodes
    ? nodes.map((node) => renderMarkdownNode(node, 0, 0, null)).join('\n\n')
    : '';
}

/**
 * Replace text in Slate nodes.
 * @param {SlateNode[]} nodes A Slate array of top-level Slate block nodes.
 * @param {RegExp} pattern
 * @param {string} replacement
 * @returns {SlateNode[]} Nodes with replaced text
 */
export function slateReplace(
  nodes: SlateNode[],
  pattern: RegExp,
  replacement: string,
): SlateNode[] {
  return nodes.map((node) => {
    if ('text' in node) {
      return {
        ...node,
        text: (node as SlateTextNode).text.replaceAll(pattern, replacement),
      };
    }
    if ('children' in node) {
      return {
        ...node,
        children: slateReplace(node.children, pattern, replacement),
      };
    }
    return node;
  });
}
