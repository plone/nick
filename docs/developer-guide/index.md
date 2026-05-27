---
title: Developer guide
nav_order: 4
permalink: /developer-guide
---

# Developer guide

This developer guide describes how to setup a project with Nick and how you can customize your project. It also provides information on how to set up an environment if you want to develop the core of Nick.

## Project

To setup a project with Nick as a dependency use the [installation guide](/admin-guide/installation)

## Customization

Nick uses a modular architecture, allowing you to customize and extend its functionality. This is done by using profiles. Each Nick project can have multiple profiles active which add or change functionality. The above installation steps create one for you in `src/profiles/default` but you can create as many as you like.

The profiles are registered in the `config.ts` file and are applied in order:

```ts
export const config = {
  ...
  profiles: [
    '@robgietema/nick:core',
    'my_nick_project:default',
  ],
  ...
};
```

The name before the colon will resolve to the node package name and the part after the colon is the folder name of the profile.

The profile folder contains `json`-files which make changes to the database. It can also contain an `index.ts` file which is used to register runtime functionality. The sub sections of this page have examples of all the customization which can be added to Nick.

## Develop core

To develop the core of Nick use the following steps to get your environment up and running.

### Prerequisites

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

### Create Database

```sql
CREATE DATABASE "nick";
CREATE USER "nick" WITH ENCRYPTED PASSWORD 'nick';
GRANT ALL PRIVILEGES ON DATABASE "nick" TO "nick";
ALTER DATABASE "nick" OWNER TO "nick";
```

## Get the code

```shell
$ git clone git@github.com:robgietema/nick.git
$ cd nick
```

## Bootstrap Project

```shell
$ pnpm install
$ pnpm bootstrap
```

## Run backend

```shell
$ pnpm start
```

## Testing

```shell
$ pnpm test
```
