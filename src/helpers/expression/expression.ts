/**
 * Expression helper: a safe evaluator for the subset of TALES used in
 * DCWorkflow guards and variables (`python:`, path, `not:`, `string:`,
 * `exists:` and `nocall:` expressions).
 *
 * Expressions are parsed into a syntax tree and checked before they are
 * used: every name, attribute and method has to be known. Nothing is ever
 * passed to `eval` or `Function`, and there is no access to JavaScript
 * properties of the values. Methods of the content object that are not
 * built in (like `here.guard_handler('submit')` in senaite) can be provided
 * by add-ons with `registerExpressionMethod`; until then an expression
 * using them is unsupported.
 * @module helpers/expression/expression
 */

/**
 * Error for expressions which are not valid or not supported.
 * @class ExpressionError
 */
export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionError';
  }
}

/**
 * An object exposed to expressions, like the content object or the user.
 * `kind` selects the attributes and methods the checker allows.
 */
export interface ExpressionObject {
  readonly expressionKind: string;
  getAttribute(name: string): any | Promise<any>;
  callMethod(name: string, args: any[]): any | Promise<any>;
}

/**
 * A method of the content object provided by an add-on.
 */
export type ExpressionMethod = (content: any, ...args: any[]) => any;

// Methods provided by add-ons, by name (`@@name` for views)
const methods: Record<string, ExpressionMethod> = {};

/**
 * Register a method of the content object for expressions, for example
 * `registerExpressionMethod('guard_handler', async (content, action) => …)`
 * for `python:here.guard_handler('submit')` or `here/guard_handler`. A
 * name starting with `@@` provides a view (`here/@@can-be-closed`). The
 * function gets the content object (with `document`, `user` and `trx`) and
 * the arguments of the call.
 * @method registerExpressionMethod
 * @param {string} name Name of the method.
 * @param {ExpressionMethod} method The method.
 */
export function registerExpressionMethod(
  name: string,
  method: ExpressionMethod,
): void {
  methods[name] = method;
  cache.clear();
}

/**
 * Get a registered expression method.
 * @method getExpressionMethod
 * @param {string} name Name of the method.
 * @returns {ExpressionMethod | undefined} The method.
 */
export function getExpressionMethod(
  name: string,
): ExpressionMethod | undefined {
  return Object.hasOwn(methods, name) ? methods[name] : undefined;
}

// -- Kinds of values and what the checker allows on them -----------------

type Kind =
  | 'any'
  | 'content'
  | 'user'
  | 'request'
  | 'membership'
  | 'workflowtool'
  | 'statechange'
  | 'transition'
  | 'state'
  | 'workflow'
  | 'mapping'
  | 'date'
  | 'function';

interface KindInfo {
  attributes: Record<string, Kind>;
  methods: Record<string, Kind>;
}

/**
 * Attributes and methods by kind. Attributes of `content` that are not
 * listed are field values (python expressions only); methods of `content`
 * that are not listed must be registered.
 */
export const kinds: Record<string, KindInfo> = {
  content: {
    attributes: {
      id: 'any',
      portal_type: 'any',
      aq_parent: 'content',
      aq_inner: 'content',
      aq_base: 'content',
      REQUEST: 'request',
      portal_membership: 'membership',
      portal_workflow: 'workflowtool',
    },
    methods: {
      getId: 'any',
      Title: 'any',
      Description: 'any',
      UID: 'any',
      Creator: 'any',
      listCreators: 'any',
      Subject: 'any',
      Language: 'any',
      getPortalTypeName: 'any',
      getParentNode: 'content',
      absolute_url: 'any',
      absolute_url_path: 'any',
      getPhysicalPath: 'any',
      effective: 'date',
      expires: 'date',
      created: 'date',
      modified: 'date',
      isExpired: 'any',
    },
  },
  user: {
    attributes: { id: 'any' },
    methods: {
      getId: 'any',
      getUserId: 'any',
      getUserName: 'any',
      getRoles: 'any',
      getRolesInContext: 'any',
      getGroups: 'any',
      has_role: 'any',
      has_permission: 'any',
      checkPermission: 'any',
      allowed: 'any',
    },
  },
  request: {
    attributes: { form: 'mapping' },
    methods: { get: 'any', has_key: 'any' },
  },
  membership: {
    attributes: {},
    methods: {
      getAuthenticatedMember: 'user',
      isAnonymousUser: 'any',
      checkPermission: 'any',
    },
  },
  workflowtool: {
    attributes: {},
    methods: { getInfoFor: 'any' },
  },
  statechange: {
    attributes: {
      object: 'content',
      workflow: 'workflow',
      transition: 'transition',
      old_state: 'state',
      new_state: 'state',
      status: 'mapping',
      kwargs: 'mapping',
    },
    methods: { getHistory: 'any', getDateTime: 'date', getPortal: 'content' },
  },
  transition: {
    attributes: { id: 'any', title: 'any', new_state_id: 'any' },
    methods: { getId: 'any' },
  },
  state: {
    attributes: { id: 'any', title: 'any' },
    methods: { getId: 'any' },
  },
  workflow: {
    attributes: { id: 'any', title: 'any' },
    methods: { getId: 'any' },
  },
  mapping: {
    attributes: {},
    methods: {
      get: 'any',
      keys: 'any',
      values: 'any',
      items: 'any',
      has_key: 'any',
    },
  },
  date: {
    attributes: {},
    methods: {
      isPast: 'any',
      isFuture: 'any',
      ISO8601: 'any',
      ISO: 'any',
      timeTime: 'any',
    },
  },
  any: {
    attributes: {},
    methods: {
      get: 'any',
      keys: 'any',
      values: 'any',
      items: 'any',
      startswith: 'any',
      endswith: 'any',
      lower: 'any',
      upper: 'any',
      strip: 'any',
      split: 'any',
      count: 'any',
      index: 'any',
      join: 'any',
    },
  },
};

