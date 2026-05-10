/**
 * Generate routes.
 * @module routes/generate/generate
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
import { omit } from 'es-toolkit/object';
import { PDFParse } from 'pdf-parse';

// Internal imports
import {
  chat,
  embed,
  generate,
  streamChat,
  streamGenerate,
  getEmbedFromPrompt,
} from '../../helpers/ai/ai';
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';

export default [
  {
    op: 'post',
    view: '/@generate',
    permission: 'AI',
    client: 'generate',
    cache: 'manage',
    handler: async (
      req: Request,
      trx: Knex.Transaction,
      callback: (token: string) => void,
    ) => {
      // Check if required field provided
      if (!req.body.prompt) {
        throw new RequestException(400, {
          message: req.i18n('Prompt is a required field.'),
        });
      }

      // Check if ai enabled
      if (
        !config.settings.ai?.models?.embed?.enabled ||
        !config.settings.ai?.models?.llm?.enabled
      ) {
        throw new RequestException(400, {
          message: req.i18n('AI is disabled.'),
        });
      }

      let attachment = '';
      if (Object.hasOwn(req.body.params, 'Attachment')) {
        const buffer = Buffer.from(req.body.params.Attachment, 'base64');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        attachment = result.text || '';
      }

      // Create params for the generation
      const params = {
        ...omit(req.body.params, ['Site', 'Attachment']),
        ...(Object.hasOwn(req.body.params, 'Site')
          ? { Site: await getEmbedFromPrompt(req.body.prompt, req, trx) }
          : {}),
        ...(attachment ? { Attachment: attachment.replace(/\n/, '') } : {}),
      };

      if (req.body.stream === true) {
        streamGenerate(req.body.prompt, req.body.context, params, callback);
      } else {
        return {
          json: await generate(req.body.prompt, req.body.context, params),
        };
      }
    },
  },
  {
    op: 'post',
    view: '/@chat',
    permission: 'AI',
    client: 'chat',
    cache: 'manage',
    handler: async (
      req: Request,
      trx: Knex.Transaction,
      callback: (token: string) => void,
    ) => {
      // Check if required field provided
      if (!req.body.prompt) {
        throw new RequestException(400, {
          message: req.i18n('Prompt is a required field.'),
        });
      }

      // Check if ai enabled
      if (
        !config.settings.ai?.models?.embed?.enabled ||
        !config.settings.ai?.models?.llm?.enabled
      ) {
        throw new RequestException(400, {
          message: req.i18n('AI is disabled.'),
        });
      }

      let attachment = '';
      if (Object.hasOwn(req.body.params, 'Attachment')) {
        const buffer = Buffer.from(req.body.params.Attachment, 'base64');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        attachment = result.text || '';
      }

      // Create params for the generation
      const params = {
        ...omit(req.body.params, ['Site', 'Attachment']),
        ...(Object.hasOwn(req.body.params, 'Site')
          ? { Site: await getEmbedFromPrompt(req.body.prompt, req, trx) }
          : {}),
        ...(attachment ? { Attachment: attachment.replace(/\n/, '') } : {}),
      };

      if (req.body.stream === true) {
        streamChat(
          req.body.prompt,
          req.body.messages,
          params,
          req.body.tools,
          callback,
        );
      } else {
        return {
          json: await chat(
            req.body.prompt,
            req.body.messages,
            params,
            req.body.tools,
          ),
        };
      }
    },
  },
];
