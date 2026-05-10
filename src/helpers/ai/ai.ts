/**
 * AI helper.
 * @module helpers/ai/ai
 */

// Type imports
import type { Json, Params } from '../../types';
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import config from '../config/config';
import models from '../../models';

interface VisionResult {
  response: string;
}

interface Message {
  role: string;
  content: string;
}

/**
 * Embed
 * @method embed
 * @param {string} input Value to be embedded
 * @returns {string} Vector of input value
 */
export async function embed(input: string): Promise<string> {
  const response = await fetch(config.settings.ai?.models?.embed?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai.models.embed.name,
      input,
    }),
  });
  const data = await response.json();
  return JSON.stringify(data.embeddings[0]);
}

/**
 * Generate
 * @method generate
 * @param {string} query Query to be used for generation
 * @param {Array<number>} context Context to be used for generation
 * @param {Object} params Params to be used for generation
 * @param {string} prompt Prompt to be used for generation
 * @returns {string} response
 */
export async function generate(
  query: string,
  context: Array<number>,
  params: Params = {},
  prompt: string = 'Please provide an answer to the question and use the given page and site content if needed.',
): Promise<Json> {
  const response = await fetch(config.settings.ai?.models?.llm?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai?.models?.llm?.name,
      context,
      prompt: `Query: ${query}\n${Object.keys(params).map((key: string) => `${key}: ${params[key]}`)}\n${prompt}`,
      stream: false,
      think: false,
    }),
  });
  return await response.json();
}

/**
 * Stream generate
 * @method streamGenerate
 * @param {string} query Query to be used for generation
 * @param {Array<number>} context Context to be used for generation
 * @param {Object} params Params to be used for generation
 * @param {Function|null} callback Callback function to be called with the response
 * @param {string} prompt Prompt to be used for generation
 * @returns {string} response
 */
export function streamGenerate(
  query: string,
  context: Array<number>,
  params: Params = {},
  callback: (token: string) => void,
  prompt: string = 'Please provide an answer to the question and use the given page and site content if needed.',
): undefined {
  fetch(config.settings.ai?.models?.llm?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai?.models?.llm?.name,
      context,
      prompt: `Query: ${query}\n${Object.keys(params).map((key: string) => `${key}: ${params[key]}`)}\n${prompt}`,
      stream: true,
      think: false,
    }),
  }).then(async (response: Response) => {
    const reader: ReadableStreamDefaultReader | undefined =
      response.body?.getReader();
    let readResult;
    if (!reader) return;
    readResult = await reader.read();
    while (!readResult.done) {
      const token = new TextDecoder().decode(readResult.value);
      readResult = await reader.read();
      callback(token);
    }
  });
}

/**
 * Chat
 * @method chat
 * @param {string} query Query to be used for generation
 * @param {Array<Message>} messages Message history
 * @param {Object} params Params to be used for generation
 * @param {Object} tools Tools to be used for generation
 * @param {string} prompt Prompt to be used for generation
 * @returns {string} response
 */
export async function chat(
  query: string,
  messages: Array<Message> = [],
  params: Params = {},
  tools = [],
  prompt: string = 'Please provide an answer to the question and use the given page and site content if needed.',
): Promise<Json> {
  const response = await fetch(config.settings.ai?.models?.llm?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai?.models?.llm?.name,
      messages: [
        ...messages,
        {
          role: 'user',
          content: `Query: ${query}\n${Object.keys(params).map((key: string) => `${key}: ${params[key]}`)}\n${prompt}`,
        },
      ],
      tools,
      stream: false,
      think: false,
    }),
  });
  return await response.json();
}

/**
 * Stream chat
 * @method streamChat
 * @param {string} query Query to be used for generation
 * @param {Array<Message>} messages Message history
 * @param {Object} params Params to be used for generation
 * @param {Object} tools Tools to be used for generation
 * @param {Function|null} callback Callback function to be called with the response
 * @param {string} prompt Prompt to be used for generation
 * @returns {string} response
 */
export function streamChat(
  query: string,
  messages: Array<Message> = [],
  params: Params = {},
  tools = [],
  callback: (token: string) => void,
  prompt: string = 'Please provide an answer to the question and use the given page and site content if needed.',
): undefined {
  fetch(config.settings.ai?.models?.llm?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai?.models?.llm?.name,
      messages: [
        ...messages,
        {
          role: 'user',
          content: `Query: ${query}\n${Object.keys(params).map((key: string) => `${key}: ${params[key]}`)}\n${prompt}`,
        },
      ],
      tools,
      stream: true,
      think: false,
    }),
  }).then(async (response: Response) => {
    const reader: ReadableStreamDefaultReader | undefined =
      response.body?.getReader();
    let readResult;
    if (!reader) return;
    readResult = await reader.read();
    while (!readResult.done) {
      const token = new TextDecoder().decode(readResult.value);
      readResult = await reader.read();
      callback(token);
    }
  });
}

/**
 * Vision
 * @method vision
 * @param {string} data Image data to be processed
 * @returns {VisionResult} response
 */
export async function vision(data: string): Promise<VisionResult> {
  const response = await fetch(config.settings.ai?.models?.vision?.api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.settings.ai?.models?.vision?.name,
      prompt: 'What is in this picture?',
      images: [data],
      stream: false,
    }),
  });
  return await response.json();
}

export async function getEmbedFromPrompt(
  prompt: string,
  req: Request,
  trx: Knex.Transaction,
): Promise<string> {
  const Catalog = models.get('Catalog');

  // Get embedding vector
  const embedding = await embed(prompt);

  // Fetch catalog items with closest embeddings
  const result = await Catalog.fetchClosestEmbeddingRestricted(
    embedding,
    config.settings.ai.models.llm.contextSize,
    trx,
    req,
  );

  // Generate contents from the results
  return result
    .map((item: any) => item.SearchableText)
    .join(' ')
    .replace(/\n/g, ' ');
}
