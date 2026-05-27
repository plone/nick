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
  toMarkdown: (self: any, document: any) => string;
};
```

The `toMarkdown` method receives the block's JSON data (`self`) and the parent document (`document`), and returns a Markdown string.

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

The block name (first argument) must match the `@type` value in the Volto block's JSON data. When a document is converted to Markdown, `Document.toMarkdown()` iterates the document's `blocks_layout.items`, looks up each block's `@type` in the registry, and calls its `toMarkdown` method.
