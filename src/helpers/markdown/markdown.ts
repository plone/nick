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

type SlateNode = SlateParentNode | SlateTextNode;

/**
 * Render a Slate node into Markdown.
 * @param node The Slate node to render.
 * @param depth The current depth of the node in the tree (used for lists).
 * @param index The index of the node among its siblings (used for ordered lists).
 * @param parent The type of the parent node (used to determine list item formatting).
 * @returns A Markdown string representing the node.
 */
function renderNode(
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
            return renderNode(child, depth + 1, count, node.type);
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
 * @param nodes A Slate array of top-level Slate block nodes.
 * @returns A Markdown string.
 */
export function slateToMarkdown(nodes: SlateNode[]): string {
  return nodes
    ? nodes.map((node) => renderNode(node, 0, 0, null)).join('\n\n')
    : '';
}
