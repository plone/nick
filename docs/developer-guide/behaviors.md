---
title: Behaviors
parent: Developer guide
permalink: /developer-guide/behaviors
---

# Behaviors

Behaviors are mixins that add or overwrite methods and schema fields to content types. When a document has a behavior assigned, its methods are copied directly onto the document instance.

## Behavior structure

### Runtime behavior (JavaScript)

Create a file that exports an object with methods. Methods use `function` syntax (not arrow functions) if they need access to the document instance via `this`:

```ts
// src/behaviors/my-behavior/my-behavior.ts
export const myBehavior = {
  myMethod: function (this: Document, param: string): void {
    // `this` is the document instance
    console.log(`Called on ${this.path} with ${param}`);
  },
};
```

### Schema behavior (JSON)

If your behavior adds fields to the content type's edit form, define a JSON file in the profile's `behaviors/` directory:

```json
{
  "id": "my_behavior",
  "title:i18n": "My Behavior",
  "description:i18n": "Description of what this behavior adds.",
  "schema": {
    "fieldsets": [
      {
        "fields": ["myField"],
        "id": "settings",
        "title:i18n": "Settings"
      }
    ],
    "properties": {
      "myField": {
        "title:i18n": "My Field",
        "description:i18n": "Field description",
        "type": "string"
      }
    }
  }
}
```

If your behavior only provides runtime methods and no schema fields, the JSON file is not needed.

## Registration

### 1. Register in a profile's `init()` function

Import and register the behavior so it's available at runtime:

```ts
// src/profiles/core/index.ts
import behaviors from '../../behaviors';
import { myBehavior } from '../../behaviors/my-behavior/my-behavior';

// In init():
behaviors.register('my_behavior', myBehavior);
```

The first argument is the behavior name — this must match the `id` in the JSON file (if any) and the string used in type schemas.

### 2. Add to a content type's behavior list

In the type's JSON definition, add the behavior name to the `schema.behaviors` array:

```json
{
  "id": "Page",
  "schema": {
    "behaviors": ["dublin_core", "my_behavior"]
  }
}
```
