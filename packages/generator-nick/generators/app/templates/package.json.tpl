{
  "name": "<%= projectName %>",
  "description": "",
  "type": "module",
  "license": "MIT",
  "version": "0.0.1",
  "private": true,
  "workspaces": [
    "src/develop/nick"
  ],
  "keywords": [
    "cms"
  ],
  "scripts": {
    "develop": "missdev --config=jsconfig.json --fetch-https",
    "develop:npx": "npx -p mrs-developer missdev --config=jsconfig.json --fetch-https",
    "bootstrap": "pnpm preinstall && pnpm install && pnpm migrate && pnpm seed",
    "convert": "tsx scripts/convert.ts",
    "i18n": "tsx src/develop/nick/scripts/i18n.ts",
    "i18n:ci": "pnpm i18n && git diff -G'^[^\"POT]' --exit-code",
    "knex": "tsx ./node_modules/knex/bin/cli.js",
    "lint": "./node_modules/eslint/bin/eslint.js --max-warnings=0 'src/**/*.{js,jsx,json}'",
    "migrate": "pnpm knex migrate:latest",
    "prettier": "./node_modules/.bin/prettier --single-quote --check 'src/**/*.{js,jsx,ts,tsx,json}'",
    "seed": "tsx src/develop/nick/scripts/seed.ts run",
    "seed:status": "tsx src/develop/nick/scripts/seed.ts status",
    "seed:upgrade": "tsx src/develop/nick/scripts/seed.ts upgrade",
    "start": "nodemon --exec 'tsx src/develop/nick/src/server.ts'",
    "rollback": "pnpm knex migrate:rollback --all",
    "reset": "pnpm rollback && pnpm migrate && pnpm seed",
    "test": "AUTH_RATE_LIMIT=1000 jest --passWithNoTests",
    "preinstall": "if [ -f $(pwd)/node_modules/.bin/missdev ]; then pnpm develop; else pnpm develop:npx; fi"
  },
  "engines": {
    "node": "^22 || ^24 || ^25 || ^26"
  },
  "devDependencies": {
    "@babel/core": "7.29.0",
    "@babel/plugin-transform-typescript": "7.28.6",
    "@eslint/eslintrc": "3.3.3",
    "@eslint/js": "10.0.1",
    "@types/express": "5.0.6",
    "@types/jsonwebtoken": "9.0.10",
    "@types/mime-types": "3.0.1",
    "@types/node": "25.3.0",
    "@types/nodemailer": "7.0.11",
    "@types/pdf-parse": "1.1.5",
    "@types/supertest": "6.0.3",
    "@vitest/ui": "4.0.18",
    "eslint": "10.0.1",
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-json": "4.0.1",
    "eslint-plugin-prettier": "5.5.5",
    "glob": "13.0.6",
    "pofile": "1.1.4",
    "prettier": "3.8.1",
    "supertest": "7.2.2",
    "typescript": "5.9.3",
    "vitest": "4.0.18"
  },
  "dependencies": {
    "@robgietema/nick": "workspace:^",
    "knex": "3.1.0",
    "nodemon": "3.1.14",
    "tsx": "4.21.0"
  }
}
