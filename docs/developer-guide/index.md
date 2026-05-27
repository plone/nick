---
title: Developer guide
nav_order: 4
permalink: /developer-guide
---

# Developer guide

To develop the core of Nick use the following steps to get started.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

## Create Database

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
