---
layout: default
nav_exclude: true
---

# Nick: Nearly Headless CMS

## What is Nick?

[Nick](https://nick.docs.plone.org) is a (nearly) headless CMS built with Node.js that provides a RESTful hypermedia API. It is created by **Rob Gietema**, the original creator of Volto (the React frontend for Plone). The API is compatible with the [REST API](https://plonerestapi.readthedocs.io/en/latest/) of the [Plone CMS](http://plone.org) and can be used together with the web frontend [Volto](https://voltocms.com/).

### The Name

The name "Nick" comes from **"Nearly Headless Nick"** — a ghost character in the Harry Potter series. Sir Nicholas de Mimsy-Porpington was improperly beheaded (his head is still attached by a thin strip), so he's _nearly_ headless but not quite.

The joke: Traditional CMSs have a "head" (the frontend that renders pages). "Headless" CMSs remove the frontend entirely, providing only an API. Nick is _nearly_ headless — it provides the full backend structure of a CMS (content hierarchy, workflows, permissions, versioning) but without the template-driven frontend of traditional CMSs like WordPress or Plone Classic. You bring your own "head" (frontend) — typically Volto, but any application that speaks the API works.

**Demo:** [nick.demo.plone.org](https://nick.demo.plone.org)  
**Documentation:** [nick.docs.plone.org](https://nick.docs.plone.org)
**Source Code:** [github.com/plone/nick](https://github.com/plone/nick)  
**Issue tracker:** [github.com/plone/nick/issues](https://github.com/plone/nick/issues).
**License:** MIT

---

## The Origin Story

### The Key People

| Person               | Contribution                                                 |
| -------------------- | ------------------------------------------------------------ |
| **Timo Stollenwerk** | Created plone.restapi — the REST API specification for Plone |
| **Rob Gietema**      | Created Volto (React frontend) and Nick (Node.js backend)    |

Both Timo and Rob have worked together at [kitconcept GmbH](https://kitconcept.com), a Plone development company. This collaboration means the API and frontend were designed together with deep mutual understanding.

### The Community

While Timo and Rob were the original creators, **plone.restapi and Volto are open source projects shaped by hundreds of contributors**. Since their creation, countless hours from community members, corporate users, and Plone Foundation members have been poured into these tools — fixing bugs, adding features, improving documentation, and battle-testing them in production environments worldwide.

This matters for Nick: the API specification that Nick implements isn't just one person's design. It's been refined through years of real-world use, community feedback, and collaborative development. When Nick implements the plone.restapi contract, it benefits from all that collective wisdom.

### Why Nick Exists

Rob built Volto as the modern frontend for Plone. In doing so, he gained intimate knowledge of the plone.restapi contract. Nick is him reimplementing that same API in Node.js — proving that the _conceptual model_ of Plone is sound, even if the accumulated complexity of 20+ years weighs it down.

Rob's claim: Nick has everything Plone has, in roughly **10,000 lines of code** versus Plone's **1,000,000+ lines**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       plone.restapi                             │
│      (Created by Timo Stollenwerk, refined by the community)    │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                     │
    ┌──────▼──────┐                       ┌──────▼──────┐
    │  BACKENDS   │                       │  FRONTENDS  │
    │             │                       │             │
    │ Plone       │                       │ Volto       │
    │ (Python)    │◄────── same ─────────►│ (React)     │
    │             │        API            │             │
    │ Nick        │                       │ Custom apps │
    │ (Node.js)   │                       │ Mobile apps │
    └─────────────┘                       └─────────────┘
```

Nick and Plone both implement the same API specification. Any frontend designed for plone.restapi works with either backend.

---

## Nick vs Plone: Technical Comparison

### Stack

| Aspect                | Nick                      | Plone                      |
| --------------------- | ------------------------- | -------------------------- |
| **Backend Language**  | JavaScript (Node.js)      | Python                     |
| **Frontend Language** | JavaScript (Volto)        | JavaScript (Volto)         |
| **Full Stack**        | **JavaScript everywhere** | **Python + JavaScript**    |
| **Runtime**           | Node.js (async)           | Zope (sync/async mix)      |
| **Database**          | PostgreSQL                | ZODB (+ RelStorage option) |
| **Indexing**          | PostgreSQL                | ZCatalog                   |
| **File Storage**      | Blobstorage               | Blobstorage                |
| **Configuration**     | JS config file            | ZCML + GenericSetup        |
| **Profiles**          | JS profiles               | GenericSetup XML           |
| **Package Manager**   | pnpm                      | pip/buildout/pipx          |

### Codebase Size

| Metric            | Nick    | Plone        |
| ----------------- | ------- | ------------ |
| **Lines of Code** | ~10,000 | ~1,000,000+  |
| **Ratio**         | 1       | ~100x larger |

### Why Plone is Large

- 20+ years of backward compatibility layers
- Zope stack underneath (ZODB, ZCA, ZCML, acquisition)
- Legacy systems still present (Archetypes alongside Dexterity)
- Custom implementations of things PostgreSQL provides for free
- Accumulated edge cases, bug fixes, security patches

### Why Nick is Lean

- Clean slate — no backward compatibility burden
- PostgreSQL handles indexing, search, transactions, JSON storage
- Single way to do things — no legacy patterns
- Modern Node.js — async/await, clean module system
- Focused scope — the REST API and content model only

---

## API Compatibility

The API endpoints match closely:

| Endpoint                        | Nick | Plone |
| ------------------------------- | ---- | ----- |
| `@actions`                      | ✓    | ✓     |
| `@breadcrumbs`                  | ✓    | ✓     |
| `@navigation`                   | ✓    | ✓     |
| `@navroot`                      | ✓    | ✓     |
| `@search`                       | ✓    | ✓     |
| `@types`                        | ✓    | ✓     |
| `@workflow`                     | ✓    | ✓     |
| `@history`                      | ✓    | ✓     |
| `@sharing`                      | ✓    | ✓     |
| `@translations`                 | ✓    | ✓     |
| `@users` / `@groups` / `@roles` | ✓    | ✓     |
| `@controlpanels`                | ✓    | ✓     |
| `@vocabularies`                 | ✓    | ✓     |
| `@locking`                      | ✓    | ✓     |
| `@querystring`                  | ✓    | ✓     |

JSON response structures are nearly identical — same `@id`, `@type`, `@components`, `blocks`, `blocks_layout` patterns.

---

## Content Model Comparison

| Feature                   | Nick                 | Plone         |
| ------------------------- | -------------------- | ------------- |
| Hierarchical content tree | ✓                    | ✓             |
| JSON Schema for types     | ✓                    | ✓             |
| Behaviors                 | ✓                    | ✓             |
| Folderish content         | ✓                    | ✓             |
| UID-based references      | ✓                    | ✓             |
| Blocks (Volto)            | ✓                    | ✓             |
| TTW type creation         | ✓                    | ✓             |

---

## Security Model Comparison

| Feature                           | Nick | Plone |
| --------------------------------- | ---- | ----- |
| Users / Groups                    | ✓    | ✓     |
| Roles (global + local)            | ✓    | ✓     |
| Permission inheritance            | ✓    | ✓     |
| Sharing (local roles)             | ✓    | ✓     |
| Workflows with states/transitions | ✓    | ✓     |
| JWT authentication                | ✓    | ✓     |

Same role model: Anonymous, Authenticated, Owner, Reader, Contributor, Editor, Reviewer, Administrator.

---

## Multilingual Support

| Feature                       | Nick              | Plone                      |
| ----------------------------- | ----------------- | -------------------------- |
| Language roots (`/en`, `/nl`) | ✓                 | ✓                          |
| `@translations` endpoint      | ✓                 | ✓                          |
| Link/unlink translations      | ✓                 | ✓                          |
| Navigation root per language  | ✓                 | ✓                          |
| i18n for backend messages     | ✓                 | ✓                          |

---

## Features Nick Has That Plone Doesn't (Built-in)

| Feature                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| **`@generate` endpoint**   | Built-in RAG support with LLM integration     |
| **Embedding-based search** | Vector similarity search via `SearchableText` |
| **`@related` endpoint**    | Returns related documents based on embeddings |
| **`@chat` endpoint**       | Conversational AI interface                   |

These are native features in Nick, not add-ons.

---

## Features Plone Has That Nick May Not

| Feature                       | Notes                           |
| ----------------------------- | ------------------------------- |
| Massive add-on ecosystem      | 20+ years of community packages |
| collective.\* packages        | Specific integrations           |
| Built-in comments/discussions | Native in Plone                 |
| Extensive community support   | Large user base                 |

---

## Sync vs Async: What It Means

### The Problem: I/O is Slow

A CMS spends most of its time waiting:

- Waiting for database queries
- Waiting for files to be read
- Waiting for external API responses

### Synchronous (Plone)

Each request blocks a worker until complete. To handle 100 concurrent users, you need roughly 100 workers. Each worker consumes memory even when just waiting.

### Asynchronous (Nick)

A single thread handles many concurrent requests by never blocking. When waiting for I/O, it immediately picks up another task. More efficient for I/O-bound workloads like CMS operations.

### Trade-off

| Aspect                 | Sync (Plone)            | Async (Nick)         |
| ---------------------- | ----------------------- | -------------------- |
| Memory per connection  | High                    | Low                  |
| Concurrent connections | Limited by worker count | Thousands possible   |
| CPU-bound tasks        | Fine (one per worker)   | Can block event loop |
| I/O-bound tasks        | Inefficient             | Very efficient       |

---

## When to Choose Nick

✓ You want simpler deployment (Node.js + PostgreSQL)  
✓ You want **one language everywhere** (JavaScript for both backend and frontend)  
✓ You don't need specific Plone add-ons  
✓ You want built-in AI/RAG capabilities  
✓ You value a lean, readable codebase  
✓ You're starting a new project (no migration needed)

## When to Choose Plone

✓ You need specific collective.\* packages  
✓ You have existing Plone content to migrate  
✓ You need the large community support network  
✓ Your organization is standardized on Plone  
✓ You need battle-tested enterprise features  
✓ Your team is stronger in Python than JavaScript

---

## The Single Language Advantage

One of Nick's most practical benefits is **JavaScript everywhere**.

### Plone + Volto: Two Languages

| Frontend (Volto)        | Backend (Plone)         |
| ----------------------- | ----------------------- |
| JavaScript / TypeScript | Python                  |
| React                   | Zope                    |
| npm / pnpm / yarn       | pip / buildout          |
| Node.js runtime         | Python runtime          |
| Vitest for testing      | pytest for testing      |

Two languages, two toolchains, two mental models

### Nick + Volto: One Language

| Frontend (Volto)        | Backend (Nick)          |
| ----------------------- | ----------------------- |
| JavaScript / TypeScript | JavaScript              |
| React                   | Node.js / Express       |
| npm / pnpm              | npm / pnpm              |
| Node.js runtime         | Node.js runtime         |
| Vitest for testing      | Vitest for testing      |

One language, one toolchain, one mental model

### Practical Benefits

| Aspect                       | Plone + Volto                 | Nick + Volto                               |
| ---------------------------- | ----------------------------- | ------------------------------------------ |
| **Languages to know**        | Python + JavaScript           | JavaScript                                 |
| **Package managers**         | pip + npm                     | npm/pnpm only                              |
| **Build environments**       | Two (Python + Node)           | One (Node)                                 |
| **Hiring**                   | Need both skill sets          | JavaScript developers                      |
| **Code sharing**             | Limited (different languages) | Utilities, types, validation can be shared |
| **Debugging**                | Two different debuggers/tools | Same tools everywhere                      |
| **Mental context switching** | High                          | Low                                        |

This doesn't make Plone wrong — Python is a great language with a mature ecosystem. But if your team is already JavaScript-focused, or you want to minimize complexity, the single-language stack is a significant advantage.

---

## Programming Paradigm Shift

Moving from Plone to Nick isn't just a language change — it's a shift in how you think about the system.

### Plone/Python: Object-Oriented with Zope Patterns

| Concept                          | Description                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Acquisition**                  | Objects inherit attributes from their containers at runtime. A page "acquires" properties from its parent folder.     |
| **Persistent Objects**           | Content is stored as Python objects in ZODB. You work with objects directly, and changes are automatically persisted. |
| **Component Architecture (ZCA)** | Adapters, utilities, and interfaces. You register components and look them up by interface.                           |
| **ZCML**                         | XML configuration files that wire components together declaratively.                                                  |
| **Traversal**                    | URLs map to object paths. `/news/my-article` traverses the object tree.                                               |

```python
# Plone: Getting a content object
from plone import api
page = api.content.get(path='/news/my-article')
page.title = "New Title"  # Change persists automatically via ZODB
```

### Nick/Node.js: Functional and Event-Driven

| Concept                    | Description                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Middleware**             | Functions that process requests in sequence. Each can modify the request/response or pass control to the next. |
| **Promises / async-await** | Asynchronous operations return promises. You `await` results instead of blocking.                              |
| **JSONB Queries**          | Content is stored as JSON in PostgreSQL. You query with SQL, not object traversal.                             |
| **Event Loop**             | Single thread handles many requests by never blocking on I/O.                                                  |
| **Stateless Requests**     | Each request is independent. No persistent objects in memory between requests.                                 |

```javascript
// Nick: Getting a content object
const result = await pool.query('SELECT * FROM documents WHERE path = $1', [
  '/news/my-article',
]);
const page = result.rows[0];
// To update, you run an UPDATE query — explicit, not automatic
```

### Key Mental Model Differences

| Aspect            | Plone                                 | Nick                                  |
| ----------------- | ------------------------------------- | ------------------------------------- |
| **Data**          | Live objects in memory (ZODB)         | JSON rows in PostgreSQL               |
| **Persistence**   | Automatic (object changes persist)    | Explicit (run SQL to save)            |
| **Configuration** | ZCML, GenericSetup XML                | JavaScript config files               |
| **Extension**     | Adapters, subscribers, browser views  | Middleware, route handlers            |
| **Debugging**     | Object inspection, acquisition chains | Request/response logging, SQL queries |

You don't need to master all these concepts to use Nick — the API hides most of the internals. But understanding the paradigm helps when you need to extend or debug.

---

## Summary

Nick proves that Plone's conceptual model is sound. The hierarchical content tree, behaviors, workflows, security model — all of it can be reimplemented cleanly in a fraction of the code.

The 100:1 code ratio isn't because Plone is poorly written. It's because Plone carries 20+ years of backward compatibility, multiple ways to do things, and an enormous ecosystem. Nick is what you get when you keep the good ideas and start fresh.

For new projects without legacy requirements, Nick offers a compelling alternative: same API, same frontend (Volto), simpler stack.

## License

The project is licensed under the MIT License.
