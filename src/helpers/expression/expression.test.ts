/**
 * Expression helper tests.
 * @module helpers/expression/expression.test
 */

// External imports
import { describe, expect, it } from 'vitest';

// Internal imports
import {
  type ExpressionObject,
  ExpressionError,
  TraversalError,
  checkExpression,
  compileExpression,
  evaluateExpression,
  registerExpressionMethod,
  truthy,
} from './expression';

/**
 * A fake content object.
 */
class Content implements ExpressionObject {
  readonly expressionKind = 'content';
  fields: Record<string, any>;
  parentObject?: Content;

  constructor(fields: Record<string, any>, parent?: Content) {
    this.fields = fields;
    this.parentObject = parent;
  }

  getAttribute(name: string): any {
    if (name === 'aq_parent') return this.parentObject ?? null;
    if (name === 'id') return this.fields.id;
    if (Object.hasOwn(this.fields, name)) return this.fields[name];
    throw new TraversalError(`No attribute ${name}`);
  }

  callMethod(name: string, args: any[]): any {
    if (name === 'getId') return this.fields.id;
    if (name === 'Title') return this.fields.title;
    if (name === 'custom_check') return args[0] === 'yes';
    throw new Error(`Unknown method ${name}`);
  }
}

/**
 * A fake user.
 */
class User implements ExpressionObject {
  readonly expressionKind = 'user';
  roles: string[];
  permissions: string[];

  constructor(roles: string[], permissions: string[] = []) {
    this.roles = roles;
    this.permissions = permissions;
  }

  getAttribute(): any {
    throw new TraversalError('No attribute');
  }

  callMethod(name: string, args: any[]): any {
    switch (name) {
      case 'getId':
        return 'jane';
      case 'getRolesInContext':
        return this.roles;
      case 'has_role':
        return this.roles.includes(args[0]);
      case 'has_permission':
      case 'checkPermission':
        return this.permissions.includes(args[0]);
    }
    throw new Error(`Unknown method ${name}`);
  }
}

const folder = new Content({ id: 'folder', title: 'Folder' });
const here = new Content(
  { id: 'doc', title: 'Doc', old_state: 'pending', subjects: ['a', 'b'] },
  folder,
);
const scope = (roles: string[] = [], permissions: string[] = []) => {
  const user = new User(roles, permissions);
  return {
    here,
    object: here,
    context: here,
    container: folder,
    user,
    request: {
      expressionKind: 'request',
      getAttribute: () => {
        throw new TraversalError('No attribute');
      },
      callMethod: (name: string, args: any[]) =>
        name === 'get' ? (args[0] === 'flag' ? 'on' : args[1]) : undefined,
    },
    state_change: {
      expressionKind: 'statechange',
      getAttribute: (name: string) =>
        name === 'kwargs' ? { comment: 'Looks good' } : null,
      callMethod: (name: string) =>
        name === 'getHistory' ? [{ action: 'submit' }] : new Date(0),
    },
    transition: {
      expressionKind: 'transition',
      getAttribute: () => 'publish',
      callMethod: () => 'publish',
    },
  };
};