/**
 * Fields that may be traversed on content in path expressions. Other
 * names are ambiguous in a path (a field or a method of the Python class)
 * and must be registered as methods.
 */
export const pathFields = [
  'title',
  'description',
  'subjects',
  'effective',
  'expires',
  'language',
  'creators',
  'contributors',
  'rights',
  'text',
  'exclude_from_nav',
  'review_state',
];

// Names available in every expression
const names: Record<string, Kind> = {
  here: 'content',
  object: 'content',
  context: 'content',
  container: 'content',
  folder: 'content',
  portal: 'content',
  user: 'user',
  member: 'user',
  request: 'request',
  REQUEST: 'request',
  state_change: 'statechange',
  transition: 'transition',
  status: 'mapping',
  kwargs: 'mapping',
  workflow: 'workflow',
  nothing: 'any',
  None: 'any',
  True: 'any',
  False: 'any',
};

// Functions available in python expressions
const functions = [
  'checkPermission',
  'getattr',
  'hasattr',
  'len',
  'str',
  'int',
  'float',
  'bool',
  'test',
  'same_type',
  'DateTime',
  'list',
  'tuple',
  'min',
  'max',
];

// -- Syntax tree ----------------------------------------------------------

type Node =
  | { type: 'const'; value: any }
  | { type: 'name'; name: string }
  | { type: 'attr'; object: Node; name: string }
  | { type: 'call'; callee: Node; args: Node[]; kwargs: Record<string, Node> }
  | { type: 'index'; object: Node; index: Node }
  | { type: 'list'; items: Node[] }
  | { type: 'dict'; entries: [Node, Node][] }
  | { type: 'not'; operand: Node }
  | { type: 'neg'; operand: Node }
  | { type: 'bool'; op: 'and' | 'or'; left: Node; right: Node }
  | { type: 'binary'; op: string; left: Node; right: Node }
  | { type: 'compare'; ops: string[]; operands: Node[] }
  | { type: 'ternary'; test: Node; then: Node; otherwise: Node }
  | { type: 'path'; alternatives: PathAlternative[] }
  | { type: 'string'; parts: (string | Node)[] }
  | { type: 'exists'; path: Node };

type PathAlternative =
  { type: 'segments'; segments: string[] } | { type: 'expression'; node: Node };

// -- Python tokenizer and parser -----------------------------------------

interface Token {
  type: 'name' | 'number' | 'string' | 'op' | 'end';
  value: any;
  position: number;
}

const operators = [
  '==',
  '!=',
  '<=',
  '>=',
  '//',
  '**',
  '<',
  '>',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  ',',
  '.',
  ':',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
];

