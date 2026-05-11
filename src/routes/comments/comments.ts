/**
 * Lock routes.
 * @module routes/lock/lock
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import { flatten } from 'es-toolkit/array';
import { v4 as uuid } from 'uuid';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import { getUrl } from '../../helpers/url/url';
import { mapAsync } from '../../helpers/utils/utils';

type Comment = {
  id: string;
  parent: string;
  author: string;
  created: string;
  modified: string;
  text: {
    data: string;
    'mime-type': string;
  };
};

/**
 * Recursively find children of parent
 * @param {Comments[]} comments Array of comments
 * @param id Id of the parent
 * @returns {string[]} List of children id
 */
function findChildren(comments: Comment[], parent: string): string[] {
  const children = comments
    .filter((comment: Comment) => comment.parent === parent)
    .map((comment: Comment) => comment.id);
  const sub = flatten(children.map((id: string) => findChildren(comments, id)));
  return [...children, ...sub];
}

export default [
  {
    op: 'get',
    view: '/@comments',
    permission: 'View Comments',
    client: 'getComments',
    cache: 'content',
    handler: async (req: Request, _trx: Knex.Transaction) => {
      const base_url = `${getUrl(req)}/@comments`;
      const comments = req.document.json.comments || [];
      const modify =
        req.permissions.includes('Modify Comments') ||
        (req.user.id === comments.author &&
          req.permissions.includes('Modify Own Comments'));

      return {
        json: {
          '@id': base_url,
          items: await mapAsync(comments, async (comment: Comment) => {
            return {
              '@id': `${base_url}/${comment.id}`,
              '@parent': comment.parent
                ? `${base_url}/${comment.parent}`
                : null,
              author_name: '',
              author_username: comment.author,
              can_reply: req.permissions.includes('Add Comment'),
              comment_id: comment.id,
              creation_date: comment.created,
              in_reply_to: comment.parent,
              is_deletable: modify,
              is_editable: modify,
              modification_date: comment.modified,
              text: comment.text,
            };
          }),
          items_total: comments.length,
          permissions: {
            can_reply: req.permissions.includes('Add Comment'),
            view_comments: true,
          },
        },
        xkeys: [req.document.uuid],
      };
    },
  },
  {
    op: 'post',
    view: '/@comments',
    permission: 'Add Comment',
    client: 'addComment',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const created = dayjs.utc().format();

      // Check if valid bod
      if (!req.body.text) {
        throw new RequestException(400, {
          message: req.i18n('Text is required to add a comment.'),
        });
      }

      // Add comment
      await req.document.update(
        {
          json: {
            ...req.document.json,
            comments: [
              ...(req.document.json?.comments || []),
              {
                id: uuid(),
                parent: null,
                author: req.user.id,
                created: created,
                modified: created,
                text: {
                  data: req.body.text,
                  'mime-type': 'text/plain',
                },
              },
            ],
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'post',
    view: '/@comments/:parent',
    permission: 'Add Comment',
    client: 'replyComment',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const created = dayjs.utc().format();

      // Check if parent exists
      const comments = req.document.json.comments || [];
      if (
        !comments
          .map((comment: Comment) => comment.id)
          .includes(req.params.parent)
      ) {
        throw new RequestException(400, {
          message: req.i18n('Parent comment does not exist.'),
        });
      }

      // Check if valid body
      if (!req.body.text) {
        throw new RequestException(400, {
          message: req.i18n('Text is required to add a comment.'),
        });
      }

      // Add comment
      await req.document.update(
        {
          json: {
            ...req.document.json,
            comments: [
              ...(req.document.json?.comments || []),
              {
                id: uuid(),
                parent: req.params.parent,
                author: req.user.id,
                created: created,
                modified: created,
                text: {
                  data: req.body.text,
                  'mime-type': 'text/plain',
                },
              },
            ],
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'patch',
    view: '/@comments/:id',
    permission: 'View',
    client: 'updateComment',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const comments = req.document.json.comments || [];
      const index = comments.findIndex(
        (comment: Comment) => comment.id === req.params.id,
      );

      // Check if comment exists
      if (index === -1) {
        throw new RequestException(400, {
          message: req.i18n('Comment does not exist.'),
        });
      }

      // Check permissions
      const modify =
        req.permissions.includes('Modify Comments') ||
        (req.user.id === comments[index].author &&
          req.permissions.includes('Modify Own Comments'));
      if (!modify) {
        throw new RequestException(400, {
          message: req.i18n('You don’t have permission to edit this comment.'),
        });
      }

      // Check if valid body
      if (!req.body.text) {
        throw new RequestException(400, {
          message: req.i18n('Text is required to modify a comment.'),
        });
      }

      // Modify comment
      comments[index].text.data = req.body.text;
      await req.document.update(
        {
          json: {
            ...req.document.json,
            comments,
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@comments/:id',
    permission: 'View',
    client: 'deleteComment',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const comments = req.document.json.comments || [];
      const index = comments.findIndex(
        (comment: Comment) => comment.id === req.params.id,
      );

      // Check if comment exists
      if (index === -1) {
        throw new RequestException(400, {
          message: req.i18n('Comment does not exist.'),
        });
      }

      // Check permissions
      const modify =
        req.permissions.includes('Modify Comments') ||
        (req.user.id === comments[index].author &&
          req.permissions.includes('Modify Own Comments'));
      if (!modify) {
        throw new RequestException(400, {
          message: req.i18n(
            'You don’t have permission to delete this comment.',
          ),
        });
      }

      // Find ids including allchildren
      const ids = [
        comments[index].id,
        ...findChildren(comments, comments[index].id),
      ];

      // Delete comment
      await req.document.update(
        {
          json: {
            ...req.document.json,
            comments: comments.filter(
              (comment: Comment) => !ids.includes(comment.id),
            ),
          },
        },
        trx,
      );

      // Send ok
      return {
        status: 204,
      };
    },
  },
];