describe('Expression', () => {
  describe('python expressions', () => {
    it('evaluates comparisons and boolean operators', async () => {
      expect(await evaluateExpression('python:1 < 2 <= 2', scope())).toBe(true);
      expect(await evaluateExpression('python:1 < 2 > 3', scope())).toBe(false);
      expect(
        await evaluateExpression("python:'a' in ['a', 'b']", scope()),
      ).toBe(true);
      expect(await evaluateExpression("python:'c' not in 'abc'", scope())).toBe(
        false,
      );
      expect(await evaluateExpression('python:None is None', scope())).toBe(
        true,
      );
      expect(await evaluateExpression("python:0 or ''", scope())).toBe('');
      expect(await evaluateExpression("python:1 and 'x'", scope())).toBe('x');
      expect(await evaluateExpression('python:not []', scope())).toBe(true);
      expect(
        await evaluateExpression(
          "python:'yes' if 1 + 1 == 2 else 'no'",
          scope(),
        ),
      ).toBe('yes');
      expect(
        await evaluateExpression("python:{'a': 1}['a'] * 3", scope()),
      ).toBe(3);
    });

    it('reads attributes and calls methods of the content object', async () => {
      expect(
        await evaluateExpression(
          "python:getattr(here, 'old_state', None) == 'pending'",
          scope(),
        ),
      ).toBe(true);
      expect(
        await evaluateExpression("python:getattr(here, 'missing', 3)", scope()),
      ).toBe(3);
      expect(
        await evaluateExpression("python:hasattr(here, 'missing')", scope()),
      ).toBe(false);
      expect(
        await evaluateExpression('python:here.aq_parent.getId()', scope()),
      ).toBe('folder');
      expect(
        await evaluateExpression(
          'python:object.subjects and object.title',
          scope(),
        ),
      ).toBe('Doc');
      expect(
        await evaluateExpression('python:len(here.subjects)', scope()),
      ).toBe(2);
    });

    it('checks roles and permissions of the user', async () => {
      const expression =
        'python: user.has_permission("Review portal content", here) or user.has_role("Owner", here)';
      expect(await evaluateExpression(expression, scope(['Owner']))).toBe(true);
      expect(
        await evaluateExpression(
          expression,
          scope([], ['Review portal content']),
        ),
      ).toBe(true);
      expect(await evaluateExpression(expression, scope(['Reader']))).toBe(
        false,
      );
      expect(
        await evaluateExpression(
          "python:checkPermission('Modify portal content', here)",
          scope([], ['Modify portal content']),
        ),
      ).toBe(true);
      expect(
        await evaluateExpression(
          "python:'Reviewer' in user.getRolesInContext(here)",
          scope(['Reviewer']),
        ),
      ).toBe(true);
    });

    it('reads the request and the state change', async () => {
      expect(
        await evaluateExpression("python:request.get('flag', False)", scope()),
      ).toBe('on');
      expect(
        await evaluateExpression("python:request.get('other', False)", scope()),
      ).toBe(false);
      expect(
        await evaluateExpression(
          "python:state_change.kwargs.get('comment', '')",
          scope(),
        ),
      ).toBe('Looks good');
    });
  });

  describe('path expressions', () => {
    it('traverses names and calls methods', async () => {
      expect(await evaluateExpression('user/getId', scope())).toBe('jane');
      expect(await evaluateExpression('here/title', scope())).toBe('Doc');
      expect(
        await evaluateExpression('state_change/getHistory', scope()),
      ).toEqual([{ action: 'submit' }]);
      expect(
        await evaluateExpression('transition/getId|nothing', scope()),
      ).toBe('publish');
    });

    it('uses the alternatives when a path fails', async () => {
      expect(await evaluateExpression('here/title | nothing', scope())).toBe(
        'Doc',
      );
      expect(
        await evaluateExpression('here/description | string:none', scope()),
      ).toBe('none');
      expect(await evaluateExpression('here/language | nothing', scope())).toBe(
        null,
      );
    });

    it('supports not:, exists: and string:', async () => {
      expect(await evaluateExpression('not:here/title', scope())).toBe(false);
      expect(await evaluateExpression('exists:here/title', scope())).toBe(true);
      expect(await evaluateExpression('exists:here/rights', scope())).toBe(
        false,
      );
      expect(
        await evaluateExpression(
          'string:${here/title} by $user/getId $$',
          scope(),
        ),
      ).toBe('Doc by jane $');
    });
  });

  describe('unsupported expressions', () => {
    it('refuses unknown names, methods and syntax', () => {
      expect(checkExpression('python:here.guard_handler("submit")')).toMatch(
        /not registered/,
      );
      expect(checkExpression('here/isValid')).toMatch(/registered method/);
      expect(checkExpression('python:__import__("os")')).toMatch(
        /not a function/,
      );
      expect(checkExpression('python:here.__class__')).toMatch(/Private/);
      expect(checkExpression('python:lambda: 1')).toMatch(/not supported/);
      expect(checkExpression('python:[x for x in here.subjects]')).toMatch(
        /not supported/,
      );
      expect(checkExpression('python:here.title.__len__()')).toBeDefined();
      expect(checkExpression('python:modules["os"]')).toMatch(/Unknown name/);
      expect(checkExpression('python:open("/etc/passwd")')).toMatch(
        /not a function/,
      );
      expect(checkExpression('python:user.getUser()')).toMatch(
        /Unknown method/,
      );
      expect(checkExpression('python:1 +')).toBeDefined();
      expect(checkExpression('exec:1')).toMatch(/Unsupported expression type/);
      expect(() => compileExpression('python:here.foo(')).toThrow(
        ExpressionError,
      );
    });

    it('accepts methods of the content object once they are registered', async () => {
      expect(checkExpression('python:here.custom_check("yes")')).toBeDefined();
      registerExpressionMethod('custom_check', (content: any, value: string) =>
        content.callMethod('custom_check', [value]),
      );
      expect(
        checkExpression('python:here.custom_check("yes")'),
      ).toBeUndefined();
      expect(checkExpression('here/custom_check')).toBeUndefined();
      expect(
        await evaluateExpression('python:here.custom_check("yes")', scope()),
      ).toBe(true);
    });
  });

  describe('truthy', () => {
    it('follows python truth values', () => {
      expect([0, '', [], {}, null, undefined, false].map(truthy)).toEqual([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ]);
      expect([1, 'a', [0], { a: 1 }, new Date()].map(truthy)).toEqual([
        true,
        true,
        true,
        true,
        true,
      ]);
    });
  });
});