/**
 * Split a python expression into tokens.
 * @method tokenize
 * @param {string} source Python expression.
 * @returns {Token[]} Tokens.
 */
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char) || char === '\\') {
      i += 1;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i))!;
      tokens.push({ type: 'name', value: match[0], position: i });
      i += match[0].length;
      continue;
    }
    if (/[0-9]/.test(char)) {
      const match = /^[0-9]+(\.[0-9]+)?/.exec(source.slice(i))!;
      tokens.push({ type: 'number', value: Number(match[0]), position: i });
      i += match[0].length;
      continue;
    }
    if (
      char === '"' ||
      char === "'" ||
      (/[rRuUbB]/.test(char) && /['"]/.test(source[i + 1] || ''))
    ) {
      const raw = /[rR]/.test(char);
      const start = /['"]/.test(char) ? i : i + 1;
      const quote = source[start];
      const triple = source.substr(start, 3) === quote.repeat(3);
      const end = triple ? quote.repeat(3) : quote;
      let j = start + end.length;
      let value = '';
      while (j < source.length && source.substr(j, end.length) !== end) {
        if (source[j] === '\\' && !raw) {
          const next = source[j + 1];
          value +=
            (
              {
                n: '\n',
                t: '\t',
                r: '\r',
                '\\': '\\',
                "'": "'",
                '"': '"',
              } as any
            )[next] ?? `\\${next}`;
          j += 2;
        } else {
          value += source[j];
          j += 1;
        }
      }
      if (j >= source.length) {
        throw new ExpressionError('Unterminated string.');
      }
      tokens.push({ type: 'string', value, position: i });
      i = j + end.length;
      continue;
    }
    const operator = operators.find((op) => source.startsWith(op, i));
    if (!operator) {
      throw new ExpressionError(`Unsupported character "${char}".`);
    }
    tokens.push({ type: 'op', value: operator, position: i });
    i += operator.length;
  }
  tokens.push({ type: 'end', value: undefined, position: source.length });
  return tokens;
}

// Python keywords which are not part of the supported subset
const unsupportedKeywords = [
  'lambda',
  'for',
  'yield',
  'import',
  'del',
  'exec',
  'print',
  'global',
  'class',
  'def',
  'return',
  'while',
  'await',
  'async',
];

/**
 * Recursive descent parser for the python subset.
 * @class Parser
 */
class Parser {
  tokens: Token[];
  position = 0;

  constructor(source: string) {
    this.tokens = tokenize(source);
  }

  peek(offset = 0): Token {
    return this.tokens[
      Math.min(this.position + offset, this.tokens.length - 1)
    ];
  }

  next(): Token {
    const token = this.peek();
    this.position += 1;
    return token;
  }

  isOp(value: string): boolean {
    return this.peek().type === 'op' && this.peek().value === value;
  }

  isName(value: string): boolean {
    return this.peek().type === 'name' && this.peek().value === value;
  }

  expect(value: string): void {
    if (!this.isOp(value)) {
      throw new ExpressionError(
        `Expected "${value}" at position ${this.peek().position}.`,
      );
    }
    this.next();
  }

  parse(): Node {
    const node = this.expression();
    if (this.peek().type !== 'end') {
      throw new ExpressionError(
        `Unexpected "${this.peek().value}" at position ${this.peek().position}.`,
      );
    }
    return node;
  }

  expression(): Node {
    const node = this.or();
    if (this.isName('if')) {
      this.next();
      const test = this.or();
      if (!this.isName('else')) {
        throw new ExpressionError('Expected "else".');
      }
      this.next();
      return {
        type: 'ternary',
        test,
        then: node,
        otherwise: this.expression(),
      };
    }
    return node;
  }

  or(): Node {
    let node = this.and();
    while (this.isName('or')) {
      this.next();
      node = { type: 'bool', op: 'or', left: node, right: this.and() };
    }
    return node;
  }

  and(): Node {
    let node = this.not();
    while (this.isName('and')) {
      this.next();
      node = { type: 'bool', op: 'and', left: node, right: this.not() };
    }
    return node;
  }

  not(): Node {
    if (this.isName('not')) {
      this.next();
      return { type: 'not', operand: this.not() };
    }
    return this.comparison();
  }

  comparison(): Node {
    const operands = [this.arithmetic()];
    const ops: string[] = [];
    for (;;) {
      const token = this.peek();
      let op: string | undefined;
      if (
        token.type === 'op' &&
        ['==', '!=', '<', '>', '<=', '>='].includes(token.value)
      ) {
        op = token.value;
        this.next();
      } else if (this.isName('in')) {
        op = 'in';
        this.next();
      } else if (this.isName('not') && this.peek(1).value === 'in') {
        op = 'not in';
        this.next();
        this.next();
      } else if (this.isName('is')) {
        this.next();
        op = 'is';
        if (this.isName('not')) {
          this.next();
          op = 'is not';
        }
      }
      if (!op) {
        break;
      }
      ops.push(op);
      operands.push(this.arithmetic());
    }
    return ops.length === 0 ? operands[0] : { type: 'compare', ops, operands };
  }

  arithmetic(): Node {
    let node = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.next().value;
      node = { type: 'binary', op, left: node, right: this.term() };
    }
    return node;
  }

  term(): Node {
    let node = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.next().value;
      node = { type: 'binary', op, left: node, right: this.unary() };
    }
    return node;
  }

  unary(): Node {
    if (this.isOp('-')) {
      this.next();
      return { type: 'neg', operand: this.unary() };
    }
    if (this.isOp('+')) {
      this.next();
      return this.unary();
    }
    return this.postfix();
  }

  postfix(): Node {
    let node = this.atom();
    for (;;) {
      if (this.isOp('.')) {
        this.next();
        const name = this.next();
        if (name.type !== 'name') {
          throw new ExpressionError('Expected an attribute name.');
        }
        node = { type: 'attr', object: node, name: name.value };
      } else if (this.isOp('(')) {
        this.next();
        const args: Node[] = [];
        const kwargs: Record<string, Node> = {};
        while (!this.isOp(')')) {
          if (
            this.peek().type === 'name' &&
            this.peek(1).type === 'op' &&
            this.peek(1).value === '='
          ) {
            const key = this.next().value;
            this.next();
            kwargs[key] = this.expression();
          } else {
            if (this.isOp('*') || this.isOp('**')) {
              throw new ExpressionError('Argument unpacking is not supported.');
            }
            args.push(this.expression());
          }
          if (!this.isOp(')')) {
            this.expect(',');
          }
        }
        this.next();
        node = { type: 'call', callee: node, args, kwargs };
      } else if (this.isOp('[')) {
        this.next();
        if (this.isOp(':') || this.peek(1).value === ':') {
          throw new ExpressionError('Slices are not supported.');
        }
        const index = this.expression();
        this.expect(']');
        node = { type: 'index', object: node, index };
      } else {
        return node;
      }
    }
  }

  atom(): Node {
    const token = this.next();
    if (token.type === 'number' || token.type === 'string') {
      // Adjacent strings are concatenated like in Python
      let value = token.value;
      while (token.type === 'string' && this.peek().type === 'string') {
        value += this.next().value;
      }
      return { type: 'const', value };
    }
    if (token.type === 'name') {
      if (unsupportedKeywords.includes(token.value)) {
        throw new ExpressionError(`"${token.value}" is not supported.`);
      }
      return { type: 'name', name: token.value };
    }
    if (token.type === 'op' && (token.value === '(' || token.value === '[')) {
      const close = token.value === '(' ? ')' : ']';
      const items: Node[] = [];
      let tuple = token.value === '[';
      while (!this.isOp(close)) {
        items.push(this.expression());
        if (this.isName('for')) {
          throw new ExpressionError('Comprehensions are not supported.');
        }
        if (!this.isOp(close)) {
          this.expect(',');
          tuple = true;
        }
      }
      this.next();
      return !tuple && items.length === 1 ? items[0] : { type: 'list', items };
    }
    if (token.type === 'op' && token.value === '{') {
      const entries: [Node, Node][] = [];
      while (!this.isOp('}')) {
        const key = this.expression();
        this.expect(':');
        entries.push([key, this.expression()]);
        if (!this.isOp('}')) {
          this.expect(',');
        }
      }
      this.next();
      return { type: 'dict', entries };
    }
    throw new ExpressionError(
      `Unexpected "${token.value ?? 'end'}" at position ${token.position}.`,
    );
  }
}

