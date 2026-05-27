HTTP/1.1 200 OK
Content-Type: application/json

{
  "required": ["title"],
  "fieldsets": [
    {
      "behavior": "default",
      "id": "default",
      "title": "Default",
      "fields": ["title", "description", "changeNote"]
    },
    {
      "behavior": "categorization",
      "id": "categorization",
      "title": "Categorization",
      "fields": ["subjects", "language", "relatedItems", "coverage"]
    },
    {
      "behavior": "ownership",
      "id": "ownership",
      "title": "Ownership",
      "fields": ["rights", "source", "publisher"]
    },
    {
      "behavior": "dates",
      "id": "dates",
      "title": "Dates",
      "fields": ["effective", "expires"]
    },
    {
      "behavior": "blocks",
      "id": "layout",
      "title": "Layout",
      "fields": ["blocks", "blocks_layout"]
    },
    {
      "behavior": "short_name",
      "id": "settings",
      "title": "Settings",
      "fields": ["id", "exclude_from_nav"]
    }
  ],
  "layouts": [],
  "properties": {
    "id": {
      "behavior": "short_name",
      "type": "string",
      "title": "Identifier",
      "description": "This name will be displayed in the URL."
    },
    "title": {
      "behavior": "basic",
      "type": "string",
      "title": "Title",
      "description": "A name given to this item."
    },
    "blocks": {
      "behavior": "blocks",
      "type": "dict",
      "title": "Blocks",
      "widget": "json",
      "default": {},
      "description": "The JSON representation of the object blocks information. Must be a JSON object."
    },
    "rights": {
      "behavior": "ownership",
      "type": "string",
      "title": "Rights",
      "description": "Information about rights held in and over this item."
    },
    "source": {
      "behavior": "ownership",
      "type": "string",
      "title": "Source",
      "description": "A related item from which this item is derived."
    },
    "expires": {
      "behavior": "dates",
      "type": "string",
      "title": "Expiration Date",
      "widget": "datetime",
      "description": "When this date is reached, the content will no longer be visible in listings and searches."
    },
    "exclude_from_nav": {
      "behavior": "exclude_from_nav",
      "type": "boolean",
      "title": "Exclude from navigation",
      "description": "If selected, this item will not appear in the navigation tree."
    },
    "coverage": {
      "behavior": "categorization",
      "type": "string",
      "title": "Coverage",
      "description": "The spatial or temporal topic of this item, spatial applicability of this item, or jurisdiction under which this item is relevant."
    },
    "language": {
      "behavior": "categorization",
      "type": "string",
      "title": "Language",
      "factory": "Choice",
      "vocabulary": {
        "@id": "availableLanguages"
      },
      "description": "The language of this item."
    },
    "subjects": {
      "behavior": "categorization",
      "type": "string",
      "title": "Tags",
      "factory": "Choice",
      "vocabulary": {
        "@id": "subjects"
      },
      "description": "The topic of this item."
    },
    "effective": {
      "behavior": "dates",
      "type": "string",
      "title": "Publishing Date",
      "widget": "datetime",
      "description": "If this date is in the future, the content will not show up in listings and searches until this date."
    },
    "publisher": {
      "behavior": "ownership",
      "type": "string",
      "title": "Publisher",
      "description": "An entity responsible for making this item available."
    },
    "changeNote": {
      "behavior": "versioning",
      "type": "string",
      "title": "Change Note",
      "description": "Enter a comment that describes the changes you made."
    },
    "description": {
      "behavior": "basic",
      "type": "string",
      "title": "Description",
      "widget": "textarea",
      "description": "A description of this item."
    },
    "relatedItems": {
      "behavior": "categorization",
      "type": "array",
      "items": {
        "type": "string",
        "title": "Related",
        "description": ""
      },
      "title": "Related Items",
      "default": [],
      "description": "Related resources.",
      "factory": "Relation List",
      "uniqueItems": true,
      "additionalItems": true,
      "widgetOptions": {
        "pattern_options": {
          "recentlyUsed": true
        }
      }
    },
    "blocks_layout": {
      "behavior": "blocks",
      "type": "dict",
      "title": "Blocks Layout",
      "widget": "json",
      "default": {
        "items": []
      },
      "description": "The JSON representation of the object blocks layout. Must be a JSON array."
    }
  },
  "title": "Page"
}
