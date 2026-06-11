/**
 * I18n helper.
 * @module helpers/i18n/i18n
 */

// External imports
import { createIntl, createIntlCache, IntlShape } from '@formatjs/intl';
import { remove, zipObject } from 'es-toolkit/array';
import { isObject, mapKeys } from 'es-toolkit/compat';
import { mapValues } from 'es-toolkit/object';
import fs from 'fs';

// Internal imports
import config from '../../helpers/config/config';

/**
 * Node of an object
 * @typedef {*} Node
 */
type Node = any;

// I18n cache and languages
export let intl: Record<string, IntlShape> = {};
export let languages: string[] = [];

/**
 * Initialize i18n.
 * @method initI18n
 */
export function initI18n(): void {
  // Get available language files
  languages = remove(fs.readdirSync(`${config.settings.localesDir}`), (value) =>
    value.endsWith('.json'),
  ).map((value) => value.replace(/.json/, ''));

  // Create i18n cache
  const intlCache = zipObject(
    languages,
    languages.map(() => createIntlCache()),
  ) as Record<string, any>;

  // Load i18n files
  intl = zipObject(
    languages,
    languages.map((language) => {
      const locale = language.replace('_', '-');
      const supportedLocale =
        Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : 'en';
      return createIntl(
        {
          locale: supportedLocale,
          messages: JSON.parse(
            fs.readFileSync(
              `${config.settings.localesDir}/${language}.json`,
              'utf8',
            ),
          ),
        },
        intlCache[language],
      );
    }),
  ) as Record<string, IntlShape>;
}

/**
 * Strip i18n
 * @method stripI18n
 * @param {Node} node Node to be stripped
 * @returns {Node} Node stripped of i18n data
 */
export function stripI18n(node: Node): Node {
  if (Array.isArray(node)) {
    return node.map((child) => stripI18n(child));
  } else if (isObject(node)) {
    return mapValues(
      mapKeys(node, (_value, key) => key.replace(/:i18n$/, '')),
      (value) => stripI18n(value),
    );
  } else {
    return node;
  }
}