// -- TALES parser ---------------------------------------------------------

/**
 * Parse a TALES expression.
 * @method parseTales
 * @param {string} source Expression.
 * @returns {Node} Syntax tree.
 */
function parseTales(source: string): Node {
  const text = source.trim();
  const prefix = /^([a-z]+):/.exec(text);
  const type = prefix ? prefix[1] : 'path';
  const body = prefix ? text.slice(prefix[0].length) : text;
  switch (type) {
    case 'python':
      return new Parser(body).parse();
    case 'not':
      return { type: 'not', operand: parseTales(body) };
    case 'exists':
      return { type: 'exists', path: parsePath(body) };
    case 'string':
      return parseString(body);
    case 'path':
    case 'nocall':
      return parsePath(body);
    default:
      throw new ExpressionError(`Unsupported expression type "${type}:".`);
  }
}

/**
 * Parse a path expression with alternatives (`a/b | c/d | nothing`).
 * @method parsePath
 * @param {string} source Path expression.
 * @returns {Node} Syntax tree.
 */
function parsePath(source: string): Node {
  const parts = source.split('|');
  const alternatives: PathAlternative[] = parts.map((part, index) => {
    const text = part.trim();
    if (/^[a-z]+:/.test(text)) {
      // Only the last alternative may be another type of expression
      if (index !== parts.length - 1) {
        throw new ExpressionError(
          'Only the last alternative may be an expression.',
        );
      }
      return {
        type: 'expression',
        node: parseTales(parts.slice(index).join('|')),
      };
    }
    if (!/^[A-Za-z_@][\w@.\-~]*(\/[\w@.\-~]+)*$/.test(text)) {
      throw new ExpressionError(`Invalid path "${text}".`);
    }
    return { type: 'segments', segments: text.split('/') };
  });
  // An expression alternative swallows the remaining parts
  const last = alternatives.findIndex((item) => item.type === 'expression');
  return {
    type: 'path',
    alternatives: last === -1 ? alternatives : alternatives.slice(0, last + 1),
  };
}

/**
 * Parse a string expression with `${path}` and `$name` interpolation.
 * @method parseString
 * @param {string} source String expression.
 * @returns {Node} Syntax tree.
 */
function parseString(source: string): Node {
  const parts: (string | Node)[] = [];
  const pattern = /\$\$|\$\{([^}]*)\}|\$([A-Za-z_][\w/]*)/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    parts.push(source.slice(last, match.index));
    if (match[0] === '$$') {
      parts.push('$');
    } else {
      parts.push(parsePath(match[1] ?? match[2]));
    }
    last = match.index + match[0].length;
  }
  parts.push(source.slice(last));
  return { type: 'string', parts };
}

// -- Checker --------------------------------------------------------------

/**
 * Check a syntax tree: every name, attribute and method must be known.
 * @method check
 * @param {Node} node Syntax tree.
 * @returns {Kind} Kind of the value of the node.
 */
