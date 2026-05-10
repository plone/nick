/* eslint no-console: 0 */
/**
 * i18n script.
 * @module scripts/i18n
 */

// Types imports
import type { PluginObject } from '@babel/core';

// External imports
import { transformSync } from '@babel/core';
import { uniq, zipObject } from 'es-toolkit/array';
import { upperFirst } from 'es-toolkit/string';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { sync as glob } from 'glob';
import Pofile from 'pofile';

/**
 * Convert path to context
 * @function pathToContext
 * @param {string} path Path of the file
 * @return {string} Context string
 */
function pathToContext(path: string) {
  return uniq(
    path
      .replace('src/', '')
      .replace('.json', '')
      .replace('.js', '')
      .replace('.ts', '')
      .replace(/:.*$/, '')
      .split(/\//)
      .map((part) => upperFirst(part.replace(/_/gi, ' '))),
  ).join('|');
}

/**
 * Convert messages to pot format
 * @function messagesToPot
 * @param {Object} messages Messages
 * @return {string} Formatted pot string
 */
function messagesToPot(messages: any) {
  return Object.keys(messages)
    .sort()
    .map((key) =>
      [
        `#. Default: "${messages[key].defaultMessage}"`,
        ...messages[key].files.map(
          (file: any) => `#: ${file.file}:${file.line}`,
        ),
        `msgctxt "${pathToContext(messages[key].files[0].file)}"`,
        `msgid "${key}"`,
        'msgstr ""',
      ].join('\n'),
    )
    .join('\n\n');
}

/**
 * Pot header
 * @function potHeader
 * @return {string} Formatted pot header
 */
function potHeader() {
  return `msgid ""
msgstr ""
"Project-Id-Version: Nick\\n"
"POT-Creation-Date: ${new Date().toISOString()}\\n"
"Last-Translator: Rob Gietema\\n"
"Language-Team: Nick\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=1; plural=0;\\n"
"Language-Code: en\\n"
"Language-Name: English\\n"
"Preferred-Encodings: utf-8\\n"
"Domain: nick\\n"

`;
}

/**
 * Convert po files into json
 * @function poToJson
 * @return {undefined}
 */
function poToJson() {
  glob('locales/**/*.po').map((filename: string) => {
    const { items } = Pofile.parse(readFileSync(filename, 'utf8'));
    const matchLang = filename.match(/locales\/(.*)\/LC_MESSAGES\//);
    const lang = matchLang ? matchLang[1] : 'en';

    // Write the corresponding language JSON, cover the special EN use case for including
    // defaults if not present
    writeFileSync(
      `locales/${lang}.json`,
      JSON.stringify(
        zipObject(
          items.map((item) => item.msgid),
          items.map((item) =>
            lang === 'en'
              ? item.msgstr[0] ||
                (item.extractedComments[0]
                  ? item.extractedComments[0]
                      .replace('Default: ', '')
                      .replaceAll('"', '')
                  : '')
              : item.msgstr[0],
          ),
        ),
      ),
    );
  });
}

/**
 * Format header
 * @function formatHeader
 * @param {string[]} comments Array of comments
 * @param {Object} headers Object of header items
 * @return {string} Formatted header
 */
function formatHeader(comments: string[], headers: any) {
  return [
    ...comments.map((comment) => `# ${comment}`),
    'msgid ""',
    'msgstr ""',
    ...Object.keys(headers).map((key) => `"${key}: ${headers[key]}\\n"`),
    '',
  ].join('\n');
}

/**
 * Sync po by the pot file
 * @function syncPoByPot
 * @param {Object} translations Translations object
 * @return {undefined}
 */
function syncPoByPot(translations: any) {
  const pot = Pofile.parse(readFileSync('locales/nick.pot', 'utf8'));

  glob('locales/**/*.po').map((filename) => {
    const po = Pofile.parse(readFileSync(filename, 'utf8'));

    const lang = po.headers['Language-Code'] || 'en';

    writeFileSync(
      filename,
      `${formatHeader(po.comments, po.headers)}
${pot.items
  .map((item) => {
    const poItem = po.items.find((subitem) => subitem.msgid === item.msgid);
    return [
      ...item.extractedComments.map((comment) => `#. ${comment}`),
      `${item.references.map((ref) => `#: ${ref}`).join('\n')}`,
      `msgctxt "${pathToContext(item.references[0])}"`,
      `msgid "${item.msgid}"`,
      `msgstr "${lang === 'en' ? '' : translations[item.msgid]?.[lang] || poItem?.msgstr || ''}"`,
    ].join('\n');
  })
  .join('\n\n')}\n`,
    );
  });
}

function extractMessages() {
  const messages = {} as any;

  const plugin = (file: string): PluginObject => ({
    visitor: {
      CallExpression(path: any) {
        const callee = path.node.callee;
        let name = callee.type === 'Identifier' ? callee.name : '';
        name = callee.type === 'MemberExpression' ? callee.property.name : name;

        if (
          name === 'i18n' &&
          path.node.arguments[0].type === 'StringLiteral'
        ) {
          const id = path.node.arguments[0].value;
          const defaultMessage =
            path.node.arguments.length > 1 ? path.node.arguments[0].value : id;
          messages[id] = {
            id,
            defaultMessage,
            files: [
              ...(id in messages ? messages[id].files : []),
              { line: path.node.loc.start.line, file },
            ],
          };
        }
      },
      ObjectProperty(path: any) {
        if (path.node.key.value && path.node.key.value.endsWith(':i18n')) {
          const id = path.node.value.value;
          messages[id] = {
            id,
            defaultMessage: id,
            files: [
              ...(id in messages ? messages[id].files : []),
              { line: path.node.loc.start.line, file },
            ],
          };
          // path.node.key.value = path.node.key.value.replace(':i18n', '');
        }
      },
    },
  });

  // Read js files
  glob('src/**/*.ts').map((file) => {
    transformSync(readFileSync(file).toString(), {
      plugins: ['@babel/plugin-transform-typescript', () => plugin(file)],
    });
  });

  // Read json files
  glob('src/**/*.json').map((file) => {
    transformSync(`export default ${readFileSync(file)}`, {
      plugins: [() => plugin(file)],
    });
  });

  return messages;
}

/**
 * Main function
 * @function main
 * @return {undefined}
 */
async function main() {
  console.log('Extracting messages from source files...');

  const messages = extractMessages();

  console.log('Synchronizing messages to pot file...');

  const newPot = `${potHeader()}${messagesToPot(messages)}\n`.replace(
    /"POT-Creation-Date:(.*)\\n"/,
    '',
  );
  const oldPot = readFileSync('locales/nick.pot', 'utf8').replace(
    /"POT-Creation-Date:(.*)\\n"/,
    '',
  );

  // We only write the pot file if it's really different
  if (newPot !== oldPot) {
    writeFileSync(
      'locales/nick.pot',
      `${potHeader()}${messagesToPot(messages)}\n`,
    );
  }

  const translations = {} as any;

  // Check if translations exists
  if (existsSync('locales/translations.json')) {
    // Read translations
    const json = JSON.parse(readFileSync('locales/translations.json', 'utf8'));

    // Create po files for each language if not exists
    const languages = Object.keys(json[0].translations);
    languages.map((lang) => {
      if (!existsSync(`locales/${lang}/LC_MESSAGES/nick.po`)) {
        mkdirSync(`locales/${lang}/LC_MESSAGES`, { recursive: true });
        writeFileSync(
          `locales/${lang}/LC_MESSAGES/nick.po`,
          `msgid ""
msgstr ""
"Project-Id-Version: Nick\\n"
"POT-Creation-Date: ${new Date().toISOString()}\\n"
"Last-Translator: Rob Gietema\\n"
"Language-Team: Nick\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=1; plural=0;\\n"
"Language-Code: ${lang}\\n"
"Language-Name: ${lang}\\n"
"Preferred-Encodings: utf-8\\n"
"Domain: nick\\n"

`,
        );
      }
    });

    // Create translations object
    json.map((item: any) => {
      translations[item.msgid] = item.translations;
    });
  }

  console.log('Synchronizing messages to po files...');

  syncPoByPot(translations);

  console.log('Write messages to json files...');

  poToJson();

  console.log('done!');
}

main();
