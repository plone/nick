---
title: AI Support
nav_order: 3
permalink: /admin-guide/ai
parent: Admin guide
---

# AI Support

Some endpoints require an AI model to function, if this is the case it is specified in the endpoint documentation. You can use existing services or run the modals locally.

## Install local AI models

To run the models locally you start by install [Ollama](https://ollama.com). When Ollama is installed you need an Embedding Model, a Large Language Model and a Vision Model. For this example we will use `nomic-embed-text`, `qwen3` and `llava` but you can use any model you want. To install the models use the following commands:

```shell
$ ollama pull nomic-embed-text
$ ollama pull qwen3
$ ollama pull llava
```

## Install PostgreSQL extension

To store the embedding of words in vectors we will use the [pgvector](https://github.com/pgvector/pgvector) PostgreSQL extension. Follow the instruction on their website to install this extension. Once installed enable the extension by typing the following command in the PostgreSQL console:

```shell
$ CREATE EXTENSION IF NOT EXISTS vector;
```

## Setup the config

Next step is setup the AI models in the config. You can do so by adding following settings to your `config.ts` file:

```ts
export const config = {
  ...
  profiles: [
    '@robgietema/nick:core',
    '@robgietema/nick:ai',
    '@robgietema/nick:default',
  ],
  ...
  ai: {
    models: {
      embed: {
        name: 'nomic-embed-text',
        api: 'http://localhost:11434/api/embed',
        dimensions: 768,
        minSimilarity: 0.6,
        enabled: true,
      },
      llm: {
        name: 'qwen3',
        api: 'http://localhost:11434/api/generate',
        contextSize: 10,
        enabled: true,
      },
      vision: {
        name: 'llava',
        api: 'http://localhost:11434/api/generate',
        enabled: true,
      }
    },
  },
  ...
};
```

The `ai` profile adds 2 extra indexes. One is used to store the embedding of the content in a vector and the other is used to store the context which can be used when RAG is needed. When you choose another embedding model make sure the `dimensions` setting matches with your model. The `contextSize` parameters specifies how many documents are added to the context when using RAG. When the `vision` model is enabled all images will be scanned and text indexed so they can show up in search results.