function check(node: Node): Kind {
  switch (node.type) {
    case 'const':
      return 'any';
    case 'name':
      if (Object.hasOwn(names, node.name)) {
        return names[node.name];
      }
      if (functions.includes(node.name)) {
        return 'function';
      }
      throw new ExpressionError(`Unknown name "${node.name}".`);
    case 'attr':
      return checkAttribute(check(node.object), node.name, false);
    case 'call': {
      Object.values(node.kwargs).map(check);
      node.args.map(check);
      if (node.callee.type === 'name') {
        if (!functions.includes(node.callee.name)) {
          throw new ExpressionError(`"${node.callee.name}" is not a function.`);
        }
        if (node.callee.name === 'getattr' || node.callee.name === 'hasattr') {
          const name = node.args[1];
          if (
            !name ||
            name.type !== 'const' ||
            typeof name.value !== 'string'
          ) {
            throw new ExpressionError(
              `${node.callee.name} needs a literal attribute name.`,
            );
          }
          return checkAttribute(check(node.args[0]), name.value, false);
        }
        return node.callee.name === 'DateTime' ? 'date' : 'any';
      }
      if (node.callee.type === 'attr') {
        return checkMethod(check(node.callee.object), node.callee.name);
      }
      throw new ExpressionError('Only functions and methods can be called.');
    }
    case 'index':
      check(node.object);
      check(node.index);
      return 'any';
    case 'list':
      node.items.map(check);
      return 'any';
    case 'dict':
      node.entries.map(([key, value]) => [check(key), check(value)]);
      return 'any';
    case 'not':
    case 'neg':
      check(node.operand);
      return 'any';
    case 'bool':
    case 'binary':
      check(node.left);
      check(node.right);
      return 'any';
    case 'compare':
      node.operands.map(check);
      return 'any';
    case 'ternary':
      check(node.test);
      check(node.otherwise);
      return check(node.then);
    case 'path':
      return node.alternatives
        .map((alternative) =>
          alternative.type === 'expression'
            ? check(alternative.node)
            : checkSegments(alternative.segments),
        )
        .at(0) as Kind;
    case 'string':
      node.parts.map((part) => typeof part !== 'string' && check(part));
      return 'any';
    case 'exists':
      check(node.path);
      return 'any';
  }
}

/**
 * Check an attribute access.
 * @method checkAttribute
 * @param {Kind} kind Kind of the object.
 * @param {string} name Name of the attribute.
 * @param {boolean} path True when traversed in a path expression.
 * @returns {Kind} Kind of the attribute.
 */
function checkAttribute(kind: Kind, name: string, path: boolean): Kind {
  const info = kinds[kind];
  if (name.startsWith('_')) {
    throw new ExpressionError(`Private attribute "${name}" is not allowed.`);
  }
  if (info && Object.hasOwn(info.attributes, name)) {
    return info.attributes[name];
  }
  // In a path the last segment of a method is called
  if (path && info && Object.hasOwn(info.methods, name)) {
    return info.methods[name];
  }
  if (kind === 'content') {
    if (getExpressionMethod(name)) {
      return 'any';
    }
    if (!path || pathFields.includes(name)) {
      return 'any';
    }
    throw new ExpressionError(
      `"${name}" on content is not a known field or a registered method.`,
    );
  }
  if (kind === 'mapping' || kind === 'request') {
    return 'any';
  }
  throw new ExpressionError(`Unknown attribute "${name}" of ${kind}.`);
}

/**
 * Check a method call.
 * @method checkMethod
 * @param {Kind} kind Kind of the object.
 * @param {string} name Name of the method.
 * @returns {Kind} Kind of the result.
 */
function checkMethod(kind: Kind, name: string): Kind {
  const info = kinds[kind];
  if (info && Object.hasOwn(info.methods, name)) {
    return info.methods[name];
  }
  if (kind === 'content' && getExpressionMethod(name)) {
    return 'any';
  }
  if (kind === 'content') {
    throw new ExpressionError(
      `Method "${name}" of the content object is not registered.`,
    );
  }
  throw new ExpressionError(`Unknown method "${name}" of ${kind}.`);
}

/**
 * Check the segments of a path.
 * @method checkSegments
 * @param {string[]} segments Segments.
 * @returns {Kind} Kind of the value.
 */
function checkSegments(segments: string[]): Kind {
  const [first, ...rest] = segments;
  if (!Object.hasOwn(names, first)) {
    throw new ExpressionError(`Unknown name "${first}".`);
  }
  return rest.reduce(
    (kind: Kind, segment: string) => checkAttribute(kind, segment, true),
    names[first],
  );
}

// -- Evaluation -----------------------------------------------------------

/**
 * Python truth value.
 * @method truthy
 * @param {any} value Value.
 * @returns {boolean} Truth value.
 */
export function truthy(value: any): boolean {
  if (value === null || value === undefined || value === false) {
    return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length > 0;
  }
  if (value instanceof Date) {
    return true;
  }
  if (typeof value === 'object' && !isExpressionObject(value)) {
    return Object.keys(value).length > 0;
  }
  return true;
}

/**
 * Check if a value is an expression object.
 * @method isExpressionObject
 * @param {any} value Value.
 * @returns {boolean} True if the value is an expression object.
 */
