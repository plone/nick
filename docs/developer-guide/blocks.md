---
title: Blocks
parent: Developer guide
permalink: /developer-guide/blocks
---

# Blocks

Blocks are content components used in Volto's block-based pages. Each block type registered in the backend provides multiple methods for example a `toMarkdown` method used for Markdown export.

## Block interface

```ts
type Block = {
  toMarkdown?: (self: any, document: any) => string;
  searchableText?: (self: any) => string;
  replace?: (self: any, pattern: RegExp, replacement: string) => any;
  process?: (self: any) => Promise<any>;
};
```

All methods are optional, a missing method falls back to the default block, which does nothing.

- `toMarkdown` receives the block's JSON data (`self`) and the parent document (`document`), and returns a Markdown string.
- `searchableText` returns the text of the block for the `SearchableText` index. The slate block returns its `plaintext`.
- `replace` returns the new `value` of the block with the text replaced, or `false` if nothing changed. It is used by `@replace`.
- `process` returns the block data to store, it is called when content is added or changed. The html block uses it to sanitize its html.

## Creating a block

Create a file that exports a `Block` object:

```ts
// src/blocks/my-block/my-block.ts
export const myBlock = {
  toMarkdown: (self: any, document: any) => {
    return `## ${self.value || ''}\n\n`;
  },
};
```

Block implementations are typically simple — they extract data from the block's JSON (`self`) and format it as Markdown.

## Registration

In a profile's `init()` function, import and register the block:

```ts
import blocks from '../../blocks';
import { myBlock } from '../../blocks/my-block/my-block';

// In init():
blocks.register('myBlock', myBlock);
```

The block name (first argument) must match the `@type` value in the Volto block's JSON data. When a document is converted to Markdown, `Document.toMarkdown()` iterates the document's `blocks_layout.items`, skipping ids missing in `blocks`, looks up each block's `@type` in the registry, and calls its `toMarkdown` method.

## `@plone/plate` documents

`@plone/plate` has its own document model.
Editors built on it, like the default editor of Plone Aurora and the [`@kitconcept/volto-plate`](https://github.com/kitconcept/volto-plate) add-on for Volto, store the whole page in one block with the id and the `@type` `__somersault__`, whose `value` is a Plate document: a list of nodes such as `title`, `p` and `h2`, and other blocks wrapped in nodes of type `ploneBlock` which carry the block data next to its `@type`. When a page has this block, `blocks_layout` and the other blocks are not used for the Markdown and the searchable text.

See [The unified block editor](https://plone-aurora.readthedocs.io/conceptual-guides/unified-editor.html) in the Plone Aurora documentation for the document model and how it relates to Volto blocks.

The core profile registers the `__somersault__` block. It converts the Plate document itself, and calls the methods of the registered blocks for the wrapped blocks, so a block registered for Volto also works inside a `@plone/plate` document.
