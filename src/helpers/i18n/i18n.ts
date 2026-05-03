/**
 * File system helper.
 * @module helpers/fs/fs
 */

// External imports
import { isObject, mapKeys } from 'es-toolkit/compat';
import { mapValues } from 'es-toolkit/object';

/**
 * Node of an object
 * @typedef {*} Node
 */
export type Node = any;

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