function isExpressionObject(value: any): value is ExpressionObject {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.expressionKind === 'string' &&
    typeof value.getAttribute === 'function'
  );
}

/**
 * Python equality.
 * @method equals
 * @param {any} a Value.
 * @param {any} b Value.
 * @returns {boolean} True if equal.
 */
function equals(a: any, b: any): boolean {
  if (a === undefined) a = null;
  if (b === undefined) b = null;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => equals(item, b[i]));
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return Number(a) === Number(b);
  }
  return a === b;
}

/**
 * Python ordering comparison.
 * @method order
 * @param {any} a Value.
 * @param {any} b Value.
 * @returns {number} Negative, zero or positive.
 */
function order(a: any, b: any): number {
  const value = (item: any) => (item instanceof Date ? item.getTime() : item);
  const left = value(a);
  const right = value(b);
  if (
    (typeof left === 'number' || typeof left === 'boolean') &&
    (typeof right === 'number' || typeof right === 'boolean')
  ) {
    return Number(left) - Number(right);
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left < right ? -1 : left > right ? 1 : 0;
  }
  throw new Error(`Can't compare ${typeof left} and ${typeof right}.`);
}

/**
 * Python `in`.
 * @method contains
 * @param {any} container Container.
 * @param {any} item Item.
 * @returns {boolean} True if the container contains the item.
 */
function contains(container: any, item: any): boolean {
  if (typeof container === 'string') {
    return typeof item === 'string' && container.includes(item);
  }
  if (Array.isArray(container)) {
    return container.some((element) => equals(element, item));
  }
  if (container && typeof container === 'object') {
    return Object.hasOwn(container, item);
  }
  return false;
}

/**
 * A missing attribute or a traversal of `None` (Python's AttributeError),
 * alternatives of a path expression and `getattr` with a default catch it.
 * @class TraversalError
 */
export class TraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TraversalError';
  }
}

/**
 * Get an attribute of a value.
 * @method getAttribute
 * @param {any} object Object.
 * @param {string} name Name of the attribute.
 * @returns {Promise<any>} Value.
 */
async function getAttribute(object: any, name: string): Promise<any> {
  if (isExpressionObject(object)) {
    return await object.getAttribute(name);
  }
  if (object && typeof object === 'object' && !Array.isArray(object)) {
    if (Object.hasOwn(object, name)) {
      return object[name];
    }
  }
  throw new TraversalError(`No attribute "${name}".`);
}

/**
 * Call a method of a value.
 * @method callMethod
 * @param {any} object Object.
 * @param {string} name Name of the method.
 * @param {any[]} args Arguments.
 * @returns {Promise<any>} Result.
 */
async function callMethod(
  object: any,
  name: string,
  args: any[],
): Promise<any> {
  if (isExpressionObject(object)) {
    return await object.callMethod(name, args);
  }
  if (typeof object === 'string') {
    switch (name) {
      case 'startswith':
        return object.startsWith(args[0]);
      case 'endswith':
        return object.endsWith(args[0]);
      case 'lower':
        return object.toLowerCase();
      case 'upper':
        return object.toUpperCase();
      case 'strip':
        return object.trim();
      case 'split':
        return args[0] === undefined
          ? object.trim().split(/\s+/)
          : object.split(args[0]);
      case 'count':
        return object.split(args[0]).length - 1;
      case 'join':
        return (args[0] || []).join(object);
    }
  }
  if (Array.isArray(object)) {
    switch (name) {
      case 'count':
        return object.filter((item) => equals(item, args[0])).length;
      case 'index': {
        const index = object.findIndex((item) => equals(item, args[0]));
        if (index === -1) throw new Error('Not in list.');
        return index;
      }
    }
  }
  if (object instanceof Date) {
    switch (name) {
      case 'isPast':
        return object.getTime() < Date.now();
      case 'isFuture':
        return object.getTime() > Date.now();
      case 'ISO8601':
      case 'ISO':
        return object.toISOString();
      case 'timeTime':
        return object.getTime() / 1000;
    }
  }
  if (object && typeof object === 'object' && !Array.isArray(object)) {
    switch (name) {
      case 'get':
        return Object.hasOwn(object, args[0])
          ? object[args[0]]
          : (args[1] ?? null);
      case 'has_key':
        return Object.hasOwn(object, args[0]);
      case 'keys':
        return Object.keys(object);
      case 'values':
        return Object.values(object);
      case 'items':
        return Object.entries(object);
    }
  }
  throw new Error(`Unsupported method "${name}".`);
}

/**
 * Evaluation scope of an expression.
 */
export interface ExpressionScope {
  [name: string]: any;
}

/**
 * Evaluate a syntax tree.
 * @method evaluate
 * @param {Node} node Syntax tree.
 * @param {ExpressionScope} scope Names.
 * @returns {Promise<any>} Value.
 */
