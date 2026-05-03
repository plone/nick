/**
 * Eslint Config
 * @module eslint.config
 */

// External imports
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import json from 'eslint-plugin-json';
import prettier from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['src/develop/', 'node_modules/'],
  },
  ...compat.extends('prettier'),
  {
    plugins: {
      json,
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        parser: '@babel/eslint-parser',
      },
    },
  },
];
