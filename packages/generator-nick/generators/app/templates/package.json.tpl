{
  "name": "<%= projectName %>",
  "description": "",
  "type": "module",
  "license": "MIT",
  "version": "0.0.1",
  "private": true,
  "keywords": [
    "cms"
  ],
  "nick": {
    "migrations": "src/migrations"
  },
  "scripts": {
    "bootstrap": "pnpm install && pnpm migrate",
    "i18n": "tsx node_modules/@plone/nick/scripts/i18n.ts",
    "i18n:ci": "pnpm i18n && git diff -G'^[^\"POT]' --exit-code",
    "lint": "./node_modules/eslint/bin/eslint.js --max-warnings=0 'src/**/*.{js,ts,json}'",
    "migrate": "nick --modules=migrate",
    "migrate:check": "tsx node_modules/@plone/nick/scripts/migrate-check.ts",
    "nick": "nick",
    "prettier": "./node_modules/.bin/prettier --single-quote --check 'src/**/*.{js,ts,json}'",
    "seed:status": "tsx node_modules/@plone/nick/scripts/seed.ts status",
    "start": "nodemon --watch src --watch config.ts --ext ts,json --exec 'nick'",
    "test": "AUTH_RATE_LIMIT=1000 vitest --passWithNoTests",
    "typecheck": "tsc --noEmit"
  },
  "engines": {
    "node": "^22 || ^24 || ^25 || ^26"
  },
  "devDependencies": {
    "@eslint/eslintrc": "3.3.6",
    "@eslint/js": "10.0.1",
    "@types/express": "5.0.6",
    "@types/jsonwebtoken": "9.0.10",
    "@types/node": "26.2.0",
    "eslint": "10.8.1",
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-prettier": "5.5.6",
    "jiti": "2.7.0",
    "nodemon": "3.1.14",
    "prettier": "3.9.6",
    "supertest": "7.2.2",
    "typescript": "6.0.3",
    "typescript-eslint": "8.66.0",
    "vitest": "5.0.0-beta.6"
  },
  "dependencies": {
    "@plone/nick": "^3.1.0",
    "tsx": "4.23.12"
  }
}