async function evaluate(node: Node, scope: ExpressionScope): Promise<any> {
  switch (node.type) {
    case 'const':
      return node.value;
    case 'name':
      if (node.name === 'None' || node.name === 'nothing') return null;
      if (node.name === 'True') return true;
      if (node.name === 'False') return false;
      if (!Object.hasOwn(scope, node.name)) {
        throw new TraversalError(`Name "${node.name}" is not available.`);
      }
      return scope[node.name];
    case 'attr':
      return await getAttribute(await evaluate(node.object, scope), node.name);
    case 'call': {
      const args = [];
      for (const arg of node.args) {
        args.push(await evaluate(arg, scope));
      }
      const kwargs: Record<string, any> = {};
      for (const key of Object.keys(node.kwargs)) {
        kwargs[key] = await evaluate(node.kwargs[key], scope);
      }
      if (node.callee.type === 'name') {
        return await callFunction(
          node.callee.name,
          node.args,
          args,
          kwargs,
          scope,
        );
      }
      const callee = node.callee as { object: Node; name: string };
      return await callMethod(
        await evaluate(callee.object, scope),
        callee.name,
        [...args, ...Object.values(kwargs)],
      );
    }
    case 'index': {
      const object = await evaluate(node.object, scope);
      const index = await evaluate(node.index, scope);
      if (Array.isArray(object) || typeof object === 'string') {
        const value = object[index < 0 ? object.length + index : index];
        if (value === undefined) throw new Error('Index out of range.');
        return value;
      }
      if (
        object &&
        typeof object === 'object' &&
        Object.hasOwn(object, index)
      ) {
        return object[index];
      }
      throw new Error(`Key ${index} not found.`);
    }
    case 'list': {
      const items = [];
      for (const item of node.items) {
        items.push(await evaluate(item, scope));
      }
      return items;
    }
    case 'dict': {
      const result: Record<string, any> = {};
      for (const [key, value] of node.entries) {
        result[String(await evaluate(key, scope))] = await evaluate(
          value,
          scope,
        );
      }
      return result;
    }
    case 'not':
      return !truthy(await evaluate(node.operand, scope));
    case 'neg':
      return -(await evaluate(node.operand, scope));
    case 'bool': {
      const left = await evaluate(node.left, scope);
      if (node.op === 'and') {
        return truthy(left) ? await evaluate(node.right, scope) : left;
      }
      return truthy(left) ? left : await evaluate(node.right, scope);
    }
    case 'binary': {
      const left = await evaluate(node.left, scope);
      const right = await evaluate(node.right, scope);
      switch (node.op) {
        case '+':
          if (Array.isArray(left) && Array.isArray(right))
            return [...left, ...right];
          if (typeof left !== typeof right)
            throw new Error('Unsupported operand types for +.');
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
      }
      throw new Error(`Unsupported operator ${node.op}.`);
    }
    case 'compare': {
      let left = await evaluate(node.operands[0], scope);
      for (let i = 0; i < node.ops.length; i++) {
        const right = await evaluate(node.operands[i + 1], scope);
        let result: boolean;
        switch (node.ops[i]) {
          case '==':
            result = equals(left, right);
            break;
          case '!=':
            result = !equals(left, right);
            break;
          case '<':
            result = order(left, right) < 0;
            break;
          case '>':
            result = order(left, right) > 0;
            break;
          case '<=':
            result = order(left, right) <= 0;
            break;
          case '>=':
            result = order(left, right) >= 0;
            break;
          case 'in':
            result = contains(right, left);
            break;
          case 'not in':
            result = !contains(right, left);
            break;
          case 'is':
            result = left === right || (left == null && right == null);
            break;
          default:
            result = !(left === right || (left == null && right == null));
        }
        if (!result) {
          return false;
        }
        left = right;
      }
      return true;
    }
    case 'ternary':
      return truthy(await evaluate(node.test, scope))
        ? await evaluate(node.then, scope)
        : await evaluate(node.otherwise, scope);
    case 'path': {
      for (let i = 0; i < node.alternatives.length; i++) {
        const alternative = node.alternatives[i];
        try {
          if (alternative.type === 'expression') {
            return await evaluate(alternative.node, scope);
          }
          return await traverse(alternative.segments, scope);
        } catch (err) {
          if (
            !(err instanceof TraversalError) ||
            i === node.alternatives.length - 1
          ) {
            throw err;
          }
        }
      }
      return null;
    }
    case 'string': {
      let value = '';
      for (const part of node.parts) {
        if (typeof part === 'string') {
          value += part;
        } else {
          const result = await evaluate(part, scope);
          value +=
            result === null || result === undefined ? '' : String(result);
        }
      }
      return value;
    }
    case 'exists':
      try {
        await evaluate(node.path, scope);
        return true;
      } catch (err) {
        if (err instanceof TraversalError) {
          return false;
        }
        throw err;
      }
  }
}

/**
 * Traverse a path. Methods in a path are called without arguments.
 * @method traverse
 * @param {string[]} segments Segments.
 * @param {ExpressionScope} scope Names.
 * @returns {Promise<any>} Value.
 */
async function traverse(
  segments: string[],
  scope: ExpressionScope,
): Promise<any> {
  const [first, ...rest] = segments;
  let value = await evaluate({ type: 'name', name: first }, scope);
  for (const segment of rest) {
    if (value === null || value === undefined) {
      throw new TraversalError(`Can't traverse "${segment}" of None.`);
    }
    const kind = isExpressionObject(value) ? value.expressionKind : undefined;
    const info = kind ? kinds[kind] : undefined;
    if (
      info &&
      Object.hasOwn(info.methods, segment) &&
      !Object.hasOwn(info.attributes, segment)
    ) {
      value = await callMethod(value, segment, []);
    } else if (kind === 'content' && getExpressionMethod(segment)) {
      value = await callMethod(value, segment, []);
    } else {
      value = await getAttribute(value, segment);
    }
  }
  return value;
}

/**
 * Call a function.
 * @method callFunction
 * @param {string} name Name of the function.
 * @param {Node[]} nodes Argument nodes.
 * @param {any[]} args Arguments.
 * @param {Object} kwargs Keyword arguments.
 * @param {ExpressionScope} scope Names.
 * @returns {Promise<any>} Result.
 */
async function callFunction(
  name: string,
  nodes: Node[],
  args: any[],
  kwargs: Record<string, any>,
  scope: ExpressionScope,
): Promise<any> {
  switch (name) {
    case 'checkPermission':
      return await callMethod(scope.user, 'checkPermission', [
        args[0],
        args[1] ?? scope.here,
      ]);
    case 'getattr':
      try {
        return await getAttribute(args[0], args[1]);
      } catch (err) {
        if (err instanceof TraversalError && args.length > 2) {
          return args[2];
        }
        throw err;
      }
    case 'hasattr':
      try {
        await getAttribute(args[0], args[1]);
        return true;
      } catch (err) {
        if (err instanceof TraversalError) {
          return false;
        }
        throw err;
      }
    case 'len':
      if (typeof args[0] === 'string' || Array.isArray(args[0])) {
        return args[0].length;
      }
      if (args[0] && typeof args[0] === 'object') {
        return Object.keys(args[0]).length;
      }
      throw new Error('Object has no len().');
    case 'str':
      return args[0] === null || args[0] === undefined
        ? 'None'
        : String(args[0]);
    case 'int':
      return Math.trunc(Number(args[0]));
    case 'float':
      return Number(args[0]);
    case 'bool':
      return truthy(args[0]);
    case 'test':
      for (let i = 0; i + 1 < args.length; i += 2) {
        if (truthy(args[i])) return args[i + 1];
      }
      return args.length % 2 === 1 ? args[args.length - 1] : null;
    case 'same_type':
      return typeof args[0] === typeof args[1];
    case 'DateTime':
      return args.length === 0 ? new Date() : new Date(args[0]);
    case 'list':
    case 'tuple':
      return Array.isArray(args[0])
        ? [...args[0]]
        : typeof args[0] === 'string'
          ? args[0].split('')
          : Object.keys(args[0] || {});
    case 'min':
      return (args.length === 1 ? args[0] : args).reduce((a: any, b: any) =>
        order(a, b) <= 0 ? a : b,
      );
    case 'max':
      return (args.length === 1 ? args[0] : args).reduce((a: any, b: any) =>
        order(a, b) >= 0 ? a : b,
      );
  }
  void nodes;
  void kwargs;
  throw new Error(`Unknown function "${name}".`);
}

// -- Public API -----------------------------------------------------------

/**
 * A compiled expression.
 */
export interface CompiledExpression {
  source: string;
  evaluate(scope: ExpressionScope): Promise<any>;
}

// Compiled expressions by source
const cache: Map<string, CompiledExpression> = new Map();

/**
 * Compile and check an expression. Throws an ExpressionError when the
 * expression is invalid or uses something that is not supported.
 * @method compileExpression
 * @param {string} source Expression.
 * @returns {CompiledExpression} Compiled expression.
 */
export function compileExpression(source: string): CompiledExpression {
  const cached = cache.get(source);
  if (cached) {
    return cached;
  }
  const node = parseTales(source);
  check(node);
  const compiled = {
    source,
    evaluate: (scope: ExpressionScope) => evaluate(node, scope),
  };
  cache.set(source, compiled);
  return compiled;
}

/**
 * Get the reason why an expression is not supported.
 * @method checkExpression
 * @param {string} source Expression.
 * @returns {string | undefined} Reason, undefined if supported.
 */
export function checkExpression(source: string): string | undefined {
  try {
    compileExpression(source);
    return undefined;
  } catch (err: any) {
    if (err instanceof ExpressionError) {
      return err.message;
    }
    throw err;
  }
}

/**
 * Evaluate an expression.
 * @method evaluateExpression
 * @param {string} source Expression.
 * @param {ExpressionScope} scope Names.
 * @returns {Promise<any>} Value.
 */
export async function evaluateExpression(
  source: string,
  scope: ExpressionScope,
): Promise<any> {
  return await compileExpression(source).evaluate(scope);
}
